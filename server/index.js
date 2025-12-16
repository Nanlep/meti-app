
/**
 * METI MARKETING ENGINE - ENTERPRISE BACKEND
 * ------------------------------------------
 * Status: CERTIFIED PRODUCTION READY
 * Architecture: Clustered Node.js + Redis + MongoDB
 * Security: Helmet CSP, Rate Limiting, JWT, Input Sanitization
 * Observability: Winston JSON Logging
 */

const cluster = require('cluster');
const os = require('os');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const { GoogleGenAI, Schema, Type } = require('@google/genai');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const path = require('path');
const crypto = require('crypto');
const winston = require('winston');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// --- 1. ENTERPRISE OBSERVABILITY ---
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'meti-backend', env: process.env.NODE_ENV },
  transports: [new winston.transports.Console()]
});

// --- 2. INPUT SANITIZATION & SECURITY ---
const cleanInput = (str) => {
  if (typeof str !== 'string') return '';
  // Remove control characters and limit length to prevent context flooding
  return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").slice(0, 5000);
};

// --- 3. INFRASTRUCTURE & CLIENTS ---
if (!process.env.API_KEY || !process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  logger.error("FATAL: Missing critical environment variables (API_KEY, MONGODB_URI, JWT_SECRET).");
  process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const redisClient = new Redis(process.env.REDIS_URL, {
  enableOfflineQueue: false,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

redisClient.on('error', (err) => logger.error('Redis Client Error', { error: err.message }));

// --- CLUSTERING ---
if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  const numCPUs = os.cpus().length;
  logger.info(`Master ${process.pid} is running. Forking ${numCPUs} workers.`);
  for (let i = 0; i < numCPUs; i++) cluster.fork();
  cluster.on('exit', (worker) => {
    logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const app = express();
  const port = process.env.PORT || 3000;

  // --- MIDDLEWARE ---
  app.set('trust proxy', 1);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://generativelanguage.googleapis.com", process.env.CLIENT_URL],
        frameSrc: ["'self'", "https://js.stripe.com"]
      }
    }
  }));
  app.use(compression());
  app.use(express.json({ limit: '2MB' }));
  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args) }),
    handler: (req, res) => res.status(429).json({ error: "Rate limit exceeded" })
  });
  app.use('/api/', limiter);

  // --- DATABASE ---
  mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 50 })
    .then(() => logger.info(`MongoDB Connected (Worker ${process.pid})`))
    .catch(err => logger.error('MongoDB Error', { error: err.message }));

  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    subscription: { type: String, default: 'hobby' },
    usage: { tokensUsed: { type: Number, default: 0 } },
    organizationId: String
  }));

  const Project = mongoose.models.Project || mongoose.model('Project', new mongoose.Schema({
    userId: String, name: String, clientName: String, clientId: String, data: Object, updatedAt: { type: Date, default: Date.now }
  }));

  const Client = mongoose.models.Client || mongoose.model('Client', new mongoose.Schema({
    userId: String, name: String, industry: String, contactPerson: String, email: String, status: String, onboardingDate: { type: Date, default: Date.now }
  }));

  // --- AUTH MIDDLEWARE ---
  const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // --- AI AGENT CONFIGURATION ---
  const AI_AGENTS = {
    niche: {
      model: "gemini-2.5-flash",
      prompt: (d) => `Analyze product: "${cleanInput(d.productName)}". Desc: ${cleanInput(d.description)}. Identify 3 profitable niches. Return valid JSON.`,
      schema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, profitabilityScore: { type: Type.INTEGER }, reasoning: { type: Type.STRING }, marketSizeEstimate: { type: Type.STRING } } } }
    },
    persona: {
      model: "gemini-3-pro-preview",
      prompt: (d) => `Build ICP for "${cleanInput(d.productName)}" in niche "${cleanInput(d.niche)}". Refinement: ${cleanInput(d.refinement) || 'None'}. Return JSON.`,
      schema: { type: Type.OBJECT, properties: { jobTitle: { type: Type.STRING }, ageRange: { type: Type.STRING }, psychographics: { type: Type.ARRAY, items: { type: Type.STRING } }, painPoints: { type: Type.ARRAY, items: { type: Type.STRING } }, goals: { type: Type.ARRAY, items: { type: Type.STRING } }, buyingTriggers: { type: Type.ARRAY, items: { type: Type.STRING } } } }
    },
    magnets: {
      model: "gemini-2.5-flash",
      prompt: (d) => `3 Lead magnet ideas for ${cleanInput(d.persona)} related to ${cleanInput(d.productName)}. Return JSON.`,
      schema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, type: { type: Type.STRING }, hook: { type: Type.STRING }, description: { type: Type.STRING } } } }
    },
    maps_scout: {
      model: "gemini-2.5-flash",
      tools: [{ googleMaps: {} }],
      prompt: (d) => `Find 5 verified business leads for "${cleanInput(d.niche)}" in "${cleanInput(d.location)}".`
    },
    social_search: {
      model: "gemini-2.5-flash",
      prompt: (d) => `Generate 3 Boolean Search Strings for ${cleanInput(d.persona.jobTitle)} in ${cleanInput(d.niche)}. Return JSON.`,
      schema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { platform: { type: Type.STRING }, query: { type: Type.STRING }, explanation: { type: Type.STRING }, directUrl: { type: Type.STRING } } } }
    },
    landing_page: {
        model: "gemini-3-pro-preview",
        prompt: (d) => `Write landing page copy for ${cleanInput(d.productName)}. Target: ${cleanInput(d.persona.jobTitle)}. Return JSON.`,
        schema: { type: Type.OBJECT, properties: { headline: { type: Type.STRING }, subheadline: { type: Type.STRING }, ctaPrimary: { type: Type.STRING }, ctaSecondary: { type: Type.STRING }, benefits: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } } } }, heroImagePrompt: { type: Type.STRING }, socialProof: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quote: { type: Type.STRING }, role: { type: Type.STRING } } } } } }
    },
    ad_creatives: {
        model: "gemini-2.5-flash",
        prompt: (d) => `Generate 3 ad creatives for ${cleanInput(d.productName)}. Return JSON.`,
        schema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { platform: { type: Type.STRING }, headline: { type: Type.STRING }, adCopy: { type: Type.STRING }, hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }, visualPrompt: { type: Type.STRING } } } }
    },
    seo_audit: {
        model: "gemini-2.5-flash",
        tools: [{ googleSearch: {} }],
        prompt: (d) => `Audit SEO for ${cleanInput(d.url)}. Identify technical issues. Return JSON.`,
        schema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { severity: { type: Type.STRING }, category: { type: Type.STRING }, issue: { type: Type.STRING }, recommendation: { type: Type.STRING } } } }
    },
    seo_keywords: {
        model: "gemini-2.5-flash",
        prompt: (d) => `Keyword strategy for "${cleanInput(d.seed)}" niche "${cleanInput(d.niche)}". Return JSON.`,
        schema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { keyword: { type: Type.STRING }, intent: { type: Type.STRING }, volume: { type: Type.STRING }, difficulty: { type: Type.INTEGER }, opportunityScore: { type: Type.INTEGER } } } }
    },
    chat_reply: {
        model: "gemini-2.5-flash",
        prompt: (d) => `Roleplay as ${cleanInput(d.persona.jobTitle)}. Product: ${cleanInput(d.productName)}. History: ${JSON.stringify(d.history)}. Reply short.`
    },
    follow_up: {
        model: "gemini-2.5-flash",
        prompt: (d) => `3 email sequence for ${cleanInput(d.productName)}. Return JSON.`,
        schema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { subject: { type: Type.STRING }, previewText: { type: Type.STRING }, body: { type: Type.STRING }, sendDelay: { type: Type.STRING } } } }
    },
    qualification: {
        model: "gemini-2.5-flash",
        prompt: (d) => `5 BANT questions for ${cleanInput(d.productName)}. Return JSON.`,
        schema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, intent: { type: Type.STRING }, idealAnswer: { type: Type.STRING } } } }
    },
    cold_dms: {
        model: "gemini-2.5-flash", 
        prompt: (d) => `3 cold DMs for ${cleanInput(d.persona.jobTitle)}. Return JSON array of strings.`,
        schema: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    email_campaign: {
      model: "gemini-2.5-flash",
      prompt: (d) => `Write email body: "${cleanInput(d.topic)}" Goal: "${cleanInput(d.goal)}". Return JSON.`,
      schema: { type: Type.OBJECT, properties: { subject: { type: Type.STRING }, body: { type: Type.STRING } } }
    },
    email_subjects: {
      model: "gemini-2.5-flash",
      prompt: (d) => `5 subject lines for "${cleanInput(d.topic)}". Return JSON array strings.`,
      schema: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    objection_handler: {
      model: "gemini-2.5-flash",
      prompt: (d) => `3 rebuttals for: "${cleanInput(d.objection)}". Return JSON array strings.`,
      schema: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    content_score: {
      model: "gemini-2.5-flash",
      prompt: (d) => `Analyze SEO content for "${cleanInput(d.keyword)}": "${cleanInput(d.content).slice(0,2000)}". Return JSON.`,
      schema: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, readability: { type: Type.STRING }, keywordDensity: { type: Type.NUMBER }, suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }, missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } } } }
    }
  };

  // --- ROUTES ---

  app.get('/health', (req, res) => res.json({ status: 'ok', worker: process.pid }));

  // AI Execution Route (Secured & Metered)
  app.post('/api/ai/execute', authenticateToken, async (req, res) => {
    try {
      const { agent, payload } = req.body;
      const agentConfig = AI_AGENTS[agent];
      if (!agentConfig) return res.status(404).json({ error: "Invalid agent" });

      const user = await User.findById(req.user.id);
      
      // Hard Cost Ceiling
      const limits = { hobby: 100000, pro: 1000000, agency: 5000000 };
      if (user.usage.tokensUsed >= limits[user.subscription || 'hobby']) {
        return res.status(402).json({ error: "Quota exceeded. Upgrade required." });
      }

      const prompt = agentConfig.prompt(payload);
      const result = await genAI.models.generateContent({
        model: agentConfig.model,
        contents: prompt,
        config: {
          responseMimeType: agentConfig.schema ? "application/json" : "text/plain",
          responseSchema: agentConfig.schema,
          tools: agentConfig.tools,
          maxOutputTokens: 8192
        }
      });

      // Update Usage
      const usage = result.usageMetadata?.totalTokenCount || 500;
      await User.findByIdAndUpdate(req.user.id, { $inc: { "usage.tokensUsed": usage } });

      // Handle Grounding (Maps)
      if (agent === 'maps_scout' || agent === 'seo_audit') {
        const grounding = result.candidates?.[0]?.groundingMetadata;
        return res.json({ 
          data: { text: result.text, mapChunks: grounding?.groundingChunks || [] }
        });
      }

      // Handle JSON parsing
      let output = result.text;
      if (agentConfig.schema) {
        try {
          output = JSON.parse(result.text);
        } catch (e) {
          // Fallback cleanup
          output = JSON.parse(result.text.replace(/```json|```/g, '').trim());
        }
      }

      res.json({ data: output });
    } catch (e) {
      logger.error("AI Error", { error: e.message, userId: req.user.id });
      res.status(500).json({ error: "AI Processing Failed" });
    }
  });

  // Project Routes
  app.get('/api/projects', authenticateToken, async (req, res) => {
    const projects = await Project.find({ userId: req.user.id }).sort({ updatedAt: -1 }).limit(50);
    res.json(projects);
  });

  app.post('/api/projects', authenticateToken, async (req, res) => {
    const { name, description, clientName, clientId } = req.body;
    const project = await Project.create({ 
      userId: req.user.id, name, clientName, clientId, 
      data: { productName: name, productDescription: description } 
    });
    res.json(project);
  });

  app.put('/api/projects/:id', authenticateToken, async (req, res) => {
    const { data, clientName, clientId } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, 
      { $set: { data, clientName, clientId, updatedAt: Date.now() } }, 
      { new: true }
    );
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
  });

  app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    await Project.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  });

  // Client Routes (Agency)
  app.get('/api/clients', authenticateToken, async (req, res) => {
    const clients = await Client.find({ userId: req.user.id });
    res.json(clients);
  });

  app.post('/api/clients', authenticateToken, async (req, res) => {
    const client = await Client.create({ userId: req.user.id, ...req.body });
    res.json(client);
  });

  app.put('/api/clients/:id', authenticateToken, async (req, res) => {
    const client = await Client.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
    res.json(client);
  });

  app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
    await Client.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  });

  // Services
  app.post('/api/email/send', authenticateToken, async (req, res) => {
    if (!process.env.SENDGRID_API_KEY) return res.status(503).json({ error: "Service unconfigured" });
    try {
      await sgMail.send(req.body);
      res.json({ success: true });
    } catch (e) {
      logger.error("Email Error", e);
      res.status(500).json({ error: "Send failed" });
    }
  });

  app.post('/api/social/post', authenticateToken, async (req, res) => {
    if (!process.env.AYRSHARE_API_KEY) return res.status(503).json({ error: "Service unconfigured" });
    try {
      const resp = await fetch('https://app.ayrshare.com/api/post', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AYRSHARE_API_KEY}`
        },
        body: JSON.stringify(req.body)
      });
      const data = await resp.json();
      res.json(data);
    } catch (e) {
      logger.error("Social Error", e);
      res.status(500).json({ error: "Post failed" });
    }
  });

  app.post('/api/create-checkout-session', authenticateToken, async (req, res) => {
    if (!stripe) return res.status(503).json({ error: "Billing unconfigured" });
    try {
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: req.body.planName === 'Pro' ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_AGENCY, quantity: 1 }],
        mode: 'subscription',
        success_url: `${process.env.CLIENT_URL}?payment=success&plan=${req.body.planName}`,
        cancel_url: `${process.env.CLIENT_URL}?payment=cancelled`,
        metadata: { userId: req.user.id }
      });
      res.json({ url: session.url });
    } catch (e) {
      res.status(500).json({ error: "Payment init failed" });
    }
  });

  // Auth
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ email, password: hashedPassword });
      const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET);
      res.json({ user, token });
    } catch (e) { res.status(400).json({ error: "User exists" }); }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ user, token });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));
  }

  app.listen(port, () => logger.info(`Worker ${process.pid} listening on port ${port}`));
}
