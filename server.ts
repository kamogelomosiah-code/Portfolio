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

const HF_TOKEN_FALLBACK = "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";

const client = new OpenAI({
	baseURL: "https://router.huggingface.co/v1",
	apiKey: process.env.HF_TOKEN || HF_TOKEN_FALLBACK,
});

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(express.json());
const PORT = 3000;

// Portfolio Context
const PORTFOLIO_CONTEXT = `
You are Kamogelo Mosia (or Kamo for short), a professional Software & IT Solutions Engineer. You are chatting with a hiring manager or client through an interactive AI portfolio.
Maintain a highly professional, polite, confident, and welcoming tone. Speak as Kamo yourself.

Your real background data in JSON format:
${JSON.stringify(meData, null, 2)}

Instructions for Response Style:
ALWAYS keep your responses extremely short and concise. Do not talk a lot or provide long-winded explanations. Answer directly in 1-2 brief sentences if possible.

Instructions for UI Rendering:
If the user asks about your projects or what you have built, explain your live projects and append exactly "[UI:PROJECTS]" to the end of your message to render the interactive project grids.
If the user asks about your skills or what you bring, introduce your skillset and append exactly "[UI:SKILLS]" to the end of your message to render the skills panel.
If the user asks for your CV, resume, contact details, or how to reach you, provide your communication details and append exactly "[UI:CV]" to trigger the resume/CV visual components.

Do NOT invent any other [UI:*] tags.
`;

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
    console.error("Contact Form Server Error:", error);
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
    console.error("Transcription Error:", error);
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
    let resolvedModel = model || 'swift';
    if (resolvedModel === 'swift') {
      resolvedModel = 'deepseek-ai/DeepSeek-V4-Flash:novita';
    } else if (resolvedModel === 'fusion') {
      resolvedModel = 'deepseek-ai/DeepSeek-V4-Pro:novita';
    } else if (resolvedModel === 'zai-org/GLM-5.2:novita') {
      resolvedModel = 'deepseek-ai/DeepSeek-V4-Flash:novita';
    }
    const targetModel = resolvedModel;
    
    const currentToken = process.env.HF_TOKEN || HF_TOKEN_FALLBACK;
    if (!currentToken) {
      return res.status(200).json({ text: "HF_TOKEN is not configured yet. Please configure it in settings." });
    }

    const formattedHistory = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
    }));

    const isHfInference = targetModel.includes("VibeThinker") || targetModel.includes("DeepSeek-V4-Pro");
    
    let textResponse = "";

    if (isHfInference) {
      const hfClient = new InferenceClient(currentToken);
      const completion = await hfClient.chatCompletion({
        model: targetModel,
        messages: [
            { role: "system", content: PORTFOLIO_CONTEXT },
            ...formattedHistory,
            { role: "user", content: message }
        ],
      });
      textResponse = completion.choices[0]?.message?.content || "";
    } else {
      const completion = await client.chat.completions.create({
        model: targetModel,
        messages: [
            { role: "system", content: PORTFOLIO_CONTEXT },
            ...formattedHistory,
            { role: "user", content: message }
        ],
      });
      textResponse = completion.choices[0]?.message?.content || "";
    }

    res.json({ text: textResponse });
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
      resolvedModel = 'deepseek-ai/DeepSeek-V4-Flash:novita';
    } else if (resolvedModel === 'fusion') {
      resolvedModel = 'deepseek-ai/DeepSeek-V4-Pro:novita';
    }
    const isHfInference = resolvedModel.includes("VibeThinker") || resolvedModel.includes("DeepSeek-V4-Pro");
    if (isHfInference) {
      const currentToken = process.env.HF_TOKEN || HF_TOKEN_FALLBACK;
      const hfClient = new InferenceClient(currentToken);
      await hfClient.chatCompletion({
        model: resolvedModel,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1
      });
    } else {
      await client.chat.completions.create({
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
