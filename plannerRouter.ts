import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk';
import nodemailer from 'nodemailer';
import cron from 'node-cron';

const router = express.Router();

let groqClient: Groq | null = null;
function getGroqClient() {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

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
      "main_deadline": "YYYY-MM-DD",
      "path_of_least_resistance": "A short paragraph recommending the easiest, most efficient path to achieve this goal considering existing commitments.",
      "steps": [
        {
          "step_number": 1, 
          "task": "Description", 
          "scheduled_date": "YYYY-MM-DD"
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
    const { prompt, email, existingGoals } = req.body;
    
    if (!prompt || !email) {
      return res.status(400).json({ success: false, error: 'Prompt and email are required.' });
    }

    const groq = getGroqClient();
    if (!groq) {
      return res.status(500).json({ success: false, error: 'Groq API Key not configured.' });
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    const userMessage = `Current Date: ${currentDate}\nUser Prompt: ${prompt}\nExisting Goals Summary: ${existingGoals ? JSON.stringify(existingGoals) : 'None'}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const reply = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(reply);
    
    // Process and add IDs
    const newGoals = (parsed.goals || []).map((g: any) => ({
      ...g,
      id: uuidv4(),
      steps: (g.steps || []).map((s: any) => ({ ...s, id: uuidv4() }))
    }));

    // Store reminders in our DB
    newGoals.forEach((plan: any) => {
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

    res.json({ success: true, goals: newGoals });
  } catch (error: any) {
    console.error('Planner Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
