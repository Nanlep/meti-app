
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

if (process.env.TEST_EMAIL) {
    logger.info(`System Notification: Test Account Enabled for ${process.env.TEST_EMAIL}`);
}

// --- 2. UTILS ---
const cleanInput = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, "").slice(0, 5000);
};

// Helper to consistently format user response and inject system flags
const enhanceUser = (userDoc) => {
    // Handle mongoose doc or plain object
    let u = userDoc.toObject ? userDoc.toObject() : userDoc;
    
    // Manual ID transformation if not handled by mongoose virtuals yet
    if (u._id && !u.id) {
        u.id = u._id.toString();
        delete u._id;
    }
    delete u.password;

    // Inject Test Account Flag
    if (process.env.TEST_EMAIL && u.email === process.env.TEST_EMAIL) {
        u.isTestAccount = true;
        // Force agency subscription for test account
        u.subscription = 'agency';
        u.subscriptionStatus = 'active';
    }
    
    return u;
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
const schemaOptions = {
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) { 
        ret.id = ret._id.toString();
        delete ret._id; 
        delete ret.password; // Never return password
    }
  },
  toObject: { virtuals: true }
};

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: 'User' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  subscription: { type: String, enum: ['hobby', 'pro', 'agency'], default: 'hobby' },
  subscriptionStatus: { type: String, default: 'active' },
  organizationId: { type: String, default: () => crypto.randomUUID() },
  lastLogin: { type: Date, default: Date.now },
  // Branding Fields
  agencyLogoUrl: { type: String },
  agencyName: { type: String },
  adBrandLogoUrl: { type: String }
}, schemaOptions);

const ProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  data: { type: Object, default: {} },
  client: { type: String }, // Legacy
  clientId: { type: String }, // New
  teamMembers: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, schemaOptions);

const TicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userName: { type: String },
  subject: { type: String, required: true },
  category: { type: String, default: 'technical' },
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'open' },
  messages: [{
    senderId: String,
    senderName: String,
    role: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, schemaOptions);

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);

// --- 5. INFRASTRUCTURE ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info("MongoDB Connected"))
  .catch(err => logger.error("DB Error", err));

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/api/webhooks/bani')) {
      req.rawBody = buf.toString();
    }
  }
}));

app.use(cors({ origin: true, credentials: true }));

// --- 6. ROUTES ---
app.get('/health', (req, res) => res.json({ status: 'ok', maintenance: false }));

// AUTH with ENV-based Admin & Test Logic
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  if (await User.findOne({ email })) return res.status(400).json({ error: "Email exists" });
  
  const isTestUser = process.env.TEST_EMAIL && email.trim() === process.env.TEST_EMAIL.trim();

  const user = new User({ 
    email, 
    password: await bcrypt.hash(password, 10), 
    name,
    role: 'user', 
    subscription: isTestUser ? 'agency' : 'hobby',
    subscriptionStatus: 'active'
  });
  
  await user.save();
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret');
  res.json({ user: enhanceUser(user), token });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL) {
      if (password === process.env.ADMIN_PASSWORD) {
          let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
          if (!adminUser) {
              adminUser = new User({
                  email: process.env.ADMIN_EMAIL,
                  password: await bcrypt.hash(password, 10),
                  name: 'System Administrator',
                  role: 'admin',
                  subscription: 'agency'
              });
              await adminUser.save();
          }
          const token = jwt.sign({ id: adminUser._id, role: 'admin' }, process.env.JWT_SECRET || 'secret');
          return res.json({ user: enhanceUser(adminUser), token });
      } else {
          return res.status(401).json({ error: "Invalid admin credentials" });
      }
  }

  const testEmail = process.env.TEST_EMAIL ? process.env.TEST_EMAIL.trim() : null;
  const testPass = process.env.TEST_PASSWORD ? process.env.TEST_PASSWORD.trim() : null;

  if (testEmail && email === testEmail) {
      if (password === testPass) {
          let testUser = await User.findOne({ email: testEmail });
          if (!testUser) {
              testUser = new User({
                  email: testEmail,
                  password: await bcrypt.hash(password, 10),
                  name: 'Test Engineer',
                  role: 'user', 
                  subscription: 'agency', 
                  subscriptionStatus: 'active'
              });
              await testUser.save();
          } else {
              // Enforce agency tier for test user always
              if (testUser.subscription !== 'agency') {
                  testUser.subscription = 'agency';
                  testUser.subscriptionStatus = 'active';
                  await testUser.save();
              }
          }
          const token = jwt.sign({ id: testUser._id, role: 'user' }, process.env.JWT_SECRET || 'secret');
          return res.json({ 
              user: enhanceUser(testUser), 
              token 
          });
      } else {
          return res.status(401).json({ error: "Invalid test credentials" });
      }
  }

  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ error: "Invalid login" });
  
  user.lastLogin = Date.now();
  await user.save();
  
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret');
  res.json({ user: enhanceUser(user), token });
}));

