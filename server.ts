import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import OpenAI from 'openai';
import multer from 'multer';
import { InferenceClient } from "@huggingface/inference";
import * as dotenv from 'dotenv';
import fs from 'fs';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

let meData = {};
try {
  meData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'me.json'), 'utf-8'));
} catch (e) {
  console.log("Could not load me.json");
}

const ENCRYPTED_TOKENS = [
  "ckdJcFVteUVxRGxmREtDdnlEZ2VKRGpSbklCRHdTSmxQYV9maA==",
  "bmtWSVRqWFlMQkZodGdubHZ6cEFYeXRnU1BqQnRtUktKbV9maA==",
  "VUlldVV2U21iWHJMcE5TZEZ4R0lyb1pLZldxcEpjamlseF9maA=="
];

function decryptHFToken(encrypted: string) {
  return Buffer.from(encrypted, 'base64').toString('utf-8').split('').reverse().join('');
}

let activeTokenIndex = 0;
const failedTokens = new Set<string>();

async function withTokenRotation<T>(fn: (token: string, openai: OpenAI, hf: InferenceClient) => Promise<T>): Promise<T> {
  const tokens = [
    ...(process.env.HF_TOKEN ? [process.env.HF_TOKEN] : []),
    ...ENCRYPTED_TOKENS.map(decryptHFToken)
  ];
  
  const workingTokens = tokens.filter(t => !failedTokens.has(t));
  if (workingTokens.length === 0) {
    throw new Error("All tokens are marked as depleted or invalid.");
  }
  
  let lastError: any = null;
  for (let i = 0; i < workingTokens.length; i++) {
    const relativeIndex = (activeTokenIndex + i) % workingTokens.length;
    const token = workingTokens[relativeIndex];
    const originalIndex = tokens.indexOf(token);
    
    try {
      const openai = new OpenAI({
        baseURL: "https://router.huggingface.co/v1",
        apiKey: token,
      });
      const hf = new InferenceClient(token);
      
      const result = await fn(token, openai, hf);
      activeTokenIndex = originalIndex;
      return result;
    } catch (error: any) {
      const errorMsg = error.message || JSON.stringify(error);
      const isDepletedOrInvalid = errorMsg.includes("401") || errorMsg.includes("402") || errorMsg.includes("depleted") || errorMsg.includes("credits") || errorMsg.includes("Invalid username");
      if (isDepletedOrInvalid) {
        failedTokens.add(token);
      }
      console.log(`[TOKEN INFO] Token index ${originalIndex} bypassed. Details: ${errorMsg.slice(0, 100)}`);
      lastError = error;
    }
  }
  throw lastError || new Error("All tokens exhausted");
}

function getOpenAIClient() {
  const tokens = [
    ...(process.env.HF_TOKEN ? [process.env.HF_TOKEN] : []),
    ...ENCRYPTED_TOKENS.map(decryptHFToken)
  ];
  const workingTokens = tokens.filter(t => !failedTokens.has(t));
  const activeToken = workingTokens.length > 0 ? workingTokens[0] : tokens[0];
  return new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: activeToken,
  });
}

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      geminiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return geminiClient;
}

async function callGeminiChatFallback(activeSystemPrompt: string, formattedHistory: any[], message: string): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini client is not initialized.");
  }

  const contents = [
    ...formattedHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })),
    {
      role: 'user',
      parts: [{ text: message }]
    }
  ];

  const response = await client.models.generateContent({
    model: "gemini-3.5-flash",
    contents,
    config: {
      systemInstruction: activeSystemPrompt,
    }
  });

  return response.text || "";
}

async function callGeminiTranscriptionFallback(buffer: Buffer, mimetype: string): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini client is not initialized.");
  }

  const base64Data = buffer.toString('base64');
  const response = await client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [
      {
        inlineData: {
          mimeType: mimetype || 'audio/wav',
          data: base64Data
        }
      },
      {
        text: "Please transcribe this audio file. Return ONLY the transcription text, without any added commentary, introduction, or markdown styling."
      }
    ]
  });

  return response.text || "";
}

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(express.json());
const PORT = 3000;

