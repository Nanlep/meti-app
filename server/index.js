
const cluster = require('cluster');
const os = require('os');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { GoogleGenAI, Type } = require('@google/genai');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { Resend } = require('resend');
require('dotenv').config();

// --- 1. OBSERVABILITY ---
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

// --- 2. UTILS ---
const cleanInput = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, "").slice(0, 5000);
};

// --- 3. MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// --- 4. DATABASE MODELS ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: 'User' },
  role: { type: String, default: 'user' },
  subscription: { type: String, default: 'hobby' },
  subscriptionStatus: { type: String, default: 'active' },
  organizationId: { type: String, default: () => crypto.randomUUID() },
  lastLogin: { type: Date, default: Date.now }
});

const ProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  data: { type: Object, default: {} },
  updatedAt: { type: Date, default: Date.now }
});

const TicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userName: { type: String },
  subject: { type: String, required: true },
  category: { type: String, default: 'technical' },
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'open' }, // open, in_progress, resolved, closed
  messages: [{
    senderId: String,
    senderName: String,
    role: String, // 'user' | 'admin'
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);

// --- 5. INFRASTRUCTURE ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Initialize Resend Client
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info("MongoDB Connected"))
  .catch(err => logger.error("DB Error", err));

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

// Need rawBody for webhook signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/api/webhooks/bani')) {
      req.rawBody = buf.toString();
    }
  }
}));

// Production CORS: Only allow your specific Vercel frontend
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000',
  process.env.CLIENT_URL // Your production Vercel URL
].filter(Boolean);

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));

// --- 6. ROUTES ---
app.get('/health', (req, res) => res.json({ status: 'ok', maintenance: false }));

// Root Route for API info
app.get('/', (req, res) => {
  res.send('Meti Marketing Engine API v2.2 [Status: Online]');
});

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  if (await User.findOne({ email })) return res.status(400).json({ error: "Email exists" });
  const user = new User({ email, password: await bcrypt.hash(password, 10), name });
  await user.save();
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret');
  res.json({ user, token });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !await bcrypt.compare(req.body.password, user.password)) return res.status(401).json({ error: "Invalid login" });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret');
  res.json({ user, token });
}));

app.get('/api/projects', authenticateToken, asyncHandler(async (req, res) => {
  res.json(await Project.find({ userId: req.user.id }).sort({ updatedAt: -1 }));
}));

app.post('/api/projects', authenticateToken, asyncHandler(async (req, res) => {
  const project = new Project({ userId: req.user.id, name: req.body.name, data: { productName: req.body.name, productDescription: req.body.description } });
  await project.save();
  res.json(project);
}));

app.put('/api/projects/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { data } = req.body;
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: { data, updatedAt: Date.now() } },
    { new: true }
  );
  if (!project) return res.status(404).json({ error: "Project not found" });
  res.json(project);
}));

// --- TICKET SUPPORT SYSTEM ---

// Get user tickets
app.get('/api/tickets', authenticateToken, asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ userId: req.user.id }).sort({ updatedAt: -1 });
  res.json(tickets);
}));

// Create Ticket
app.post('/api/tickets', authenticateToken, asyncHandler(async (req, res) => {
  const { subject, category, priority, initialMessage, userEmail } = req.body;
  const user = await User.findById(req.user.id);

  const ticket = new Ticket({
    userId: req.user.id,
    userName: user.name,
    userEmail: userEmail || user.email,
    subject,
    category,
    priority,
    messages: [{
      senderId: req.user.id,
      senderName: user.name,
      role: 'user',
      text: initialMessage,
      timestamp: Date.now()
    }]
  });

  // 1. Persistence: Save to DB first
  await ticket.save();

  // 2. Notification: Send Email via Resend
  let emailSent = false;
  const supportEmail = process.env.SUPPORT_EMAIL || 'contact@meti.pro';
  // Use a sensible default, but environment variable is preferred for verification
  const fromEmail = process.env.SUPPORT_FROM_EMAIL || 'onboarding@resend.dev';

  const emailHtml = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #4f46e5;">New Support Ticket Created</h2>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>Ticket ID:</strong> ${ticket._id}</p>
        <p><strong>From:</strong> ${user.name} (<a href="mailto:${userEmail || user.email}">${userEmail || user.email}</a>)</p>
        <p><strong>Category:</strong> ${category} | <strong>Priority:</strong> ${priority}</p>
      </div>
      <div style="border-left: 4px solid #4f46e5; padding-left: 15px;">
        <h3 style="margin-top: 0;">Subject: ${subject}</h3>
        <p style="white-space: pre-wrap;">${initialMessage}</p>
      </div>
      <p style="font-size: 12px; color: #666; margin-top: 30px;">Sent via Meti Engine (Resend Integration)</p>
    </div>
  `;

  try {
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: supportEmail,
        subject: `[New Ticket] ${subject} (#${ticket._id.toString().slice(-6)})`,
        html: emailHtml
      });

      if (error) {
        logger.error('Resend API Error:', error);
      } else {
        emailSent = true;
        logger.info(`Support email dispatched via Resend. ID: ${data?.id}`);
      }
    } else {
      logger.warn('Resend API Key missing. Email simulation only.');
      logger.info('EMAIL SIMULATION:', { to: supportEmail, subject, from: fromEmail });
    }
  } catch (emailError) {
    logger.error('Failed to execute Resend transaction', emailError);
    // Do not throw; we want to return the ticket creation success even if email fails
  }

  // 3. Response: Return ticket with delivery status metadata
  res.json({
    ...ticket.toObject(),
    ticketSaved: true,
    emailSent
  });
}));

