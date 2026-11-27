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
import { masterApiEnabled, masterApiHealth, incrementCounter, getCounter, createDoc, recentDocs } from './masterapi';

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

app.use(cors((req, done) => done(null, {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    // The site's own pages always count as allowed (browsers send Origin on module scripts too).
    try {
      if (new URL(origin).host === req.headers.host) return callback(null, true);
    } catch { /* malformed origin: fall through */ }
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (process.env.APP_URL && origin === process.env.APP_URL.replace(/\/$/, '')) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
})));

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

const PORT = Number(process.env.PORT) || 3000;

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

// Saves a contact message to MasterAPI when MASTERAPI_URL and MASTERAPI_KEY are set.
// Failures are logged and ignored: the email has already been sent.
function saveContactToMasterAPI(doc: Record<string, string>) {
  if (!masterApiEnabled) return;
  createDoc('contact_messages', { ...doc, source: 'portfolio', read: false })
    .catch((e: any) => console.warn(`MasterAPI contact save failed: ${e.message}`));
}

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

    saveContactToMasterAPI({ name: name.trim(), email: email.trim(), subject: subject ? subject.trim() : '', message: message.trim() });

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

// ---------- Live MasterAPI demo (used by the "API" page) ----------
// Every call goes through this server, so the MasterAPI key is never sent to the browser.
app.get('/api/masterapi/status', async (_req, res) => {
  if (!masterApiEnabled) return res.json({ configured: false, online: false });
  const h = await masterApiHealth();
  res.json({ configured: true, online: h.ok, storage: h.storage || null });
});

app.post('/api/masterapi/visit', async (_req, res) => {
  if (!masterApiEnabled) return res.status(503).json({ error: 'MasterAPI is not connected.' });
  try {
    res.json({ visits: await incrementCounter('portfolio-visits') });
  } catch {
    res.status(502).json({ error: 'Could not reach MasterAPI.' });
  }
});

app.get('/api/masterapi/visits', async (_req, res) => {
  if (!masterApiEnabled) return res.status(503).json({ error: 'MasterAPI is not connected.' });
  try {
    res.json({ visits: await getCounter('portfolio-visits') });
  } catch {
    res.status(502).json({ error: 'Could not reach MasterAPI.' });
  }
});

app.get('/api/masterapi/guestbook', async (_req, res) => {
  if (!masterApiEnabled) return res.status(503).json({ error: 'MasterAPI is not connected.' });
  try {
    const { data, total } = await recentDocs('guestbook', 20);
    res.json({ total, entries: data.map((d) => ({ id: d.id, name: d.name, message: d.message, createdAt: d.createdAt })) });
  } catch {
    res.status(502).json({ error: 'Could not reach MasterAPI.' });
  }
});

// Max 5 guestbook posts per visitor every 10 minutes.
const guestbookHits = new Map<string, { n: number; until: number }>();
app.post('/api/masterapi/guestbook', async (req, res) => {
  if (!masterApiEnabled) return res.status(503).json({ error: 'MasterAPI is not connected.' });
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const hit = guestbookHits.get(ip);
  if (hit && hit.until > now && hit.n >= 5) return res.status(429).json({ error: 'Thanks! Please wait a few minutes before posting again.' });
  const name = String(req.body?.name || '').trim();
  const message = String(req.body?.message || '').trim();
  if (!name || name.length > 60) return res.status(400).json({ error: 'Please enter your name (up to 60 characters).' });
  if (!message || message.length > 500) return res.status(400).json({ error: 'Please write a message (up to 500 characters).' });
  try {
    const doc = await createDoc('guestbook', { name, message });
    if (!hit || hit.until < now) guestbookHits.set(ip, { n: 1, until: now + 10 * 60e3 });
    else hit.n++;
    if (guestbookHits.size > 5000) guestbookHits.clear();
    res.status(201).json({ entry: { id: doc.id, name: doc.name, message: doc.message, createdAt: doc.createdAt } });
  } catch {
    res.status(502).json({ error: 'Could not save to MasterAPI. Please try again.' });
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

// --- Hugging Face chat settings ---
const HF_CHAT_URL = process.env.HF_API_URL || 'https://router.huggingface.co/v1/chat/completions';
const HF_TIMEOUT_MS = Number(process.env.HF_TIMEOUT_MS) || 25_000;
const HF_MODELS = [process.env.HF_MODEL, 'Qwen/Qwen2.5-7B-Instruct', 'meta-llama/Llama-3.2-3B-Instruct']
  .filter((m, i, all): m is string => Boolean(m) && all.indexOf(m) === i);

/** Keeps only the last few well-formed turns the page sends, so follow-up questions make sense. */
function sanitizeHistory(raw: unknown): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-6)
    .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 1000) }));
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

  // Hugging Face: small open chat models through the Inference Providers API (OpenAI-compatible).
  // Tries the models in order and uses the first reply. HF_MODEL lets you choose your own first.
  const hfToken = process.env.HF_TOKEN;
  if (hfToken) {
    const history = sanitizeHistory(req.body?.history);
    for (const model of HF_MODELS) {
      try {
        const hfRes = await fetch(HF_CHAT_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...history,
              { role: 'user', content: userMessage.trim() },
            ],
            max_tokens: 500,
            temperature: 0.4,
          }),
          signal: AbortSignal.timeout(HF_TIMEOUT_MS),
        });
        if (!hfRes.ok) {
          console.warn(`[CHAT] Hugging Face ${model} answered HTTP ${hfRes.status}`);
          continue;
        }
        const hfData: any = await hfRes.json().catch(() => null);
        const text = hfData?.choices?.[0]?.message?.content;
        if (typeof text === 'string' && text.trim()) {
          finalReply = text.trim();
          strategy = `Hugging Face (${model})`;
          break;
        }
      } catch (e: any) {
        console.warn(`[CHAT] Hugging Face ${model} failed: ${e?.name === 'TimeoutError' ? 'timed out' : e?.message}`);
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