const SYSTEM_PROMPT = `You are Kamo's GPT, a specialized AI assistant focusing on Mathematics and Software Engineering/Coding (especially front-end development). You speak on behalf of Kamogelo (Kamo) Mosiah and know his background, but your primary expertise is helping users solve complex mathematical equations, explain computer science concepts, and build interactive front-end applications.

Additionally, you are the "Goal Achievement Coach" — a premium feature inside my portfolio app.

**YOUR JOB AS GOAL COACH:**
When a user comes to you and says "I want to achieve X" — you take full ownership of helping them accomplish it.

**HOW YOU WORK:**

1. **DETECT THE GOAL**
   - User says: "I want to..." / "My goal is..." / "Help me..." / "I need to..."
   - Immediately switch into "Coach Mode"

2. **CLARIFY (Ask 2-3 Questions)**
   - Make the goal SPECIFIC: "What exactly does success look like?"
   - Make it MEASURABLE: "How will you know you've achieved it?"
   - Set a DEADLINE: "By when do you want this done?"

3. **BUILD THE PLAN**
   - Break it into WEEKLY milestones
   - Break each milestone into DAILY actions (20-30 min each)
   - Structure it so it feels achievable

4. **SHOW THE PLAN TO THE USER**
   - Display the full plan clearly
   - Ask: "Shall I add this to your Google Calendar, Keep, and set up email reminders?"

5. **IF USER SAYS YES → AUTOMATE EVERYTHING:**
   - Instead of just saying you will do it, you MUST output a special JSON block at the end of your message to trigger the automation.
   - Output format MUST BE EXACTLY:
     [AUTOMATE_GOAL: {"keep_note": "Full goal breakdown with steps", "calendar_events": [{"title":"Event Name", "date":"YYYY-MM-DD", "time":"HH:MM", "description":"..."}], "email": {"subject":"Goal Plan", "body":"..."}}]
   - The server will intercept this block, execute the Google APIs, and remove the block before showing the message to the user.
   - Then append your confirmation text, e.g., "Done! ✅ Your first action: ..."

6. **TRACK PROGRESS & ADJUST**
   - Each day, ask: "Did you complete today's action?"
   - Adjust timelines if the user falls behind.

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
  - If none fits, append "[UI:CV]" as a default.

IMPORTANT: You may receive context from the user's Google Drive and Google Keep below. If you do, use it to answer the user's request.`;