// UPDATE PROFILE
app.put('/api/auth/profile', authenticateToken, asyncHandler(async (req, res) => {
    const { name, currentPassword, newPassword, agencyName, agencyLogoUrl, adBrandLogoUrl } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Update Basic Info
    if (name) user.name = cleanInput(name);
    if (agencyName) user.agencyName = cleanInput(agencyName);
    if (agencyLogoUrl) user.agencyLogoUrl = agencyLogoUrl;
    if (adBrandLogoUrl) user.adBrandLogoUrl = adBrandLogoUrl;

    // Handle Password Change
    if (newPassword) {
        if (!currentPassword) {
            return res.status(400).json({ error: "Current password is required to change password" });
        }
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Incorrect current password" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json(enhanceUser(user));
}));

// Projects
app.get('/api/projects', authenticateToken, asyncHandler(async (req, res) => {
  const projects = await Project.find({ userId: req.user.id }).sort({ updatedAt: -1 });
  res.json(projects);
}));

app.post('/api/projects', authenticateToken, asyncHandler(async (req, res) => {
  const project = new Project({ 
      userId: req.user.id, 
      name: req.body.name, 
      data: { 
          productName: req.body.name, 
          productDescription: req.body.description 
      },
      client: req.body.clientName,
      clientId: req.body.clientId
  });
  await project.save();
  res.json(project);
}));

app.put('/api/projects/:id', authenticateToken, asyncHandler(async (req, res) => {
  const updatePayload = { 
      data: req.body.data, 
      updatedAt: Date.now() 
  };
  
  // Only update client fields if provided
  if (req.body.clientName) updatePayload.client = req.body.clientName;
  if (req.body.clientId) updatePayload.clientId = req.body.clientId;

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: updatePayload },
    { new: true }
  );
  res.json(project);
}));

app.get('/api/projects/:id', authenticateToken, asyncHandler(async (req, res) => {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });
    if(!project) return res.status(404).json({error: "Project not found"});
    res.json(project);
}));

// --- TICKET ROUTES ---

// Create Ticket
app.post('/api/tickets', authenticateToken, asyncHandler(async (req, res) => {
    const { subject, category, priority, initialMessage, userEmail } = req.body;
    
    const user = await User.findById(req.user.id);
    const userName = user ? user.name : 'Unknown User';
    const emailToUse = userEmail || (user ? user.email : 'unknown@meti.pro');

    const ticket = new Ticket({
        userId: req.user.id,
        userEmail: emailToUse,
        userName: userName,
        subject,
        category,
        priority,
        messages: [{
            senderId: req.user.id,
            senderName: userName,
            role: 'user',
            text: initialMessage,
            timestamp: new Date()
        }]
    });
    
    await ticket.save();

    // Send Email via Resend
    if (resend) {
        try {
            await resend.emails.send({
                from: process.env.SUPPORT_FROM_EMAIL || 'no-reply@meti.pro',
                to: process.env.SUPPORT_EMAIL || 'contact@meti.pro',
                subject: `[New Ticket] ${subject} - ${userName}`,
                html: `
                    <h1>New Support Request</h1>
                    <p><strong>User:</strong> ${userName} (${emailToUse})</p>
                    <p><strong>Category:</strong> ${category}</p>
                    <p><strong>Priority:</strong> ${priority}</p>
                    <hr />
                    <h3>Message:</h3>
                    <p>${initialMessage}</p>
                    <br/>
                    <p><small>Ticket ID: ${ticket._id}</small></p>
                `
            });
        } catch (emailError) {
            logger.error("Failed to send support email", emailError);
        }
    }

    res.json(ticket);
}));

// Get User Tickets
app.get('/api/tickets', authenticateToken, asyncHandler(async (req, res) => {
    const tickets = await Ticket.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(tickets);
}));

