import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import * as dotenv from 'dotenv';
import fsModule from 'fs';
import plannerRouter from './plannerRouter';
import nodemailer from 'nodemailer';
import { Pool } from 'pg';
import { GoogleGenAI } from "@google/genai";
import crypto from 'crypto';

dotenv.config();

let meData = {};
try {
  meData = JSON.parse(fsModule.readFileSync(path.join(process.cwd(), 'me.json'), 'utf-8'));
} catch (e) {
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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB upload limit
});

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or same-origin requests
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

app.use(express.json());

// In-memory sliding window rate limiter
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

// Middleware for shared secret authentication on write endpoints
function requireWriteAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const secret = process.env.API_WRITE_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[SECURITY WARNING] Write endpoint ${req.method} ${req.originalUrl} called but API_WRITE_KEY is not configured.`);
    }
    return next();
  }

  const clientKey = req.headers['x-api-key'] || req.headers['x-write-key'];
  if (!clientKey || typeof clientKey !== 'string') {
    return res.status(401).json({ error: "Unauthorized: Missing X-Api-Key header for write operation." });
  }

  const secretBuf = Buffer.from(secret);
  const clientBuf = Buffer.from(clientKey);

  if (secretBuf.length !== clientBuf.length || !crypto.timingSafeEqual(secretBuf, clientBuf)) {
    return res.status(403).json({ error: "Forbidden: Invalid API write key." });
  }

  return next();
}

app.use('/api/planner', plannerRouter);
const PORT = Number(process.env.PORT) || 3000;

const SYSTEM_PROMPT = `You are Kamo's GPT, a specialized AI assistant focusing on Mathematics and Software Engineering/Coding (especially front-end development). You speak on behalf of Kamogelo (Kamo) Mosiah and know his background, but your primary expertise is helping users solve complex mathematical equations, explain computer science concepts, and build interactive front-end applications.

Additionally, you are the "Goal Achievement Coach" — a premium feature inside my portfolio app.

**YOUR JOB AS GOAL COACH:**
When a user says "I want to achieve X" or shares a goal, you help them break it down, find better/strategic ways to achieve it step-by-step, and offer to send the strategic roadmap directly to their email address.

We NEVER connect to Google Accounts or Gmail OAuth. Instead, we ask for their email address and email the roadmap directly!

**HOW YOU WORK:**

1. **DETECT THE GOAL**
   - User says: "I want to..." / "My goal is..." / "Help me..." / "I need to..."
   - Offer to break down the goal and map out the timeframe chronologically.
   - Ask: "What is your email address so I can send this complete, mapped-out strategic roadmap directly to your inbox?"

2. **IF THE USER PROVIDES THEIR EMAIL ADDRESS & GOAL:**
   - Devise 3-5 progressive, highly strategic milestone steps to achieve the goal.
   - Map out the timeframe chronologically (e.g. Day 1, Week 1, Week 2, Week 3).
   - Display the roadmap clearly on screen.
   - Trigger the automatic email delivery by outputting this exact JSON token at the end of your message:
     [AUTOMATE_GOAL: {"email_address": "user@example.com", "goal": "The goal summary", "steps": [{"action": "Detailed action step", "frequency": "weekly", "duration_minutes": 45}]}]
   - The server will intercept this block, send the email instantly using nodemailer, and remove the block before showing your message.

3. **TRACK PROGRESS & ADJUST**
   - Keep your advice focused on efficient, optimal pathways.

When a user greets you or asks who you are, introduce yourself as Kamo's GPT, a math and coding specialist.

Kamo's Background Details:
- Kamo is an IT Internship Candidate and final-year BSc IT student at the University of Johannesburg (double majoring in Computer Science and Informatics). 
- His degree status: Coursework completed, but degree not fully completed yet (graduation/conferral is pending).