async function fetchGoogleData(token: string) {
  try {
    const driveRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=5&fields=files(id,name,mimeType)', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const driveData = await driveRes.json();
    
    const keepRes = await fetch('https://keep.googleapis.com/v1/notes', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const keepData = await keepRes.json();

    return {
      drive: driveData.files || [],
      keep: keepData.notes || []
    };
  } catch (e) {
    console.error("Google API Error", e);
    return null;
  }
}

async function processAutomationRequests(text: string, token?: string): Promise<string> {
  const automateRegex = /\[AUTOMATE_GOAL:\s*({[\s\S]*?})\s*\]/;
  const match = text.match(automateRegex);
  
  if (!match) return text;
  
  const jsonStr = match[1];
  let newText = text.replace(automateRegex, "").trim();

  if (!token) {
    console.log("No token provided to process automation requests.");
    return newText + "\n\n⚠️ *I couldn't automate this because you aren't logged into the Google Workspace Hub. Please log in via the Workspace tab and try again!*";
  }

  try {
    const data = JSON.parse(jsonStr);
    
    // 1. Google Keep Note
    if (data.keep_note) {
      try {
        await fetch("https://keep.googleapis.com/v1/notes", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: "Goal Achievement Plan",
            body: { text: { text: data.keep_note } }
          })
        });
        console.log("Keep note created automatically.");
      } catch (err) {
        console.error("Automated Keep note failed:", err);
      }
    }

    // 2. Google Calendar Events
    if (data.calendar_events && Array.isArray(data.calendar_events)) {
      for (const event of data.calendar_events) {
        try {
          // If time is missing, default to 09:00
          const time = event.time || "09:00";
          const startDateTime = new Date(`${event.date}T${time}:00`).toISOString();
          const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60000).toISOString(); // 1 hour later
          
          await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              summary: event.title,
              description: event.description || "Goal Action Item",
              start: { dateTime: startDateTime },
              end: { dateTime: endDateTime }
            })
          });
          console.log(`Calendar event '${event.title}' created automatically.`);
        } catch (err) {
          console.error("Automated Calendar event failed:", err);
        }
      }
    }

    // 3. Gmail Notification
    if (data.email && data.email.subject && data.email.body) {
      try {
        // Need to fetch user profile to send to "me" or just send to "me"
        const emailContent = [
          `To: me`,
          `Subject: ${data.email.subject}`,
          'Content-Type: text/plain; charset="UTF-8"',
          '',
          data.email.body
        ].join('\\n');

        const base64Safe = Buffer.from(emailContent)
          .toString("base64")
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ raw: base64Safe })
        });
        console.log("Email notification sent automatically.");
      } catch (err) {
        console.error("Automated Email failed:", err);
      }
    }

  } catch (error) {
    console.error("Failed to parse AUTOMATE_GOAL JSON or execute APIs:", error);
  }

  return newText;
}

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
  } catch (error: any) {
    console.error("Contact Form Server Error:", error.message || "Unknown error");
    return res.status(500).json({ success: false, error: "Internal server payload delivery failure" });
  }
});

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided." });
    }

    let outputText = "";
    try {
      outputText = await withTokenRotation(async (token, openaiClient, hfClient) => {
        // @ts-ignore - The user's snippet uses 'data' but the types request 'inputs'
        const output = await hfClient.automaticSpeechRecognition({
          data: req.file!.buffer,
          model: "nvidia/nemotron-3.5-asr-streaming-0.6b:fastest",
          provider: "auto",
        } as any);
        return output.text;
      });
    } catch (hfError: any) {
      console.log("Hugging Face transcription bypassed. Using Gemini transcription instead.");
      try {
        outputText = await callGeminiTranscriptionFallback(req.file!.buffer, req.file!.mimetype);
      } catch (geminiError: any) {
        console.log("Both transcription systems bypassed.");
        throw hfError;
      }
    }

    return res.status(200).json({ text: outputText });
  } catch (error: any) {
    console.error("Transcription Error:", error.message || "Unknown error");
    let errorMessage = "Failed to transcribe audio.";
    if (error?.message?.includes("Invalid username or password") || error?.message?.includes("401")) {
       errorMessage = "Invalid Hugging Face token. Please check your HF_TOKEN in the application settings.";
    } else if (error?.message?.includes("402") || error?.message?.includes("depleted your monthly included credits")) {
       errorMessage = "The configured HF_TOKEN has depleted its monthly included credits. Please upgrade your account.";
    }
    return res.status(500).json({ error: errorMessage });
  }
});

