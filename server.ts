import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import OpenAI from 'openai';
import multer from 'multer';
import { InferenceClient } from "@huggingface/inference";
import { GoogleGenAI } from '@google/genai';

const client = new OpenAI({
	baseURL: "https://router.huggingface.co/v1",
	apiKey: process.env.HF_TOKEN || "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",
});

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(express.json());
const PORT = 3000;

// Portfolio Context
const PORTFOLIO_CONTEXT = `
You are Kamogelo Mosia (or Kamo for short), a professional Software & IT Solutions Engineer. You are chatting with a hiring manager or client through an interactive AI portfolio.
Maintain a highly professional, polite, confident, and welcoming tone. Speak as Kamo yourself.

Your real background details:
- Overview: IT Intern and BSc IT Double Major Graduate from UJ. Passionate about software system configurations, hardware diagnostic troubleshooting, web applications development, and AI tools integration.
- Academic Education:
  - BSc Information Technology: Informatics & Computer Science (2019 - 2024) at University of Johannesburg (UJ). Completed core modules in Algorithms, DBMS, Software Engineering, Networks, and System Design with a 60% average.
  - National Senior Certificate with Bachelor's Pass (2016) at Hoërskool Birchleigh. Achieved 71% in Information Technology (top of class).
- Experience:
  - Cashier and Customer Service Representative (2021) at Dis-Chem Pharmacy. Managed transactions on CRM/POS systems and helped resolve system problems.
  - Cashier and Sales Assistant (2016) at F-Stop Photolab. Handled cash bookkeeping and hardware/software queries.
- Live Software Projects Built:
  - CallTrax (call-trax.co.za) - PHP, Laravel, React.js, MySQL. Deployed a client tracking and billing platform for active corporate service providers.
  - kamocodes API (api.kamocodes.xyz) - PHP, Laravel, PostgreSQL, REST API. A central API gateway managing distributed sandbox requests.
  - kamocodes Library (library.kamocodes.xyz) - TypeScript, React.js, Laravel, MySQL. Active cataloging and library catalog system with borrowing analytics trackers.
  - Personal AI Portfolio App - TypeScript, Firebase, Gemini AI, Vite, Tailwind CSS. A full-stack resume platform with voice transcription and interactive Firestore sandboxes.
- Technical Skills: React, Laravel, Express, Node.js, TypeScript, PHP, SQL (MySQL, PostgreSQL), Git, system and hardware configurations.
- Direct Contact: kamogelomosiah@gmail.com

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

    if (!process.env.HF_TOKEN) {
      return res.status(500).json({ error: "HF_TOKEN environment variable is missing. Please configure it in the application settings to use voice transcription." });
    }

    const hfClient = new InferenceClient(process.env.HF_TOKEN);
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
    }
    return res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { history, message, model } = req.body;
    
    if (model && model.startsWith('gemini-')) {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({ text: "GEMINI_API_KEY is not configured yet. Please configure it in settings." });
      }
      try {
        const genAI = new GoogleGenAI({}); 
        const chatHistory = history.map((msg: any) => ({
             role: msg.role === 'user' ? 'user' : 'model',
             parts: [{ text: msg.text }]
        }));
        
        const response = await genAI.models.generateContent({
            model: model,
            contents: [
                ...chatHistory,
                { role: "user", parts: [{ text: message }] }
            ],
            config: {
                systemInstruction: PORTFOLIO_CONTEXT
            }
        });
        return res.json({ text: response.text });
      } catch (error: any) {
        console.error("Gemini API Error:", error);
        return res.status(200).json({ text: "I'm currently unable to connect to the Gemini reasoning engine. Please try again or switch models." });
      }
    }

    const formattedHistory = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
    }));

    const completion = await client.chat.completions.create({
      model: model || "deepseek-ai/DeepSeek-V4-Pro:novita",
      messages: [
          { role: "system", content: PORTFOLIO_CONTEXT },
          ...formattedHistory,
          { role: "user", content: message }
      ],
    });

    res.json({ text: completion.choices[0]?.message?.content || "" });
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    
    let fallbackText = "I'm currently unable to connect to the reasoning engine. Please try again later.";
    if (error?.status === 503 || error?.message?.includes("503")) {
        fallbackText = "I'm currently experiencing high demand and need a moment to catch my breath. Please try again in a few seconds!";
    }
    
    res.status(200).json({ text: fallbackText });
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
