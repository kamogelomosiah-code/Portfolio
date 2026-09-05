import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from "@google/genai";

const router = express.Router();
const NOTES_FILE_PATH = path.join(process.cwd(), 'planner_notes.json');

// Get all saved notes from JSON file
router.get('/notes', (req, res) => {
  try {
    if (!fs.existsSync(NOTES_FILE_PATH)) {
      fs.writeFileSync(NOTES_FILE_PATH, JSON.stringify({}, null, 2));
      return res.json({});
    }
    const data = fs.readFileSync(NOTES_FILE_PATH, 'utf-8');
    const notes = JSON.parse(data || '{}');
    return res.json(notes);
  } catch (error: any) {
    console.error('Error reading planner_notes.json:', error);
    return res.status(500).json({ error: 'Failed to read notes file' });
  }
});

// Save/Update notes to JSON file
router.post('/notes', (req, res) => {
  try {
    const notes = req.body || {};
    fs.writeFileSync(NOTES_FILE_PATH, JSON.stringify(notes, null, 2));
    return res.json({ success: true, notes });
  } catch (error: any) {
    console.error('Error writing to planner_notes.json:', error);
    return res.status(500).json({ error: 'Failed to save notes file' });
  }
});

// In-memory database for preview purposes
interface Reminder {
  id: string;
  email: string;
  send_date: string;
  message: string;
  sent: boolean;
}
const DB_REMINDERS: Reminder[] = [];

// Nodemailer setup
async function sendReminderEmail(to: string, message: string) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  if (host && user && pass) {
    const transporter = nodemailer.createTransport({
      host, port, secure: port === 465, auth: { user, pass }
    });
    await transporter.sendMail({
      from: `"Kamo's AI Coach" <${user}>`,
      to,
      subject: "📅 Your Action Plan Reminder",
      html: `<div style="font-family: sans-serif; padding: 20px;">
        <h2>Action Plan Reminder</h2>
        <p>${message}</p>
      </div>`
    });
  } else {
    console.log(`[SIMULATED EMAIL to ${to}]: ${message}`);
  }
}

// CRON JOB: Runs every day at 08:00 AM to send reminders for the current date
cron.schedule('0 8 * * *', async () => {
  const today = new Date().toISOString().split('T')[0];
  console.log(`[CRON] Scanning for reminders to send on ${today}...`);
  
  for (const reminder of DB_REMINDERS) {
    if (!reminder.sent && reminder.send_date === today) {
      console.log(`[CRON] Sending reminder to ${reminder.email}: ${reminder.message}`);
      await sendReminderEmail(reminder.email, reminder.message);
      reminder.sent = true;
    }
  }
});

const SYSTEM_PROMPT = `
You are an expert Full-Stack Developer & Goal Planner. 
Your task is to take a user's prompt (which might contain one or multiple goals) and break it down into a logical chronological timeline.
You should also look at their 'Existing Goals' (if any) to help them plan more effectively and avoid overloading specific days.
For each goal, recommend a "path of least resistance" to ensure the goal is met efficiently.
You MUST output a strict JSON object with this EXACT structure (assign realistic YYYY-MM-DD dates for each step, ending at main_deadline).

{
  "goals": [
    {
      "goal_title": "Short title",
      "category": "One of: Job Search, Health, Learning, Personal, Finance, Other",
      "priority": "High, Medium, or Low",
      "status": "Active",
      "main_deadline": "YYYY-MM-DD",
      "path_of_least_resistance": "A short paragraph recommending the easiest, most efficient path to achieve this goal considering existing commitments.",
      "steps": [
        {
          "step_number": 1, 
          "task": "Description", 
          "description": "Optional details",
          "scheduled_date": "YYYY-MM-DD",
          "recurrence": "none, daily, weekdays, or weekly (if it is a repeating habit)"
        }
      ],
      "reminders": [
        {
          "send_date": "YYYY-MM-DD", 
          "message": "Reminder text."
        }
      ]
    }
  ]
}
DO NOT wrap the response in markdown blocks. Output raw JSON only.
`;

router.post('/generate', async (req, res) => {
  try {
    const { prompt, email, goals } = req.body;
    
    if (email && goals && Array.isArray(goals)) {
      goals.forEach((plan: any) => {
        if (plan.reminders && Array.isArray(plan.reminders)) {
          plan.reminders.forEach((r: any) => {
            DB_REMINDERS.push({
              id: uuidv4(),
              email,
              send_date: r.send_date,
              message: r.message,
              sent: false
            });
          });
        }
      });
    }

    res.json({ success: true, message: "Client-side WebLLM plan registered successfully." });
  } catch (error: any) {
    console.error('Planner Registration Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});


router.post('/smart-add', async (req, res) => {
  try {
    const { prompt } = req.body;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    
    if (!geminiKey && !openRouterKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY or OPENROUTER_API_KEY" });
    }

    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are an intelligent calendar assistant. 
Today's date is ${today}. 
Extract the task description and the target date from the user's prompt.
Target date MUST be in YYYY-MM-DD format.
Return a strict JSON object with EXACTLY this structure:
{
  "date": "YYYY-MM-DD",
  "task": "Cleaned up task description"
}`;

    let responseText = "";

    if (geminiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 150
        }
      });
      responseText = response.text || "";
    } else {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 150
        })
      });
      if (!response.ok) throw new Error("OpenRouter smart-add failed");
      const data = await response.json();
      responseText = data.choices?.[0]?.message?.content || "";
    }
    let result;
    try {
      result = JSON.parse(responseText);
    } catch(e) {
      // fallback regex if model ignores json_object
      const dateMatch = responseText.match(/"date":\s*"(\d{4}-\d{2}-\d{2})"/);
      const taskMatch = responseText.match(/"task":\s*"([^"]+)"/);
      if (dateMatch && taskMatch) {
         result = { date: dateMatch[1], task: taskMatch[1] };
      } else {
         throw new Error("Failed to parse JSON response");
      }
    }

    if (!result.date || !result.task) {
       throw new Error("Incomplete JSON parsed");
    }

    // Now load existing notes, add it, and save.
    const NOTES_FILE_PATH = path.join(process.cwd(), 'planner_notes.json');
    let notes = {};
    if (fs.existsSync(NOTES_FILE_PATH)) {
      notes = JSON.parse(fs.readFileSync(NOTES_FILE_PATH, 'utf-8') || '{}');
    }

    if (!notes[result.date]) {
      notes[result.date] = [];
    }

    const newNote = {
      id: uuidv4(),
      text: result.task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    notes[result.date].push(newNote);
    fs.writeFileSync(NOTES_FILE_PATH, JSON.stringify(notes, null, 2));

    res.json({ success: true, date: result.date, task: result.task, notes });
  } catch (error) {
    console.error("Smart Add Error:", error);
    res.status(500).json({ error: "Failed to smartly add todo", details: error.message, stack: error.stack });
  }
});

export default router;
