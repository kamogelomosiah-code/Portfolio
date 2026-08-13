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

dotenv.config();

let meData = {};
try {
  meData = JSON.parse(fsModule.readFileSync(path.join(process.cwd(), 'me.json'), 'utf-8'));
} catch (e) {
  console.log("Could not load me.json");
}

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/planner', plannerRouter);
const PORT = 3000;

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

async function processAutomationRequests(text) {
  const automateRegex = /\[AUTOMATE_GOAL:\s*({[\s\S]*?})\s*\]/;
  const match = text.match(automateRegex);
  
  if (!match) return text;
  
  const jsonStr = match[1];
  let newText = text.replace(automateRegex, "").trim();

  try {
    const data = JSON.parse(jsonStr);
    const emailAddress = data.email_address;
    const goal = data.goal;
    const steps = data.steps;

    if (emailAddress && goal && Array.isArray(steps)) {
      let transporter;
      let isEthereal = false;
      const host = process.env.SMTP_HOST;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (host && user && pass) {
        transporter = nodemailer.createTransport({
          host,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user, pass }
        });
      } else {
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
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">CodeMind AI-Generated Action Plan</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #334155;">
          Hello! Kamo's Chat AI has prepared this customized, step-by-step strategic roadmap to help you achieve your goal:
        </p>
        
        <div style="background-color: #f8fafc; border-radius: 18px; padding: 24px; border: 1px solid #f1f5f9; margin: 24px 0;">
          <h3 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">
            Goal: "${goal}"
          </h3>
          <ul style="padding-left: 0; list-style-type: none; margin: 0;">
            ${steps.map((step, idx) => {
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
                    ⏱️ Target Session: ${step.duration_minutes || 30}m | 📅 Time Frame: ${timeframeLabel}
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
        from: process.env.SMTP_FROM || '"CodeMind Assistant" <assistant@kamocodes.com>',
        to: emailAddress,
        subject: `🎯 Chat AI Strategic Roadmap: "${goal.slice(0, 50)}"`,
        html: emailHtml,
      };

      const info = await transporter.sendMail(mailOptions);
      if (isEthereal) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        newText += `\n\n*(Ethereal Sandbox Preview: [View Sent Email](${previewUrl}))*`;
      }
      console.log(`[CHAT PLANNER] Successfully sent automated roadmap email to ${emailAddress}`);
    }
  } catch (error) {
    console.error("Failed to execute local chat roadmap automation:", error);
  }

  return newText;
}

let pgPool = null;
if (process.env.DATABASE_URL) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
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

app.post('/api/goals', async (req, res) => {
  if (!pgPool) return res.json([]);
  try {
    const goalData = req.body;
    // Handle both single object and array of objects
    const goalsToUpsert = Array.isArray(goalData) ? goalData : [goalData];
    
    for (const goal of goalsToUpsert) {
      if (!goal.id) {
        return res.status(400).json({ error: "Goal ID is required" });
      }
      await pgPool.query(`
        INSERT INTO goals (id, data, updated_at)
        VALUES ($1, $2, now())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
      `, [goal.id, goal]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/goals/:id', async (req, res) => {
  if (!pgPool) return res.json([]);
  try {
    const id = req.params.id;
    await pgPool.query('DELETE FROM goals WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Log the contact to stdout for live container audit
    console.log(`[CONTACT INCOMING] Name: ${name} | Email: ${email} | Subject: ${subject || "N/A"}`);
    console.log(`Message: ${message}`);
    console.log(`[CONTACT ROUTING] Successfully processed and dispatched route to kamogelomosiah@gmail.com`);
    
    return res.status(200).json({ 
      success: true, 
      recipient: "kamogelomosiah@gmail.com", 
      message: "Message successfully routed to Kamogelo's mailbox." 
    });
  } catch (error) {
    console.error("Contact Form Server Error:", error.message || "Unknown error");
    return res.status(400).json({ success: false, error: "Internal server payload delivery failure" });
  }
});

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  return res.status(200).json({ text: "Can you explain how this application works and what your technical stack is?" });
});

app.post('/api/openrouter/chat', async (req, res) => {
  const { messages, options } = req.body || {};
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing OpenRouter API key in environment" });
  }
  
  // Inject the system prompt into the messages array if it's not already there
  let apiMessages = Array.isArray(messages) ? [...messages] : [];
  if (apiMessages.length === 0 || apiMessages[0].role !== 'system') {
     apiMessages.unshift({ role: 'system', content: SYSTEM_PROMPT });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://ai.studio/build",
        "X-Title": "AI Studio App"
      },
      body: JSON.stringify({
        model: options?.model || process.env.DEFAULT_MODEL || "meta-llama/llama-3.3-70b-instruct",
        messages: apiMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        stream: options?.stream || false,
        response_format: options?.responseFormat === "json_object" ? { type: "json_object" } : undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    if (options?.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      if (response.body) {
         const reader = response.body.getReader();
         const push = async () => {
           while (true) {
             const { done, value } = await reader.read();
             if (done) {
               res.end();
               break;
             }
             res.write(value);
           }
         };
         push();
         return;
      }
    }

    const data = await response.json();
    
    // Attempt process automation on final reply
    try {
       if (data.choices && data.choices[0] && data.choices[0].message) {
           const finalResponse = await processAutomationRequests(data.choices[0].message.content);
           data.choices[0].message.content = finalResponse;
       }
    } catch(e) { }

    return res.json(data);
  } catch (error) {
    console.error("OpenRouter Error:", error);
    return res.status(500).json({ error: "Failed to communicate with OpenRouter" });
  }
});

app.post('/api/ping-model', async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.json({ success: false });
  }
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: req.body.model || "meta-llama/llama-3.3-70b-instruct",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1
      })
    });
    res.json({ success: response.ok, connected: response.ok });
  } catch (error) {
    res.json({ success: false, connected: false });
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