// Get Ticket Detail
app.get('/api/tickets/:id', authenticateToken, asyncHandler(async (req, res) => {
    const ticket = await Ticket.findOne({ _id: req.params.id });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    
    if (ticket.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
    }
    
    res.json(ticket);
}));

// Reply to Ticket
app.post('/api/tickets/:id/reply', authenticateToken, asyncHandler(async (req, res) => {
    const { text } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
    }

    const user = await User.findById(req.user.id);
    const senderName = user ? user.name : (req.user.role === 'admin' ? 'Support Team' : 'User');

    ticket.messages.push({
        senderId: req.user.id,
        senderName,
        role: req.user.role === 'admin' ? 'admin' : 'user',
        text,
        timestamp: new Date()
    });
    
    // Auto-reopen if closed and user replies
    if (req.user.role !== 'admin' && (ticket.status === 'closed' || ticket.status === 'resolved')) {
        ticket.status = 'open';
    }

    ticket.updatedAt = Date.now();
    await ticket.save();
    res.json(ticket);
}));

// Update Status
app.put('/api/tickets/:id/status', authenticateToken, asyncHandler(async (req, res) => {
    const { status } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // User can close/resolve their own ticket, Admin can do any status change
    if (ticket.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
    }

    ticket.status = status;
    ticket.updatedAt = Date.now();
    await ticket.save();
    res.json(ticket);
}));

// Admin: Get All Tickets
app.get('/api/admin/tickets', authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
    const tickets = await Ticket.find({}).sort({ updatedAt: -1 });
    res.json(tickets);
}));

// Admin Routes
app.get('/api/admin/stats', authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
    
    // Fetch counts from DB
    const usersCount = await User.countDocuments();
    const projectsCount = await Project.countDocuments();
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } });
    
    // Estimate MRR
    const proUsers = await User.countDocuments({ subscription: 'pro' });
    const agencyUsers = await User.countDocuments({ subscription: 'agency' });
    const mrr = (proUsers * 49888) + (agencyUsers * 298998);

    // Simple activity metric: projects updated in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeProjects = await Project.countDocuments({ updatedAt: { $gt: oneDayAgo } });

    res.json({ 
      totalUsers: usersCount, 
      totalProjects: projectsCount, 
      revenueMRR: mrr, 
      apiCallsToday: activeProjects,
      tickets: { total: totalTickets, open: openTickets }
    }); 
}));

app.get('/api/admin/users', authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
    const users = await User.find({}).sort({ lastLogin: -1 });
    res.json(users.map(u => enhanceUser(u)));
}));

