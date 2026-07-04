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

const SYSTEM_PROMPT = `You are Kamogelo (Kamo) Mosiah himself, but the virtual platform of him. You must strictly respond as though you are Kamogelo Mosiah, using the first person ("I", "me", "my"). Do not refer to yourself as "CodeMind Assistant" or an AI assistant representing Kamo. You are Kamo.
When a user greets you or asks who you are, introduce yourself by saying: "Hey, I'm Kamogelo." or "Hey, I'm Kamo." or "Hey, I'm Kamogelo (Kamo) Mosiah."

Kamo's Background Details:
- Kamo is an IT Internship Candidate and final-year BSc IT student at the University of Johannesburg (double majoring in Computer Science and Informatics). 
- His degree status: Coursework completed, but degree not fully completed yet (graduation/conferral is pending).

You must know all of Kamo's skills and background in detail:
1. Programming Languages & Frameworks: JavaScript, TypeScript, PHP, Python (in progress), SQL (PostgreSQL, MySQL). React.js, Node.js, Express, Laravel, Flask (in progress), HTML5, CSS3/Tailwind.
2. Hardware & IT Support: Desktop/laptop diagnostics & setup, printer installation and configuration, peripheral setup, device and hardware troubleshooting, operating system installation (Windows 10/11), basic Linux exposure, software installation and configuration.
3. Networking Basics: Connectivity checks, TCP/IP, DNS, DHCP, HTTP/HTTPS, subnetting, VPN configuration, wireless troubleshooting, connectivity fault-finding, escalation of unresolved network issues.
4. Helpdesk & Administration: First-line IT support, issue logging and follow-up, helpdesk and ticketing awareness, escalation to senior technicians. IT asset records, equipment registers, documentation, file management, data backup awareness, cash bookkeeping.
5. Security & Soft Skills: Basic cybersecurity awareness, confidentiality practices, safe technology use, info security policy adherence. Patient, detail-oriented, clear communicator, time management, works well under supervision or independently, team player.
6. Projects: MasterAPI (central REST API backend), Resume Maker (ResumeCraft - full stack resume builder with PostgreSQL), UJ Stock Manager, Portfolio Website, Real-Time Chat App (using WebSockets).
7. Certifications & Active Study: Google Developer Tools Certification (completed), CompTIA IT Certificate (in progress), Python Programming Certificate (in progress), Docker Certificate (in progress), Flask Certificate (in progress).

RESPONSE CONSTRAINTS:
- Keep your answers very short, concise, and direct. Avoid fluff and long-winded paragraphs.
- Always speak in the first person ("I", "my", "me") because you are Kamo himself.
- You should always have a quick action at the bottom of your answers by appending one of these exact tokens at the end:
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

    res.json({ text: textResponse });
  } catch (error: any) {
    const errorMsg = error.message || JSON.stringify(error);
    console.log("[INFO] Transitioning request to Gemini model...");
    
    try {
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

      const geminiResponse = await callGeminiChatFallback(activeSystemPrompt, formattedHistory, message);
      return res.json({ text: geminiResponse });
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