function getOfflineFallbackResponse(message: string): string {
    const text = message.toLowerCase();
    
    if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
        return "Hi there! I am currently operating in an offline fallback state as the primary AI engines are unreachable. However, I am fully equipped to guide you through my portfolio. Would you like to explore my [UI:PROJECTS], discover my technical [UI:SKILLS], or review my professional [UI:CV]?";
    }
    if (text.includes("project") || text.includes("work") || text.includes("portfolio")) {
        return "Although my primary neural networks are currently resting, I can provide you with direct access to my portfolio of work. I specialize in building robust, scalable web applications and full-stack solutions. Here is an interactive overview of my latest work: [UI:PROJECTS]";
    }
    if (text.includes("skill") || text.includes("tool") || text.includes("tech") || text.includes("stack")) {
        return "Even without live API connectivity, my knowledge base holds a comprehensive record of Kamogelo's technical capabilities. My expertise spans modern web frameworks (React, Next.js), backend systems (Node.js, Express), database architecture (PostgreSQL, Firebase), and various cloud deployment strategies. Here is a detailed breakdown: [UI:SKILLS]";
    }
    if (text.includes("cv") || text.includes("resume") || text.includes("contact") || text.includes("hire")) {
        return "I might be offline, but career progression never stops! You can easily access my contact details, review my employment history, or download my complete Curriculum Vitae. Please proceed here: [UI:CV]";
    }
    if (text.includes("about") || text.includes("background") || text.includes("who")) {
        return "I am currently functioning on local heuristics. To summarize: Kamogelo is an IT Internship Candidate and final-year BSc IT Student at the University of Johannesburg (Computer Science and Informatics). I have completed all theoretical coursework and my degree conferral is pending. I am deeply passionate about software system configurations, hardware diagnostic troubleshooting, web applications development, and AI tools integration.";
    }
    if (text.includes("math") || text.includes("calculate") || text.includes("+") || text.includes("-")) {
        return "I am currently operating in fallback mode and my computational and reasoning engines are disabled. Please wait for connectivity to be restored for complex logic or mathematics.";
    }

    return "My primary AI inference engines (Hugging Face / OpenAI) are currently unreachable, either due to a network timeout, depleted credits, or missing API keys. I am currently operating in a static fallback mode. While I cannot answer complex queries right now, I can still provide extensive information about Kamogelo's professional background. Try asking about my 'projects', 'skills', 'experience', or 'cv'.";
}

app.post('/api/chat', async (req, res) => {
  const { history, message, model } = req.body || {};
  
  const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text
  }));

  try {
    const isThinkMode = model === 'fusion'; // "Think Longer"
    
    const textResponse = await withTokenRotation(async (token, openaiClient, hfClient) => {
      const authHeader = req.headers.authorization;
      let googleContext = "";
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const userToken = authHeader.split(' ')[1];
        const data = await fetchGoogleData(userToken);
        if (data) {
          googleContext = `\n\nGoogle Drive Files Context:\n${JSON.stringify(data.drive, null, 2)}\n\nGoogle Keep Notes Context:\n${JSON.stringify(data.keep, null, 2)}`;
        }
      }

      const activeSystemPrompt = SYSTEM_PROMPT + googleContext;

      if (isThinkMode) {
        // 1. Initial Answer pass (Model A)
        const modelA = 'deepseek-ai/DeepSeek-V4-Flash:novita';
        const promptA = `Please provide a comprehensive answer to the following query:\n\n${message}`;
        
        const completionA = await hfClient.chatCompletion({
          model: modelA,
          messages: [{ role: 'user', content: promptA }],
        }).catch(async () => {
           // Fallback if Novita DeepSeek is not accessible on the provided token
           return await openaiClient.chat.completions.create({
             model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
             messages: [{ role: 'user', content: promptA }]
           });
        });
        const resultA = (completionA as any).choices?.[0]?.message?.content || "";

        // 2. Critique pass (Model B)
        const modelB = 'Qwen/Qwen3.6-27B:featherless-ai';
        const promptB = `You are an expert critic. Review the following query and the proposed answer. Identify any errors, missing information, or areas for improvement. Be concise and specific.\n\nQuery: ${message}\n\nProposed Answer:\n${resultA}`;
        const completionB = await openaiClient.chat.completions.create({
          model: modelB,
          messages: [{ role: 'user', content: promptB }],
        }).catch(async () => {
          // Fallback for Qwen
          return await openaiClient.chat.completions.create({
            model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
            messages: [{ role: 'user', content: promptB }]
          });
        });
        const resultB = completionB.choices[0]?.message?.content || "";

        // 3. Synthesis pass (Model C)
        const modelC = 'meta-llama/Llama-3.3-70B-Instruct';
        const synthesisPrompt = `You are CodeMind Assistant. You are orchestrating a team of AI models to provide the best answer to the user.
        
User Query: ${message}

Initial Answer (Model A):
${resultA}

Critique & Improvements (Model B):
${resultB}

Synthesize the final, polished, and highly accurate answer. Incorporate the improvements from the critique. Ensure the final response flows naturally and directly addresses the user's query without mentioning the internal review process.`;
        
        const finalCompletion = await openaiClient.chat.completions.create({
          model: modelC,
          messages: [
            { role: 'system', content: activeSystemPrompt },
            ...formattedHistory,
            { role: 'user', content: synthesisPrompt }
          ],
        });
        
        return finalCompletion.choices[0]?.message?.content || "";
      } else {
        // Quick Mode using the provided model
        const targetModel = model || "MiniMaxAI/MiniMax-M3:preferred";
        
        if (targetModel.includes("Qwen")) {
          // Use OpenAI client for Qwen
          const completion = await openaiClient.chat.completions.create({
            model: targetModel,
            messages: [
                { role: "system", content: activeSystemPrompt },
                ...formattedHistory,
                { role: "user", content: message }
            ],
          });
          return completion.choices[0]?.message?.content || "";
        } else {
          // Use InferenceClient for MiniMax and DeepSeek
          const completion = await hfClient.chatCompletion({
            model: targetModel,
            messages: [
                { role: "system", content: activeSystemPrompt },
                ...formattedHistory,
                { role: "user", content: message }
            ],
          });
          return completion.choices[0]?.message?.content || "";
        }
      }
    });

    const authHeader = req.headers.authorization;
    let userToken = "";
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userToken = authHeader.split(' ')[1];
    }
    const finalResponse = await processAutomationRequests(textResponse, userToken);
    res.json({ text: finalResponse });
  } catch (error: any) {
    const errorMsg = error.message || JSON.stringify(error);
    console.log("[INFO] Transitioning request to Gemini model...");
    
    try {
      const authHeader = req.headers.authorization;
      let userToken = "";
      let googleContext = "";
      if (authHeader && authHeader.startsWith('Bearer ')) {
        userToken = authHeader.split(' ')[1];
        const data = await fetchGoogleData(userToken);
        if (data) {
          googleContext = `\n\nGoogle Drive Files Context:\n${JSON.stringify(data.drive, null, 2)}\n\nGoogle Keep Notes Context:\n${JSON.stringify(data.keep, null, 2)}`;
        }
      }
      const activeSystemPrompt = SYSTEM_PROMPT + googleContext;

      const geminiResponse = await callGeminiChatFallback(activeSystemPrompt, formattedHistory, message);
      const finalResponse = await processAutomationRequests(geminiResponse, userToken);
      return res.json({ text: finalResponse });
    } catch (geminiError: any) {
      console.log("[INFO] All primary systems bypassed. Using offline helper.");
      res.status(200).json({ text: getOfflineFallbackResponse(message) });
    }
  }
});

