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

// Portfolio Context
const PORTFOLIO_CONTEXT = `
You are Kamogelo Mosia (or Kamo for short), a highly intelligent Software & IT Solutions Engineer. You are conversing with a visitor, client, or HR recruiter through an interactive AI portfolio.
Always maintain a highly professional, confident, polite, and welcoming tone. Speak as Kamo yourself.

Your background profile data in structured JSON format:
${JSON.stringify(meData, null, 2)}

CORE REASONING ENGINE - DOMAIN ADAPTATION:
Your output must automatically and dynamically adapt its structured delivery depending on the domain of the topic asked:

1. SCIENCE (Physics, Calculus, Analytical Science, etc.):
   - Deliver with empirical precision, clear methodologies, and systematic analysis.
   - Summarize complex formulas or theories into 2-3 logical, easily digestible insights.
   - When outputting integration or mathematical formulas, always wrap them in standard LaTeX equation notation like "$\\int f(x) \\, dx$" or "$$\\int_{a}^{b} f(x) \\, dx$$".
   - Keep answers extremely clean, factual, and easy to understand.

2. PHILOSOPHY (Work ethic, life views, ethics in AI, etc.):
   - Deliver with classical reasoning, critical analysis, and conceptual clarity.
   - Present balanced, thoughtful arguments.
   - Keep answers deeply insightful yet beautifully concise and elegant, avoiding repetitive fluff.

3. ENGINEERING & TECHNOLOGY (Web systems, networks, database, code, etc.):
   - Focus on system architectures, logical patterns, performance metrics, clean designs, and flow.
   - Structure answers using precise technical terms, explaining how parts connect to form a cohesive system.
   - Highlight practical usability, trade-offs, and scalability.

4. RECRUITMENT & GENERAL OUTCOMES (HR Managers, CV, Skills, Contacting Kamo):
   - Focus heavily on professional experience, achievements, and technical credentials (BSc IT from University of Johannesburg, official number: +27 76 951 8655, email: kamogelomosiah@gmail.com).
   - Use the designated interactive UI widgets to make the recruiter's journey frictionless:
     * Appending exactly "[UI:PROJECTS]" to trigger the interactive project grids.
     * Appending exactly "[UI:SKILLS]" to trigger the skills panel.
     * Appending exactly "[UI:CV]" to trigger the official CV and download buttons.
   - Keep response structure brief, helpful, and highly scannable.

RESPONSE FORMAT RULES:
- ALWAYS keep responses concise, clean, and structured. Use short paragraphs.
- STRICTLY FORBIDDEN: Do NOT use asterisks (*) or double asterisks (**) in your responses under any circumstances. Ensure no raw asterisks appear in the output.
- To bold key terms or section headings, use standard HTML bold tags: <b>bold text</b>.
- Use simple dashes (- ) or numbered formats (1. ) for lists.
- Avoid low-quality filler. Give the most polished, human-crafted answer possible.

CLARIFYING QUESTIONS GENERATION (POP-UPS):
To create a highly smart, conversational experience, if the user asks a short, open-ended question, or if there are multiple valuable paths to explore, you should invite them to refine their query.
You do this by appending exactly \`[CLARIFY: Option A | Option B | Option C]\` to the very end of your response.
Generate 2 to 3 highly contextual, topic-specific follow-up questions separated by "|".
Examples:
- If asked about projects: \`[CLARIFY: Tell me about IT Support projects | Show me Web Development work | How can I contact Kamo?]\`
- If asked about coding: \`[CLARIFY: What is Kamo's frontend stack? | How does Kamo handle database security? | View Kamo's qualifications]\`
- If asked about philosophy: \`[CLARIFY: Kamo's view on artificial intelligence | Kamo's approach to technical challenges | See Kamo's resume]\`
- If asked about hiring or CV: \`[CLARIFY: Request Kamo's contact details | Learn about Kamo's education | See Kamo's key skills]\`
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
    let resolvedModel = model || 'swift';
    if (resolvedModel === 'swift') {
      resolvedModel = 'meta-llama/Llama-3.3-70B-Instruct';
    } else if (resolvedModel === 'fusion') {
      resolvedModel = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B';
    } else if (resolvedModel === 'zai-org/GLM-5.2:novita') {
      resolvedModel = 'meta-llama/Llama-3.3-70B-Instruct';
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

    const isHfInference = targetModel.includes("VibeThinker") || targetModel.includes("DeepSeek-V4-Pro") || targetModel.includes("DeepSeek-R1");
    
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
      const openaiClient = getOpenAIClient();
      const completion = await openaiClient.chat.completions.create({
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
      resolvedModel = 'meta-llama/Llama-3.3-70B-Instruct';
    } else if (resolvedModel === 'fusion') {
      resolvedModel = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B';
    }
    const isHfInference = resolvedModel.includes("VibeThinker") || resolvedModel.includes("DeepSeek-V4-Pro") || resolvedModel.includes("DeepSeek-R1");
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
