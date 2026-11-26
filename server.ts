import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import * as dotenv from 'dotenv';
import fsModule from 'fs';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from "@google/genai";
import crypto from 'crypto';

dotenv.config();

const ME_FILE_PATH = path.resolve(process.cwd(), 'me.json');
const ADMIN_CRED_PATH = path.resolve(process.cwd(), '.admin-cred.json');
const SESSION_SIGNING_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

let meData: Record<string, any> = {};
try {
  meData = JSON.parse(fsModule.readFileSync(ME_FILE_PATH, 'utf-8'));
} catch {
  console.log("Could not load me.json");
}

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];
const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...defaultAllowedOrigins, ...envAllowedOrigins];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (process.env.APP_URL && origin === process.env.APP_URL.replace(/\/$/, '')) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '256kb' }));

function createRateLimiter(options: { windowMs: number; max: number; message: string }) {
  const hits = new Map<string, { count: number; resetTime: number }>();
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    let record = hits.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + options.windowMs };
      hits.set(ip, record);
    } else {
      record.count++;
    }
    if (record.count > options.max) {
      return res.status(429).json({ error: options.message });
    }
    next();
  };
}

const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: "Too many chat requests. Please slow down."
});

const transcribeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many transcription requests. Please try again shortly."
});

const adminAuthRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many authentication attempts. Please try again later."
});

const PORT = 3000;

// --- Owner Passcode & Session Token Helpers ---
function getAdminMode(): 'env' | 'claimed' | 'unclaimed' {
  if (process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0) {
    return 'env';
  }
  if (fsModule.existsSync(ADMIN_CRED_PATH)) {
    return 'claimed';
  }
  return 'unclaimed';
}

function hashPasscodeScrypt(passcode: string, salt: string): Buffer {
  return crypto.scryptSync(passcode, salt, 64);
}

function verifyPasscode(passcode: string): boolean {
  const envPass = process.env.ADMIN_PASSCODE;
  if (envPass && envPass.trim().length > 0) {
    const a = crypto.createHash('sha256').update(passcode).digest();
    const b = crypto.createHash('sha256').update(envPass.trim()).digest();
    return crypto.timingSafeEqual(a, b);
  }
  if (!fsModule.existsSync(ADMIN_CRED_PATH)) {
    return false;
  }
  try {
    const cred = JSON.parse(fsModule.readFileSync(ADMIN_CRED_PATH, 'utf-8'));
    if (typeof cred?.salt !== 'string' || typeof cred?.hash !== 'string') {
      return false;
    }
    const derived = hashPasscodeScrypt(passcode, cred.salt);
    const stored = Buffer.from(cred.hash, 'hex');
    if (derived.length !== stored.length) return false;
    return crypto.timingSafeEqual(derived, stored);
  } catch {
    return false;
  }
}

function createOwnerToken(): string {
  const payload = {
    sub: 'owner',
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SIGNING_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

function verifyOwnerToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SIGNING_SECRET).update(payloadB64).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    return parsed?.sub === 'owner' && typeof parsed?.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function requireOwnerAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Owner authentication required." });
  }
  const token = authHeader.slice(7).trim();
  if (!verifyOwnerToken(token)) {
    return res.status(401).json({ error: "Session expired or invalid. Please unlock again." });
  }
  return next();
}

function sanitizeJsonValue(val: unknown, depth = 0): unknown {
  if (depth > 10) return null;
  if (val === null || typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.slice(0, 200).map(item => sanitizeJsonValue(item, depth + 1));
  }
  if (typeof val === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      clean[k] = sanitizeJsonValue(v, depth + 1);
    }
    return clean;
  }
  return null;
}

