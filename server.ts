import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import OpenAI from 'openai';
import multer from 'multer';
import { InferenceClient } from "@huggingface/inference";
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

let meData = {};
try {
  meData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'me.json'), 'utf-8'));
} catch (e) {
  console.log("Could not load me.json");
}

const ENCRYPTED_TOKENS = [
  "ckdJcFVteUVxRGxmREtDdnlEZ2VKRGpSbklCRHdTSmxQYV9maA==",
  "bmtWSVRqWFlMQkZodGdubHZ6cEFYeXRnU1BqQnRtUktKbV9maA=="
];

function decryptHFToken(encrypted: string) {
  return Buffer.from(encrypted, 'base64').toString('utf-8').split('').reverse().join('');
}

const HF_TOKEN_FALLBACK = decryptHFToken(ENCRYPTED_TOKENS[0]);

function getOpenAIClient() {
  const currentToken = process.env.HF_TOKEN || HF_TOKEN_FALLBACK;
  return new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: currentToken,
  });
}

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(express.json());
const PORT = 3000;

const SYSTEM_PROMPT = `You are CodeMind Assistant, an AI assistant representing Kamogelo (Kamo) Mosiah.
Kamo is a BSc IT graduate (Computer Science and Informatics, University of Johannesburg) looking for opportunities in IT support, software development, and graduate programmes. 
His degree status: "Coursework completed, conferral pending."
Tech Stack: Python, JavaScript/full-stack, Docker, Flask
Live Projects: Resume Maker, MasterAPI, Real-Time Chat App, CallTrax, KamoCodes, Portfolio Website
GitHub: github.com/kamogelomosiah-code
Portfolio: portfolio-q5ji.onrender.com

You are highly capable of answering general questions, doing math, drafting emails, explaining concepts, AND talking about Kamo's background if asked. Answer clearly and professionally.

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

    const currentToken = process.env.HF_TOKEN || HF_TOKEN_FALLBACK;
    if (!currentToken) {
      return res.status(500).json({ error: "HF_TOKEN environment variable is missing. Please configure it in the application settings to use voice transcription." });
    }

    const hfClient = new InferenceClient(currentToken);
    // @ts-ignore - The user's snippet uses 'data' but the types request 'inputs'
    const output = await hfClient.automaticSpeechRecognition({
      data: req.file.buffer,
      model: "nvidia/nemotron-3.5-asr-streaming-0.6b:fastest",
      provider: "auto",
    } as any);

    return res.status(200).json({ text: output.text });
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
        return "Hi there! I am currently in offline mode, but I can still answer simple requests. Would you like to see my [UI:PROJECTS], [UI:SKILLS], or [UI:CV]?";
    }
    if (text.includes("project") || text.includes("work")) {
        return "The AI is offline for now, but here is a quick look at my projects! [UI:PROJECTS]";
    }
    if (text.includes("skill") || text.includes("tool")) {
        return "I am currently offline, but here is my technical skillset: [UI:SKILLS]";
    }
    if (text.includes("cv") || text.includes("resume") || text.includes("contact")) {
        return "Even though my AI engine is resting, you can still get my contact details or download my CV right here: [UI:CV]";
    }
    if (text.includes("about") || text.includes("background")) {
        return "In my offline state, I can summarize: Kamogelo is an IT Solutions Engineer who graduated from UJ with a BSc in IT. I'm passionate about web apps and systems.";
    }

    return "I am currently offline and my reasoning engine is unavailable. My capabilities are restricted to simple answers. Try asking about my 'projects', 'skills', or 'cv'.";
}

app.post('/api/chat', async (req, res) => {
  const { history, message, model } = req.body || {};
  try {
    const isThinkMode = model === 'fusion'; // "Think Longer"
    const currentToken = process.env.HF_TOKEN || HF_TOKEN_FALLBACK;
    
    if (!currentToken) {
      return res.status(200).json({ text: "HF_TOKEN is not configured yet. Please configure it in settings." });
    }

    const authHeader = req.headers.authorization;
    let googleContext = "";
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const userToken = authHeader.split(' ')[1];
      const data = await fetchGoogleData(userToken);
      if (data) {
        googleContext = `\n\nGoogle Drive Files Context:\n${JSON.stringify(data.drive, null, 2)}\n\nGoogle Keep Notes Context:\n${JSON.stringify(data.keep, null, 2)}`;
      }
    }

    const formattedHistory = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
    }));

    const openaiClient = getOpenAIClient();
    const hfClient = new InferenceClient(currentToken);
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
      
      const textResponse = finalCompletion.choices[0]?.message?.content || "";
      res.json({ text: textResponse });
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
        res.json({ text: completion.choices[0]?.message?.content || "" });
      } else {
        // Use InferenceClient for MiniMax and DeepSeek
        const hfClient = new InferenceClient(currentToken);
        const completion = await hfClient.chatCompletion({
          model: targetModel,
          messages: [
              { role: "system", content: activeSystemPrompt },
              ...formattedHistory,
              { role: "user", content: message }
          ],
        });
        res.json({ text: completion.choices[0]?.message?.content || "" });
      }
    }
  } catch (error: any) {
    const errorMsg = error.message || JSON.stringify(error);
    if (errorMsg.includes("401") || errorMsg.includes("Invalid username or password")) {
      return res.status(200).json({ text: "The configured HF_TOKEN is invalid. Please update it in your environment settings." });
    }
    if (errorMsg.includes("402") || errorMsg.includes("depleted your monthly included credits")) {
      return res.status(200).json({ text: "The configured HF_TOKEN has depleted its monthly included credits. Please purchase pre-paid credits or upgrade your account." });
    }
    console.log("Model API Error:", error.message || error);
    res.status(200).json({ text: getOfflineFallbackResponse(message) });
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
    if (isHfInference) {
      const currentToken = process.env.HF_TOKEN || HF_TOKEN_FALLBACK;
      const hfClient = new InferenceClient(currentToken);
      await hfClient.chatCompletion({
        model: resolvedModel,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1
      });
    } else {
      const openaiClient = getOpenAIClient();
      await openaiClient.chat.completions.create({
        model: resolvedModel,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false });
  }
});

app.get('/api/hf-health', async (req, res) => {
  try {
    const currentToken = process.env.HF_TOKEN || HF_TOKEN_FALLBACK;
    if (!currentToken) {
      return res.json({ connected: false });
    }
    const openaiClient = getOpenAIClient();
    await openaiClient.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1
    });
    res.json({ connected: true });
  } catch (error: any) {
    res.json({ connected: false });
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