// --- SOCIAL POSTING (AYRSHARE) ---
app.post('/api/social/post', authenticateToken, asyncHandler(async (req, res) => {
    const { platforms, content, mediaUrl } = req.body;
    const apiKey = process.env.AYRSHARE_API_KEY;

    if (!apiKey) {
        return res.status(503).json({ error: "Social integration not configured (Missing API Key)" });
    }

    // Map UI platforms to Ayrshare codes (must be lowercase)
    const mappedPlatforms = (platforms || []).map(p => p.toLowerCase());

    const payload = {
        post: content,
        platforms: mappedPlatforms,
        mediaUrls: mediaUrl ? [mediaUrl] : undefined
    };

    try {
        const ayrRes = await fetch('https://app.ayrshare.com/api/post', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await ayrRes.json();

        if (data.status === 'error') {
            logger.error('Ayrshare Error', data);
            return res.status(400).json({ error: data.message || "Posting failed" });
        }

        logger.info(`Social Post Sent by ${req.user.id}`, { platforms: mappedPlatforms });
        res.json({ success: true, refId: data.id, ...data });
    } catch (e) {
        logger.error("Social API Error", e);
        res.status(500).json({ error: "Failed to connect to social gateway" });
    }
}));

// NEW: Social Platforms Status
app.get('/api/social/platforms', authenticateToken, asyncHandler(async (req, res) => {
    const apiKey = process.env.AYRSHARE_API_KEY;
    if (!apiKey) return res.json([]);

    try {
        const ayrRes = await fetch('https://app.ayrshare.com/api/user', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await ayrRes.json();
        
        let platforms = [];
        if (data.social) {
             platforms = Object.keys(data.social);
        } else if (data.profiles) {
             platforms = data.profiles.map(p => p.type || p.platform);
        }
        
        // Normalize platform names
        platforms = platforms.map(p => p.toLowerCase());
        
        res.json(platforms);
    } catch (e) {
        logger.error("Ayrshare User Check Failed", e);
        res.status(500).json({ error: "Failed to check social status" });
    }
}));

// --- AI ENGINE ENDPOINT ---
app.post('/api/ai/execute', authenticateToken, asyncHandler(async (req, res) => {
  const { agent, payload } = req.body;
  if (!agent) return res.status(400).json({ error: "Agent required" });

  const flashModel = 'gemini-3-flash-preview';
  const proModel = 'gemini-3-pro-preview';
  const mapsModel = 'gemini-2.5-flash';

  try {
    let result;
    switch (agent) {
      case 'niche':
        const nicheRes = await ai.models.generateContent({
          model: flashModel,
          contents: `Analyze product: "${payload.productName}". Description: "${payload.description || ''}". Focus: ${payload.focus || 'Any'}. Find 3 profitable niches.`,
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
        result = JSON.parse(nicheRes.text);
        break;
      
      case 'persona':
        const personaRes = await ai.models.generateContent({
          model: flashModel,
          contents: `Create Ideal Customer Persona for product "${payload.productName}" (${payload.description || ''}) in niche "${payload.niche}". Refine: ${payload.refinement || 'Standard'}.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                jobTitle: { type: Type.STRING },
                ageRange: { type: Type.STRING },
                psychographics: { type: Type.ARRAY, items: { type: Type.STRING } },
                painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                buyingTriggers: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        });
        result = JSON.parse(personaRes.text);
        break;

      case 'magnets':
        const magnetRes = await ai.models.generateContent({
          model: flashModel,
          contents: `Generate 4 lead magnet ideas for ${payload.persona} interested in ${payload.productName} (${payload.description || ''}).`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING },
                  hook: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        });
        result = JSON.parse(magnetRes.text);
        break;

      case 'magnet_content':
        const mcRes = await ai.models.generateContent({
            model: proModel,
            contents: `Write draft content for a lead magnet titled "${payload.magnet.title}" (${payload.magnet.type}). 
            Target Audience: ${payload.persona}. Niche: ${payload.nicheName}. Product: ${payload.productName} (${payload.description || ''}).
            Structure: Introduction, 3 Key Chapters, Conclusion/CTA.`
        });
        result = mcRes.text;
        break;

      case 'magnet_promo':
        const promoRes = await ai.models.generateContent({
            model: flashModel,
            contents: `Write a promotional social media post for ${payload.platform}. 
            Asset: "${payload.magnet.title}". Link: ${payload.link}. Persona: ${payload.persona}. Product Context: ${payload.description || ''}.`
        });
        result = promoRes.text;
        break;

      case 'ad_creatives':
        const adsRes = await ai.models.generateContent({
          model: flashModel,
          contents: `Write ads for ${payload.productName} (${payload.description || ''}) targeting ${payload.persona}. URL: ${payload.url || 'N/A'}.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  headline: { type: Type.STRING },
                  adCopy: { type: Type.STRING },
                  hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  visualPrompt: { type: Type.STRING }
                }
              }
            }
          }
        });
        result = JSON.parse(adsRes.text);
        break;

      case 'landing_page':
        const personaContext = typeof payload.persona === 'string' 
            ? payload.persona 
            : `Role: ${payload.persona.jobTitle}, Key Pain Points: ${(payload.persona.painPoints || []).slice(0,3).join(', ')}`;
        
        const nicheName = payload.niche?.name || payload.niche || 'General Market';

        const lpRes = await ai.models.generateContent({
          model: flashModel,
          contents: `Draft high-converting landing page copy for ${payload.productName} (${payload.description || ''}). 
          Target Audience: ${personaContext}. 
          Market Niche: ${nicheName}.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                subheadline: { type: Type.STRING },
                ctaPrimary: { type: Type.STRING },
                ctaSecondary: { type: Type.STRING },
                heroImagePrompt: { type: Type.STRING },
                benefits: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: { title: { type: Type.STRING }, description: { type: Type.STRING } } 
                  } 
                },
                socialProof: { 
                   type: Type.ARRAY, 
                   items: { 
                     type: Type.OBJECT, 
                     properties: { name: { type: Type.STRING }, quote: { type: Type.STRING }, role: { type: Type.STRING } } 
                   } 
                }
              }
            }
          }
        });
        result = JSON.parse(lpRes.text);
        break;

      case 'maps_scout':
        const mapsRes = await ai.models.generateContent({
          model: mapsModel,
          contents: `Find businesses in ${payload.location} that match the niche "${payload.niche}". Provide a list with details.`,
          config: { tools: [{ googleMaps: {} }] }
        });
        result = { 
          text: mapsRes.text, 
          mapChunks: mapsRes.candidates[0].groundingMetadata?.groundingChunks || []
        };
        break;

      case 'social_search':
        const ssRes = await ai.models.generateContent({
            model: flashModel,
            contents: `Generate 5 Boolean search strings to find "${payload.persona.jobTitle}" in niche "${payload.niche}" on LinkedIn, Twitter, and Google.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            platform: { type: Type.STRING },
                            query: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                            directUrl: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        result = JSON.parse(ssRes.text);
        break;

      case 'qualification':
        const qualRes = await ai.models.generateContent({
            model: flashModel,
            contents: `Create a 5-question BANT qualification framework for ${payload.productName} (${payload.description || ''}) targeting ${payload.persona}.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            intent: { type: Type.STRING },
                            idealAnswer: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        result = JSON.parse(qualRes.text);
        break;

      case 'objection_handler':
        const objRes = await ai.models.generateContent({
            model: flashModel,
            contents: `Provide 3 short, punchy rebuttals to the sales objection: "${payload.objection}". Product: ${payload.productName} (${payload.description || ''}). Persona: ${payload.persona}.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        result = JSON.parse(objRes.text);
        break;

      case 'cold_dms':
        const dmRes = await ai.models.generateContent({
            model: flashModel,
            contents: `Write 3 variations of cold DM scripts for ${payload.productName} (${payload.description || ''}) targeting ${payload.persona}. Keep it under 280 chars.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        result = JSON.parse(dmRes.text);
        break;

      case 'follow_up':
        const fuRes = await ai.models.generateContent({
            model: flashModel,
            contents: `Create a 3-email follow-up sequence for non-responsive leads. Product: ${payload.productName} (${payload.description || ''}). Persona: ${payload.persona}.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            subject: { type: Type.STRING },
                            previewText: { type: Type.STRING },
                            body: { type: Type.STRING },
                            sendDelay: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        result = JSON.parse(fuRes.text);
        break;

      case 'email_campaign':
        const emailRes = await ai.models.generateContent({
            model: proModel,
            contents: `Write an email campaign. Topic: ${payload.topic}. Goal: ${payload.goal}. Product: ${payload.productName} (${payload.description || ''}). Persona: ${payload.persona}.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subject: { type: Type.STRING },
                        body: { type: Type.STRING }
                    }
                }
            }
        });
        result = JSON.parse(emailRes.text);
        break;

      case 'subject_lines':
        const slRes = await ai.models.generateContent({
            model: flashModel,
            contents: `Generate 5 viral email subject lines for topic: "${payload.topic}". Target: ${payload.persona}. Product: ${payload.productName}.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        result = JSON.parse(slRes.text);
        break;

      case 'seo_audit':
        const auditRes = await ai.models.generateContent({
            model: proModel,
            contents: `Perform a technical SEO audit simulation for ${payload.url}. Identify potential critical issues, warnings, and passed checks based on standard best practices for ${payload.productName}.`,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        const structuredAudit = await ai.models.generateContent({
             model: flashModel,
             contents: `Based on this analysis: ${auditRes.text}, format into JSON list of issues.`,
             config: {
                 responseMimeType: 'application/json',
                 responseSchema: {
                     type: Type.OBJECT,
                     properties: {
                         results: {
                             type: Type.ARRAY,
                             items: {
                                 type: Type.OBJECT,
                                 properties: {
                                     severity: { type: Type.STRING },
                                     category: { type: Type.STRING },
                                     issue: { type: Type.STRING },
                                     recommendation: { type: Type.STRING }
                                 }
                             }
                         }
                     }
                 }
             }
        });
        const auditJson = JSON.parse(structuredAudit.text);
        result = {
            results: auditJson.results,
            sources: auditRes.candidates[0].groundingMetadata?.groundingChunks
        };
        break;

      case 'seo_keywords':
        const kwRes = await ai.models.generateContent({
            model: flashModel,
            contents: `Generate keyword strategy for "${payload.seed}" in niche "${payload.niche}". Persona: ${payload.persona}. Product: ${payload.productName} (${payload.description || ''}).`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            keyword: { type: Type.STRING },
                            intent: { type: Type.STRING },
                            volume: { type: Type.STRING },
                            difficulty: { type: Type.INTEGER },
                            opportunityScore: { type: Type.INTEGER }
                        }
                    }
                }
            }
        });
        result = JSON.parse(kwRes.text);
        break;

      case 'content_score':
        const scoreRes = await ai.models.generateContent({
            model: flashModel,
            contents: `Analyze this content for SEO against keyword "${payload.keyword}": "${payload.content.slice(0, 1000)}..."`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER },
                        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        keywordDensity: { type: Type.NUMBER },
                        readability: { type: Type.STRING },
                        missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        result = JSON.parse(scoreRes.text);
        break;

      case 'chat_reply':
        const chatRes = await ai.models.generateContent({
          model: proModel,
          contents: `Simulate ${payload.persona}. User pitch: "${payload.history[payload.history.length-1].text}". Context: User is selling ${payload.productName} (${payload.description || ''}).`,
          config: { 
            systemInstruction: `You are a ${payload.persona} interested in ${payload.productName}. Be skeptical but professional.`,
            tools: [{ googleSearch: {} }]
          }
        });
        result = { 
          text: chatRes.text, 
          sources: chatRes.candidates[0].groundingMetadata?.groundingChunks 
        };
        break;
    }

    res.json({ data: result });
  } catch (e) {
    logger.error("AI Logic Failure", { agent, error: e.message });
    res.status(500).json({ error: "AI Engine logic failed: " + e.message });
  }
}));

// --- STREAMING ENDPOINT ---
app.post('/api/ai/stream', authenticateToken, asyncHandler(async (req, res) => {
    const { history, productName, persona } = req.body;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const modelId = 'gemini-3-pro-preview';

    try {
        const chat = ai.chats.create({
            model: modelId,
            config: {
                systemInstruction: `You are a ${persona} interested in ${productName}. Roleplay a negotiation. Be skeptical. Keep responses short.`,
                tools: [{ googleSearch: {} }]
            }
        });

        const lastMsg = history[history.length - 1].text;
        const resultStream = await chat.sendMessageStream({ message: lastMsg });

        for await (const chunk of resultStream) {
            const text = chunk.text;
            const sources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            res.write(`data: ${JSON.stringify({ text, sources })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (e) {
        logger.error("Streaming Error", e);
        res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
        res.end();
    }
}));

// --- PAYMENT WEBHOOK (HARDENED) ---
app.post('/api/webhooks/bani', asyncHandler(async (req, res) => {
    const signature = req.headers['bani-hook-signature'];
    const secret = (process.env.BANI_WEBHOOK_SECRET || process.env.BANI_PRIVATE_KEY || '').trim();

    if (!signature || !secret) return res.status(400).send("Security Config Missing");

    const computed = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
    if (signature !== computed) return res.status(401).send("Invalid Signature");

    const payload = req.body;
    const amountPaid = parseFloat(payload.amount);
    const currency = payload.currency || 'NGN';
    
    // UPDATED PRICING (NGN)
    const PRICES = { 'pro': 49888, 'agency': 298998, 'project': 14700 };

    if (payload.event && payload.event.startsWith('payin_')) {
        let ref = payload.reference || payload.data?.reference || payload.data?.metadata?.custom_ref;
        if (ref && ref.startsWith('METI_')) {
            const parts = ref.split('_');
            if (parts.length >= 3) {
                const userId = parts[1];
                const type = parts[2];
                const requiredAmount = PRICES[type];
                
                if (currency !== 'NGN' || amountPaid < requiredAmount) {
                    logger.warn(`Payment Fraud Attempt? User: ${userId}, Paid: ${amountPaid}, Required: ${requiredAmount}`);
                    return res.status(200).send("Ignored: Insufficient Amount");
                }

                if (userId && userId !== 'GUEST') {
                    if (type === 'project') {
                       logger.info(`Project Credit Added for ${userId}`);
                    } else {
                       await User.findByIdAndUpdate(userId, { subscription: type, subscriptionStatus: 'active' });
                       logger.info(`Subscription Upgraded: ${userId} -> ${type}`);
                    }
                }
            }
        }
    }
    res.status(200).send("OK");
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Meti Engine Server Live on Port ${PORT}`));