function isSafeHttpUrl(url: unknown): boolean {
  if (url === undefined || url === null || url === '') return true;
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// --- Admin Auth & Profile JSON Routes ---
app.get('/api/admin/status', (_req, res) => {
  const mode = getAdminMode();
  return res.json({ configured: mode !== 'unclaimed', mode });
});

app.post('/api/admin/claim', adminAuthRateLimiter, (req, res) => {
  if (getAdminMode() !== 'unclaimed') {
    return res.status(409).json({ error: "Owner passcode is already configured." });
  }
  const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : '';
  if (passcode.length < 6 || passcode.length > 128) {
    return res.status(400).json({ error: "Passcode must be between 6 and 128 characters." });
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPasscodeScrypt(passcode, salt).toString('hex');
  fsModule.writeFileSync(ADMIN_CRED_PATH, JSON.stringify({ salt, hash }, null, 2), { mode: 0o600 });
  const token = createOwnerToken();
  return res.status(201).json({ token, mode: 'claimed' });
});

app.post('/api/admin/login', adminAuthRateLimiter, (req, res) => {
  if (getAdminMode() === 'unclaimed') {
    return res.status(400).json({ error: "No owner passcode configured yet. Set one first." });
  }
  const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : '';
  if (!passcode || !verifyPasscode(passcode)) {
    return res.status(401).json({ error: "Incorrect passcode." });
  }
  const token = createOwnerToken();
  return res.json({ token, mode: getAdminMode() });
});

app.get('/api/profile', (_req, res) => {
  return res.json(meData);
});

app.put('/api/profile', requireOwnerAuth, (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: "Profile payload must be a JSON object." });
    }

    const sanitized = sanitizeJsonValue(body) as Record<string, any>;
    if (!sanitized || typeof sanitized.name !== 'string' || !sanitized.name.trim()) {
      return res.status(400).json({ error: "Profile JSON must include a non-empty 'name' string." });
    }
    if (typeof sanitized.email !== 'string' || !EMAIL_REGEX.test(sanitized.email.trim())) {
      return res.status(400).json({ error: "Profile JSON must include a valid 'email' address." });
    }

    if (Array.isArray(sanitized.links)) {
      for (const link of sanitized.links) {
        if (!link || typeof link !== 'object' || !isSafeHttpUrl(link.url)) {
          return res.status(400).json({ error: "Every link URL must start with http:// or https://." });
        }
      }
    }

    if (Array.isArray(sanitized.projects)) {
      for (const proj of sanitized.projects) {
        if (!proj || typeof proj !== 'object' || !isSafeHttpUrl(proj.url)) {
          return res.status(400).json({ error: "Every project URL must start with http:// or https://." });
        }
      }
    }

    const serialized = JSON.stringify(sanitized, null, 2);
    if (Buffer.byteLength(serialized, 'utf-8') > 100 * 1024) {
      return res.status(400).json({ error: "Profile JSON exceeds 100 KB limit." });
    }

    fsModule.writeFileSync(ME_FILE_PATH, serialized + '\n', 'utf-8');
    meData = sanitized;
    return res.json({ success: true, profile: meData });
  } catch (err: any) {
    console.error("Failed to save profile JSON:", err);
    return res.status(500).json({ error: "Failed to save profile JSON." });
  }
});