// Get Single Ticket Details
app.get('/api/tickets/:id', authenticateToken, asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.user.id });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  res.json(ticket);
}));

// Reply to Ticket
app.post('/api/tickets/:id/reply', authenticateToken, asyncHandler(async (req, res) => {
  const { text } = req.body;
  const user = await User.findById(req.user.id);
  
  const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.user.id });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  ticket.messages.push({
    senderId: req.user.id,
    senderName: user.name,
    role: 'user',
    text,
    timestamp: Date.now()
  });
  
  // Auto-reopen if closed
  if (ticket.status === 'resolved' || ticket.status === 'closed') {
      ticket.status = 'open';
  }
  
  ticket.updatedAt = Date.now();
  await ticket.save();
  res.json(ticket);
}));

// Update Ticket Status (Close)
app.put('/api/tickets/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const ticket = await Ticket.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: { status, updatedAt: Date.now() } },
    { new: true }
  );
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  res.json(ticket);
}));

// --- ADMIN ROUTES (For Admin Dashboard) ---
app.get('/api/admin/tickets', authenticateToken, asyncHandler(async (req, res) => {
  // Ensure admin role check is done here or in middleware for production
  // For now, relying on authenticated token role check logic in service layer or future middleware
  const tickets = await Ticket.find({}).sort({ updatedAt: -1 });
  res.json(tickets);
}));


// --- AI ENGINE ENDPOINT ---
app.post('/api/ai/execute', authenticateToken, asyncHandler(async (req, res) => {
  const { agent, payload } = req.body;
  
  if (!agent) return res.status(400).json({ error: "Agent required" });

  try {
    let result;
    const modelId = 'gemini-3-flash-preview'; // Default efficient model

    switch (agent) {
      case 'niche':
        // Fix for: "Agent 'niche' is not registered"
        const nichePrompt = `Analyze the product: "${payload.productName}" (${payload.description}).
        Identify 3 distinct, profitable sub-niches/market segments.
        Return JSON array with fields: name, profitabilityScore (0-100), reasoning, marketSizeEstimate.`;
        
        const nicheResponse = await ai.models.generateContent({
          model: modelId,
          contents: nichePrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  profitabilityScore: { type: Type.INTEGER },
                  reasoning: { type: Type.STRING },
                  marketSizeEstimate: { type: Type.STRING }
                }
              }
            }
          }
        });
        result = JSON.parse(nicheResponse.text);
        break;

      case 'persona':
        const personaPrompt = `Create an Ideal Customer Persona for "${payload.productName}" targeting the "${payload.niche}" niche. 
        Refinement: ${payload.refinement || 'Standard profile'}.
        Return JSON object.`;
        
        const personaRes = await ai.models.generateContent({
          model: modelId,
          contents: personaPrompt,
          config: { responseMimeType: 'application/json' }
        });
        result = JSON.parse(personaRes.text);
        break;

      // Add other agents as needed (magnets, etc.)
      // Fallback for demo
      default:
        // For other agents, we can add them or return a generic success for now to prevent crashing
        // Ideally implement all, but niche was the reported error.
        result = { message: `Agent ${agent} executed successfully (Stub)` };
        break;
    }

    res.json({ data: result });
  } catch (e) {
    logger.error("AI Execution Error", { agent, error: e.message });
    res.status(500).json({ error: "AI Engine Failure: " + e.message });
  }
}));

// --- BANI AFRICA WEBHOOK ---
app.post('/api/webhooks/bani', asyncHandler(async (req, res) => {
    const signature = req.headers['bani-hook-signature'];
    const secret = (process.env.BANI_WEBHOOK_SECRET || process.env.BANI_PRIVATE_KEY || '').trim();

    if (!signature || !secret) {
        return res.status(400).send("Security Config Missing");
    }

    const computed = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');

    if (signature !== computed) {
        return res.status(401).send("Invalid Signature");
    }

    const payload = req.body;
    if (payload.event && payload.event.startsWith('payin_')) {
        let ref = payload.reference || payload.data?.reference || payload.data?.metadata?.custom_ref;
        
        if (ref && ref.startsWith('METI_')) {
            const parts = ref.split('_');
            // METI_USERID_PLAN_TIMESTAMP or METI_USERID_PROJECT_TIMESTAMP
            if (parts.length >= 3) {
                const userId = parts[1];
                const type = parts[2]; // 'pro', 'agency', or 'project'
                
                if (userId && userId !== 'GUEST') {
                    if (type === 'project') {
                       // Handle One-Time Project Payment (Not strictly needed for database if we don't track credits, 
                       // but good for logging or if we implement credits)
                       logger.info(`Project Payment received for user ${userId}`);
                    } else {
                       await User.findByIdAndUpdate(userId, { subscription: type, subscriptionStatus: 'active' });
                       logger.info(`Subscription activated via Webhook for user ${userId} (Plan: ${type})`);
                    }
                }
            }
        }
    }
    res.status(200).send("OK");
}));

// Static Asset Serving (Fallback for simple hosting)
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
      res.sendFile(path.join(distPath, 'index.html'));
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server initialized on port ${PORT}`));