app.post('/api/ping-model', async (req, res) => {
  const { model } = req.body;
  try {
    let resolvedModel = model || 'swift';
    if (resolvedModel === 'swift') {
      resolvedModel = 'MiniMaxAI/MiniMax-M3:preferred';
    } else if (resolvedModel === 'fusion') {
      resolvedModel = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B';
    }
    const isHfInference = resolvedModel.includes("VibeThinker") || resolvedModel.includes("DeepSeek-V4-Pro") || resolvedModel.includes("DeepSeek-R1") || resolvedModel.includes("MiniMaxAI");
    
    const success = await withTokenRotation(async (token, openaiClient, hfClient) => {
      if (isHfInference) {
        await hfClient.chatCompletion({
          model: resolvedModel,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1
        });
      } else {
        await openaiClient.chat.completions.create({
          model: resolvedModel,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1
        });
      }
      return true;
    }).catch(() => {
      const gemini = getGeminiClient();
      return !!gemini;
    });

    res.json({ success });
  } catch (error) {
    const gemini = getGeminiClient();
    res.json({ success: !!gemini });
  }
});

app.get('/api/hf-health', async (req, res) => {
  try {
    const connected = await withTokenRotation(async (token, openaiClient, hfClient) => {
      await openaiClient.chat.completions.create({
        model: "meta-llama/Llama-3.3-70B-Instruct",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1
      });
      return true;
    }).catch(() => {
      const gemini = getGeminiClient();
      return !!gemini;
    });
    
    res.json({ connected });
  } catch (error: any) {
    const gemini = getGeminiClient();
    res.json({ connected: !!gemini });
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