// --- Purposeful Portfolio System Prompt ---
function buildSystemPrompt(profile: Record<string, any>): string {
  const ownerName = profile?.name || "Kamogelo Mosia";
  const nickname = profile?.nickname || "Kamo";

  return `You are ${nickname}'s dedicated personal portfolio assistant, speaking on behalf of ${ownerName}.

STRICT PURPOSE & SCOPE:
Your ONLY purpose is to:
1. Speak accurately about ${ownerName} (${nickname}) — his background, skills, projects, education, experience, availability, and any custom notes/facts provided in the LIVE PROFILE JSON below.
2. Help visitors find ${ownerName} online (GitHub, portfolio links, CV, location).
3. Help visitors contact ${ownerName} (email, phone, availability, and directing them to the Contact page).

OUT-OF-SCOPE GUARDRAIL:
- Do NOT act as a general-purpose assistant, math solver, homework helper, trivia bot, or generic coding tutor.
- If a visitor asks about anything unrelated to ${ownerName}, his work, finding him, or contacting him, politely decline and explain that you are ${ownerName}'s personal portfolio assistant who can share his background, projects, CV, or contact information instead.

GROUNDING & VOICE:
- Craft natural, helpful, concise responses on ${ownerName}'s behalf using ONLY the LIVE PROFILE JSON below.
- If the owner added items in "customNotes", "projects", "skills", "links", or other fields in the JSON, incorporate them naturally whenever relevant.
- Never invent facts, dates, employers, or links that are not in the LIVE PROFILE JSON.
- Keep responses concise, direct, and professional without excessive emojis.

UI ACTION TOKENS:
Always append exactly one of these tokens at the end of your reply when relevant:
- For projects or portfolio work: "[UI:PROJECTS]"
- For skills or technical stack: "[UI:SKILLS]"
- For contacting, hiring, availability, or finding ${nickname}: "[UI:CONTACT]"
- For CV, background, education, or general introduction: "[UI:CV]"

LIVE PROFILE JSON:
${JSON.stringify(profile, null, 2)}`;
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
      return res.status(400).json({ error: "Full Name is required and must be under 100 characters." });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()) || email.trim().length > 255) {
      return res.status(400).json({ error: "A valid email address is required (under 255 characters)." });
    }

    if (subject && (typeof subject !== 'string' || subject.trim().length > 200)) {
      return res.status(400).json({ error: "Subject must be under 200 characters." });
    }

    if (!message || typeof message !== 'string' || !message.trim() || message.trim().length > 5000) {
      return res.status(400).json({ error: "Message is required and must be under 5000 characters." });
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return res.status(503).json({
        error: "Contact email delivery is not configured on this server (SMTP settings missing)."
      });
    }

    console.log(`[CONTACT INCOMING] Name: ${name.trim()} | Email: ${email.trim()} | Subject: ${subject ? subject.trim() : "N/A"}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[CONTACT DEBUG] Message preview: ${message.trim().slice(0, 100)}...`);
    }

    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass }
    });

    const recipient = process.env.CONTACT_RECIPIENT_EMAIL || meData?.email || "kamogelomosiah@gmail.com";
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Portfolio Contact" <${user}>`,
      to: recipient,
      replyTo: email.trim(),
      subject: `[Portfolio Contact] ${subject ? subject.trim() : 'New Inquiry'} from ${name.trim()}`,
      text: `From: ${name.trim()} <${email.trim()}>\nSubject: ${subject ? subject.trim() : 'N/A'}\n\n${message.trim()}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <h2 style="color: #DC2626; margin-top: 0; font-size: 20px;">New Portfolio Contact Message</h2>
          <p style="margin: 6px 0;"><strong>Name:</strong> ${name.trim()}</p>
          <p style="margin: 6px 0;"><strong>Email:</strong> <a href="mailto:${email.trim()}">${email.trim()}</a></p>
          <p style="margin: 6px 0;"><strong>Subject:</strong> ${subject ? subject.trim() : 'N/A'}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <div style="padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${message.trim()}
          </div>
        </div>
      `
    });

    return res.status(200).json({ 
      success: true, 
      recipient, 
      message: "Message successfully delivered to Kamogelo's mailbox." 
    });
  } catch (error: any) {
    console.error("Contact Form Server Error:", error.message || "Unknown error");
    return res.status(500).json({ success: false, error: "Failed to deliver contact message: " + (error.message || "Unknown error") });
  }
});