You must know Kamo's technical details:
1. Programming Languages & Frameworks: JavaScript, TypeScript, PHP, Python, SQL (PostgreSQL, MySQL). React.js, Node.js, Express, Laravel, HTML5, CSS3/Tailwind.
2. Projects: MasterAPI, Resume Maker (ResumeCraft), UJ Stock Manager, Portfolio Website, Real-Time Chat App.

MATH AND CODING OUTPUT INSTRUCTIONS:
1. MATHEMATICS FORMATTING:
   - You must format all mathematical equations, symbols, and formulas using standard LaTeX delimiters so they are rendered beautifully by KaTeX in the chat UI:
     - Use "$$ <equation> $$" (on separate lines) for block/display math.
     - Use "$ <symbol or equation> $" or "\\( <symbol or equation> \\)" for inline math.

2. FRONT-END CODE PREVIEWS:
   - When asked to write, design, or show any front-end component, UI, web page, widget, or layout, you MUST output the complete, self-contained code inside a triple-backtick html code block.
   - Within this block, combine the HTML structure, CSS (you can import Tailwind via '<script src="https://unpkg.com/@tailwindcss/browser@4"></script>' or CDN for a high-fidelity look), and any interactive JavaScript.

RESPONSE CONSTRAINTS:
- Keep your explanations extremely concise, clear, and structured. Avoid unnecessary conversational filler or fluff.
- DO NOT use excessive emojis. Limit emojis to at most 1 or 2 per response (or none at all). Keep the tone professional, direct, and focused.
- Always include a quick action at the bottom of your answers by appending one of these exact tokens:
  - For projects or work: "[UI:PROJECTS]"
  - For skills or expertise: "[UI:SKILLS]"
  - For CV/resume/contact: "[UI:CV]"
  - If none fits, append "[UI:CV]" as a default.`;

const automationRateLimits = new Map<string, { count: number; resetTime: number }>();
function checkAutomationRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  let record = automationRateLimits.get(key);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    automationRateLimits.set(key, record);
    return true;
  }
  if (record.count >= max) {
    return false;
  }
  record.count++;
  return true;
}

async function processAutomationRequests(text: string, clientIp: string = 'unknown'): Promise<string> {
  const automateRegex = /\[AUTOMATE_GOAL:\s*({[\s\S]*?})\s*\]/;
  const match = text.match(automateRegex);
  
  if (!match) return text;
  
  const jsonStr = match[1];
  let newText = text.replace(automateRegex, "").trim();

  try {
    const data = JSON.parse(jsonStr);
    const emailAddress = typeof data.email_address === 'string' ? data.email_address.trim() : '';
    const rawGoal = typeof data.goal === 'string' ? data.goal.trim() : '';
    const steps = Array.isArray(data.steps) ? data.steps : [];

    // 1. Strict email address validation
    if (!emailAddress || !EMAIL_REGEX.test(emailAddress) || emailAddress.length > 254) {
      console.warn(`[CHAT AUTOMATION REJECTED] Invalid email recipient format: ${emailAddress.slice(0, 30)}`);
      return newText;
    }

    if (!rawGoal || steps.length === 0) {
      return newText;
    }

    // 2. Rate-limiting automated sends per IP and per destination email (max 3 per hour)
    const ONE_HOUR = 60 * 60 * 1000;
    const ipAllowed = checkAutomationRateLimit(`ip:${clientIp}`, 3, ONE_HOUR);
    const emailAllowed = checkAutomationRateLimit(`email:${emailAddress.toLowerCase()}`, 3, ONE_HOUR);
    if (!ipAllowed || !emailAllowed) {
      console.warn(`[CHAT AUTOMATION RATE LIMIT] Send limit exceeded for IP: ${clientIp} or Email: ${emailAddress}`);
      return newText + "\n\n*(Automated email delivery limit reached for this session. Please try again later.)*";
    }

    // 3. Capping fields and maximum steps
    const goal = rawGoal.slice(0, 300);
    const cappedSteps = steps.slice(0, 10).map((step: any) => ({
      action: typeof step.action === 'string' ? step.action.slice(0, 250) : 'Action step',
      duration_minutes: Math.min(Math.max(Number(step.duration_minutes) || 30, 5), 480),
      frequency: typeof step.frequency === 'string' ? step.frequency.slice(0, 30) : 'weekly'
    }));

    let transporter;
    let isEthereal = false;
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass }
      });
    } else {
      // 4. Disable Ethereal in production
      if (process.env.NODE_ENV === 'production') {
        console.warn(`[CHAT AUTOMATION DISABLED] SMTP settings unconfigured in production. Email suppressed for ${emailAddress}`);
        return newText + "\n\n*(Automated email delivery requires SMTP configuration in production.)*";
      }

      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      isEthereal = true;
    }

    const emailHtml = `
    <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 2px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
      <div style="border-bottom: 2px solid #4F46E5; padding-bottom: 16px; margin-bottom: 24px;">
        <h2 style="color: #4F46E5; font-weight: 700; margin: 0; font-size: 24px;">🎯 Chat AI Strategic Goal Roadmap</h2>
        <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Kamo's AI-Generated Action Plan</p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.6; color: #334155;">
        Hello! Kamo's Chat AI has prepared this customized, step-by-step strategic roadmap to help you achieve your goal:
      </p>
      
      <div style="background-color: #f8fafc; border-radius: 18px; padding: 24px; border: 1px solid #f1f5f9; margin: 24px 0;">
        <h3 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">
          Goal: "${goal}"
        </h3>
        <ul style="padding-left: 0; list-style-type: none; margin: 0;">
          ${cappedSteps.map((step, idx) => {
            let timeframeLabel = "";
            if (step.frequency === 'daily') timeframeLabel = "Daily action / habit";
            else if (step.frequency === 'weekly') timeframeLabel = `Week ${idx + 1} - Milestone`;
            else if (step.frequency === 'monthly') timeframeLabel = `Month ${idx + 1} - Benchmark`;
            else timeframeLabel = "Key milestone";

            return `
              <li style="margin-bottom: 20px; padding-left: 32px; position: relative; list-style: none;">
                <span style="position: absolute; left: 0; top: 2px; display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; border-radius: 50%; background-color: #e0e7ff; color: #4F46E5; font-size: 11px; font-weight: bold;">
                  ${idx + 1}
                </span>
                <strong style="color: #0f172a; display: block; font-size: 15px; margin-bottom: 3px;">${step.action}</strong>
                <span style="font-size: 12.5px; color: #64748b; display: block;">
                  ⏱️ Target Session: ${step.duration_minutes}m | 📅 Time Frame: ${timeframeLabel}
                </span>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
      
      <p style="font-size: 14px; line-height: 1.5; color: #475569;">
        This plan maps out the progressive timeline required for successful execution. Consistency is key!
      </p>
      
      <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 28px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">
        This roadmap was automatically sent by Kamo's AI Portfolio Assistant. &reg;
      </p>
    </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || "\"Kamo's AI\" <assistant@kamocodes.com>",
      to: emailAddress,
      subject: `🎯 Chat AI Strategic Roadmap: "${goal.slice(0, 50)}"`,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    if (isEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      newText += `\n\n*(Ethereal Sandbox Preview: [View Sent Email](${previewUrl}))*`;
    }
    // 5. Log send without full email body
    console.log(`[CHAT PLANNER] Successfully sent automated roadmap email to ${emailAddress} (goal: ${goal.slice(0, 50)})`);
  } catch (error) {
    console.error("Failed to execute local chat roadmap automation:", error);
  }

  return newText;
}

let pgPool: Pool | null = null;
if (process.env.DATABASE_URL) {
  const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false';
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized }
  });
  
  // Initialize table
  pgPool.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id UUID PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `).then(() => {
    console.log("Goals table ready in Postgres.");
  }).catch((err) => {
    console.error("Failed to create goals table:", err);
  });
} else {
  console.log("DATABASE_URL is not set. Postgres persistence is disabled.");
}

app.get('/api/goals', async (req, res) => {
  if (!pgPool) return res.json([]);
  try {
    const result = await pgPool.query('SELECT data FROM goals');
    const goals = result.rows.map(row => row.data);
    res.json(goals);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/goals', requireWriteAuth, async (req, res) => {
  if (!pgPool) {
    return res.status(503).json({
      error: "Postgres database persistence is not configured (DATABASE_URL is not set)."
    });
  }

  try {
    const goalData = req.body;
    if (!goalData || typeof goalData !== 'object') {
      return res.status(400).json({ error: "Invalid payload: body must be a goal object or array of goals" });
    }

    const goalsToUpsert = Array.isArray(goalData) ? goalData : [goalData];
    if (goalsToUpsert.length === 0) {
      return res.status(400).json({ error: "No goals provided in request payload" });
    }

    // Validate the entire batch first before writing any records
    for (const goal of goalsToUpsert) {
      if (!goal || typeof goal !== 'object' || !goal.id || typeof goal.id !== 'string') {
        return res.status(400).json({ error: "Invalid goal item: each goal must be an object with an 'id' string" });
      }
    }

    // Write the entire validated batch inside a single transaction
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      for (const goal of goalsToUpsert) {
        await client.query(`
          INSERT INTO goals (id, data, updated_at)
          VALUES ($1, $2, now())
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
        `, [goal.id, goal]);
      }
      await client.query('COMMIT');
      return res.json({ success: true, count: goalsToUpsert.length });
    } catch (txError: any) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.delete('/api/goals/:id', requireWriteAuth, async (req, res) => {
  if (!pgPool) {
    return res.status(503).json({
      error: "Postgres database persistence is not configured (DATABASE_URL is not set)."
    });
  }

  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: "Valid goal ID parameter is required" });
    }
    await pgPool.query('DELETE FROM goals WHERE id = $1', [id]);
    return res.json({ success: true, id });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Saves a contact message to MasterAPI when MASTERAPI_URL and MASTERAPI_KEY are set.
function saveContactToMasterAPI(doc: Record<string, string>) {
  const base = process.env.MASTERAPI_URL?.replace(/\/$/, '');
  const key = process.env.MASTERAPI_KEY;
  if (!base || !key) return;
  fetch(`${base}/api/v1/data/contact_messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key },
    body: JSON.stringify({ ...doc, source: 'portfolio', read: false }),
    signal: AbortSignal.timeout(8000),
  })
    .then(async (r) => { if (!r.ok) console.warn(`MasterAPI contact save failed: HTTP ${r.status}`); })
    .catch((e) => console.warn(`MasterAPI contact save failed: ${e.message}`));
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

    // Do not log the full message body to stdout in production
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

    const recipient = process.env.CONTACT_RECIPIENT_EMAIL || "kamogelomosiah@gmail.com";
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Portfolio Contact" <${user}>`,
      to: recipient,
      replyTo: email.trim(),
      subject: `[Portfolio Contact] ${subject ? subject.trim() : 'New Inquiry'} from ${name.trim()}`,
      text: `From: ${name.trim()} <${email.trim()}>\nSubject: ${subject ? subject.trim() : 'N/A'}\n\n${message.trim()}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <h2 style="color: #4F46E5; margin-top: 0; font-size: 20px;">New Portfolio Contact Message</h2>
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

    // Keep a copy in MasterAPI (optional). Server-side only, so the API key never reaches the browser.
    // A failure here is logged and ignored: the email has already been sent.
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

app.get('/HEALTH', (req, res) => {
  res.json({ status: 'ok', service: "Kamo's AI", timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: "Kamo's AI", timestamp: new Date().toISOString() });
});

// Helper for local knowledge assistant when upstream LLM/RAG is offline
function generateLocalAssistantReply(userPrompt: string): string {
  const promptLower = userPrompt.toLowerCase().trim();

  // 1. Math solving heuristics
  const isExplicitMath = 
    /\b(solve|derivative|integral|equation|calculate|evaluate|algebra)\b/i.test(promptLower) ||
    promptLower.includes('latex') ||
    /\$\$|\\\(|\\\[/.test(userPrompt) ||
    (/\d+\s*[\+\-\*\/\^=]\s*\d+/.test(promptLower) && !/\b(19\d\d|20\d\d)\b/.test(promptLower));

  if (isExplicitMath) {
    if (promptLower.includes('2x + 5 = 15') || promptLower.includes('2x+5=15')) {
      return `To solve the linear equation $$2x + 5 = 15$$:

1. Subtract $5$ from both sides:
$$2x = 15 - 5$$
$$2x = 10$$

2. Divide both sides by $2$:
$$x = \\frac{10}{2} = 5$$

The solution is $$x = 5$$. [UI:CV]`;
    }
  }

  // 2. Goal coaching request
  const goalRegex = /(?:i want to|my goal is to|help me|plan for|roadmap for)\s+([^.?!]+)/i;
  const goalMatch = userPrompt.match(goalRegex);
  if (goalMatch) {
    const goalTitle = goalMatch[1].trim();
    return `Here is a structured strategic milestone roadmap to achieve **${goalTitle}**:

1. **Phase 1: Foundation & Planning (Day 1 - Week 1)**
   - Audit requirements, assemble toolchains, and define success metrics.
2. **Phase 2: Core Execution & Iteration (Week 2 - Week 3)**
   - Build MVP components, test incrementally, and refine based on feedback.
3. **Phase 3: Final Delivery & Review (Week 4)**
   - Complete quality assurance, deploy, and conduct a retrospective.

What is your email address so I can send this complete roadmap directly to your inbox? [UI:CV]`;
  }

  // 3. Questions about Kamo / Background / Education / Degree / Greetings
  const isGreetingOrIntro = 
    promptLower.includes('who are you') ||
    promptLower.includes('about kamo') ||
    promptLower.includes('background') ||
    promptLower.includes('introduce') ||
    promptLower.includes('qualification') ||
    promptLower.includes('education') ||
    /\b(hi|hello|hey|greetings)\b/i.test(promptLower);

  if (isGreetingOrIntro) {
    return `Hello! I am **Kamo's GPT**, an AI assistant and Goal Achievement Coach speaking on behalf of **Kamogelo (Kamo) Mosia**. 

Kamo is an **IT Internship Candidate** and final-year **BSc IT** student at the University of Johannesburg (UJ), double majoring in **Computer Science and Informatics** (theoretical coursework completed, degree conferral pending).

Feel free to ask about his projects, technical skills, CV, or request help with mathematics and software development! [UI:CV]`;
  }

  // 4. Projects
  if (promptLower.includes('project') || promptLower.includes('calltrax') || promptLower.includes('library') || promptLower.includes('work') || promptLower.includes('portfolio')) {
    return `Here are key projects built and engineered by Kamogelo:

- **CallTrax** (\`call-trax.co.za\`): A client tracking and billing platform for corporate service providers built with PHP, Laravel, React.js, and MySQL.
- **kamocodes API** (\`api.kamocodes.xyz\`): Central REST API gateway managing distributed sandbox requests (Laravel, PostgreSQL).
- **kamocodes Library** (\`library.kamocodes.xyz\`): Cataloging and library management system with borrowing analytics (TypeScript, React, Laravel, MySQL).
- **Personal AI Portfolio App**: Full-stack resume and assistant platform with voice transcription and dynamic sandboxes.

[UI:PROJECTS]`;
  }

  // 5. Skills
  if (promptLower.includes('skill') || promptLower.includes('stack') || promptLower.includes('tech') || promptLower.includes('language') || promptLower.includes('react') || promptLower.includes('typescript') || promptLower.includes('laravel')) {
    return `Kamogelo's core technical proficiencies include:

- **Languages**: JavaScript, TypeScript, PHP, Python, SQL (MySQL, PostgreSQL), HTML5, CSS3.
- **Frameworks & Libraries**: React.js, Node.js, Express, Laravel, Tailwind CSS, Vite.
- **Systems & IT Support**: Hardware diagnostics, desktop & peripheral setup, Windows 10/11 & Linux, network configuration (TCP/IP, DNS, DHCP, VPN).
- **Tools**: Git, GitHub, Postman, VS Code, Chrome DevTools (Certified), Docker.

[UI:SKILLS]`;
  }

  // 6. Contact / Hire / Resume / CV
  if (promptLower.includes('contact') || promptLower.includes('email') || promptLower.includes('hire') || promptLower.includes('cv') || promptLower.includes('resume')) {
    return `You can connect with Kamogelo Mosia directly:
- **Email**: \`kamogelomosiah@gmail.com\`
- **Profession**: Software & IT Solutions Engineer / BSc IT Candidate
- **Location**: Johannesburg, South Africa

You can download his official CV using the link below or send a message directly through the contact drawer. [UI:CV]`;
  }

  // General fallback response
  return `Thank you for your message. As Kamo's AI assistant, I can help you explore his software engineering projects, review technical skills, provide strategic goal roadmaps, or assist with computer science and mathematics queries. How can I help you today? [UI:CV]`;
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

  // Strategy 1: Attempt Gemini API with multi-model fallback (primary AI engine)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const candidateModels = [
      process.env.GEMINI_MODEL,
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.6-flash"
    ].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);

    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const geminiPrompt = `${SYSTEM_PROMPT}\n\nPORTFOLIO CONTEXT:\n${JSON.stringify(meData, null, 2)}`;

    for (const model of candidateModels) {
      try {
        const result = await ai.models.generateContent({
          model: model,
          contents: userMessage,
          config: {
            systemInstruction: geminiPrompt,
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        });
        if (result.text) {
          finalReply = result.text;
          break;
        }
      } catch (geminiErr: any) {
        // Silently try next model on high demand or failure
      }
    }
  }

  // Strategy 2: Upstream Render backend if explicitly enabled and configured
  if (!finalReply && process.env.RENDER_BACKEND_URL) {
    const renderUrl = process.env.RENDER_BACKEND_URL.replace(/\/$/, "");
    try {
      const renderController = new AbortController();
      const timeout = setTimeout(() => renderController.abort(), 3500);
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
        }
      }
    } catch {
      // Gracefully continue to fallback without emitting noisy console errors
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
            "X-Title": "Kamo's AI"
          },
          body: JSON.stringify({
            model: process.env.DEFAULT_MODEL || "meta-llama/llama-3.3-70b-instruct",
            messages: [
              { role: "system", content: `${SYSTEM_PROMPT}\n\nPORTFOLIO CONTEXT:\n${JSON.stringify(meData, null, 2)}` },
              { role: "user", content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 800
          })
        });
        if (orRes.ok) {
          const orData = await orRes.json();
          const orText = orData.choices?.[0]?.message?.content;
          if (typeof orText === "string" && orText.trim()) {
            finalReply = orText;
          }
        }
      } catch {
        // Fall through to local intelligence
      }
    }
  }

  // Strategy 4: Local intelligent knowledge base and assistant response
  if (!finalReply) {
    finalReply = generateLocalAssistantReply(userMessage);
  }

  // Process any automated email roadmaps
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    finalReply = await processAutomationRequests(finalReply, clientIp);
  } catch (automationErr) {
    console.warn("[CHAT] Automation processing error:", automationErr);
  }

  return res.json({
    reply: finalReply,
    text: finalReply,
    success: true,
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