app.get('/HEALTH', (_req, res) => {
  res.json({ status: 'ok', service: 'CodeMind Assistant', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CodeMind Assistant', timestamp: new Date().toISOString() });
});

// Dynamic local knowledge responder grounded in me.json
function generateLocalAssistantReply(userPrompt: string, profile: Record<string, any>): string {
  const promptLower = userPrompt.toLowerCase().trim();
  const name = profile?.name || "Kamogelo Mosia";
  const nickname = profile?.nickname || "Kamo";
  const profession = profile?.profession || "Software & IT Solutions Engineer";
  const overview = profile?.overview || "";
  const email = profile?.email || "kamogelomosiah@gmail.com";
  const phone = profile?.phone || "";
  const location = profile?.location || "Johannesburg, South Africa";
  const availability = profile?.availability || "";
  const links: Array<{ label: string; url: string }> = Array.isArray(profile?.links) ? profile.links : [];
  const projects: Array<{ name: string; url?: string; stack?: string; description?: string }> = Array.isArray(profile?.projects) ? profile.projects : [];
  const skills: string[] = Array.isArray(profile?.skills) ? profile.skills : [];
  const education: Array<{ degree: string; years: string; institution: string; details?: string }> = Array.isArray(profile?.education) ? profile.education : [];
  const experience: Array<{ title: string; year: string; company: string; details?: string }> = Array.isArray(profile?.experience) ? profile.experience : [];
  const customNotes: Array<{ topic: string; content: string }> = Array.isArray(profile?.customNotes) ? profile.customNotes : [];

  // 1. Check customNotes added by owner via JSON/Forms
  const matchedNotes = customNotes.filter((note) => {
    const topicWords = String(note?.topic || "").toLowerCase().split(/\s+/).filter(w => w.length > 2);
    return topicWords.some(word => promptLower.includes(word));
  });
  if (matchedNotes.length > 0) {
    const formatted = matchedNotes.map(n => `- **${n.topic}:** ${n.content}`).join('\n');
    return `Here is what ${nickname} shared on this topic:\n\n${formatted}\n\nFeel free to ask more or reach out via the Contact tab. [UI:CONTACT]`;
  }

  // 2. Contact / Find / Hire / Links / Location / Availability
  if (
    /\b(contact|email|reach|find|hire|phone|call|location|where|linkedin|github|link|links|available|availability|social)\b/i.test(promptLower)
  ) {
    const lines = [
      `You can reach **${name}** directly using these details:`,
      `- **Email:** \`${email}\``,
    ];
    if (phone) lines.push(`- **Phone:** ${phone}`);
    if (location) lines.push(`- **Location:** ${location}`);
    if (availability) lines.push(`- **Availability:** ${availability}`);
    links.forEach((l) => {
      if (l?.label && l?.url) lines.push(`- **${l.label}:** [${l.url}](${l.url})`);
    });
    lines.push(`\nYou can also send a direct message from the **Contact** tab below. [UI:CONTACT]`);
    return lines.join('\n');
  }

  // 3. CV / Resume / Education / Experience / Background
  if (
    /\b(cv|resume|education|degree|university|uj|qualification|study|experience|work history|background)\b/i.test(promptLower)
  ) {
    const eduText = education.map(e => `- **${e.degree}** — ${e.institution} (${e.years})${e.details ? `: ${e.details}` : ''}`).join('\n');
    const expText = experience.map(x => `- **${x.title}** at **${x.company}** (${x.year})${x.details ? `: ${x.details}` : ''}`).join('\n');
    return `**${name}** — ${profession}\n\n${overview}\n\n${eduText ? `**Education:**\n${eduText}\n\n` : ''}${expText ? `**Experience:**\n${expText}\n\n` : ''}You can download his CV below or open the **CV** tab. [UI:CV]`;
  }

  // 4. Projects
  if (
    /\b(project|projects|portfolio|built|build|app|apps)\b/i.test(promptLower) ||
    projects.some(p => p?.name && promptLower.includes(p.name.toLowerCase()))
  ) {
    if (projects.length === 0) {
      return `No projects are currently listed in ${nickname}'s profile JSON. [UI:PROJECTS]`;
    }
    const projLines = projects.map(p => {
      const urlPart = p.url ? ` (${p.url})` : '';
      const stackPart = p.stack ? ` — *${p.stack}*` : '';
      return `- **${p.name}**${urlPart}${stackPart}: ${p.description || ''}`;
    }).join('\n');
    return `Here are ${nickname}'s software engineering projects:\n\n${projLines}\n\n[UI:PROJECTS]`;
  }

  // 5. Skills / Tech Stack
  if (
    /\b(skill|skills|stack|tech|technology|technologies|languages|frameworks|tools|database|databases)\b/i.test(promptLower)
  ) {
    if (skills.length === 0) {
      return `No technical skills are currently listed in ${nickname}'s profile JSON. [UI:SKILLS]`;
    }
    const skillLines = skills.map(s => `- ${s}`).join('\n');
    return `${name}'s technical capabilities:\n\n${skillLines}\n\n[UI:SKILLS]`;
  }

  // 6. Greetings / Who is Kamo / About
  if (
    /\b(hi|hello|hey|greetings|who|about|introduce|kamo|kamogelo)\b/i.test(promptLower)
  ) {
    return `Hello! I'm **${nickname}'s portfolio assistant**, speaking on behalf of **${name}** (${profession}).\n\n${overview}\n\nAsk me about ${nickname}'s projects, skills, CV, or how to find and contact him! [UI:CV]`;
  }

  // 7. Out-of-scope polite redirect
  return `I'm **${name}'s portfolio assistant**, focused strictly on helping visitors learn about ${nickname}, explore his work, and contact him.\n\nTry asking about:\n- **${nickname}'s projects or technical skills**\n- **His education, experience, or CV**\n- **How to find or contact him** (${email})\n\n[UI:CONTACT]`;
}

app.post('/api/chat', chatRateLimiter, async (req, res) => {
  const { message, prompt, messages } = req.body || {};
  const userMessage = (typeof message === 'string' ? message : '') || 
                     (typeof prompt === 'string' ? prompt : '') || 
                     (Array.isArray(messages) ? messages[messages.length - 1]?.content : '') || '';

  if (!userMessage.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (userMessage.length > 4000) {
    return res.status(400).json({ error: "Message exceeds maximum allowed length of 4000 characters." });
  }

  let finalReply = "";
  let strategy = "";
  let isFallback = false;
  const systemPrompt = buildSystemPrompt(meData);

  // Strategy 1: Attempt Gemini API with multi-model fallback
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const candidateModels = [
      process.env.GEMINI_MODEL,
      "gemini-3.8-flash",
      "gemini-flash-latest",
      "gemini-3.1-flash-lite",
    ].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);

    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    for (const model of candidateModels) {
      try {
        const result = await ai.models.generateContent({
          model: model,
          contents: userMessage,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.5,
            maxOutputTokens: 1200,
          },
        });
        if (result.text) {
          finalReply = result.text;
          strategy = `Gemini API (${model})`;
          break;
        }
      } catch {
        // Try next model
      }
    }
  }

  // Strategy 2: Upstream Render backend if configured
  if (!finalReply && process.env.RENDER_BACKEND_URL) {
    const renderUrl = process.env.RENDER_BACKEND_URL.replace(/\/$/, "");
    const renderTimeoutMs = parseInt(process.env.RENDER_BACKEND_TIMEOUT_MS || "30000", 10);
    try {
      const renderController = new AbortController();
      const timeout = setTimeout(() => renderController.abort(), renderTimeoutMs);
      const renderRes = await fetch(`${renderUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.trim() }),
        signal: renderController.signal,
      });
      clearTimeout(timeout);

      if (renderRes.ok) {
        const renderData = await renderRes.json();
        if (typeof renderData?.reply === 'string' && renderData.reply.trim()) {
          finalReply = renderData.reply;
          strategy = "Render Backend";
        }
      }
    } catch {
      // Continue to fallback
    }
  }

  // Strategy 3: OpenRouter fallback if configured
  if (!finalReply) {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey && openRouterKey !== "MY_OPENROUTER_API_KEY") {
      try {
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai.studio/build",
            "X-Title": "CodeMind Assistant"
          },
          body: JSON.stringify({
            model: process.env.DEFAULT_MODEL || "meta-llama/llama-3.3-70b-instruct",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage }
            ],
            temperature: 0.5,
            max_tokens: 800
          })
        });
        if (orRes.ok) {
          const orData = await orRes.json();
          const orText = orData.choices?.[0]?.message?.content;
          if (typeof orText === "string" && orText.trim()) {
            finalReply = orText;
            strategy = "OpenRouter";
          }
        }
      } catch {
        // Fall through to local responder
      }
    }
  }

  // Strategy 4: Local knowledge responder grounded in meData
  if (!finalReply) {
    finalReply = generateLocalAssistantReply(userMessage, meData);
    strategy = "Local Knowledge Assistant";
    isFallback = true;
  }

  console.log(`[CHAT STRATEGY] Answered via ${strategy} (fallback: ${isFallback})`);

  return res.json({
    reply: finalReply,
    text: finalReply,
    success: true,
    fallback: isFallback,
    strategy,
  });
});

app.post('/api/gemini/transcribe', transcribeRateLimiter, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file provided" });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: "Audio transcription is currently unavailable because GEMINI_API_KEY is not configured on the server."
      });
    }
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    const audioPart = {
      inlineData: {
        mimeType: req.file.mimetype,
        data: req.file.buffer.toString("base64"),
      },
    };
    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: { parts: [audioPart, { text: "Transcribe this audio. Return ONLY the transcribed text, without any additional comments or formatting." }] },
    });
    return res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
