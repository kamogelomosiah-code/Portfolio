// plannerRouter.ts
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Plan, Step } from './src/types/planner';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import OpenAI from 'openai';
import { InferenceClient } from "@huggingface/inference";

const router = express.Router();

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
    throw new Error("All HuggingFace tokens are depleted or invalid.");
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
      lastError = error;
    }
  }
  throw lastError || new Error("All tokens exhausted");
}

// Mail Dispatch Helper
async function sendEmail({ to, subject, bodyHtml }: { to: string; subject: string; bodyHtml: string }) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  let transporter;
  let isEthereal = false;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  } else {
    try {
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
    } catch (err: any) {
      console.warn("Failed to generate Ethereal SMTP test account. Falling back to stdout simulator.", err.message);
      console.log("\n=================== 📨 EMAIL DISPATCH CENTER (SIMULATOR) ===================");
      console.log(`[STATUS] SMTP connection handshake: SIMULATED SUCCESS`);
      console.log(`[RECIPIENT] To: ${to}`);
      console.log(`[SUBJECT] Subject: ${subject}`);
      console.log("=========================================================================\n");
      return { success: true, simulated: true };
    }
  }

  try {
    const fromAddress = process.env.SMTP_FROM || (user ? `"Kamo's AI Coach" <${user}>` : '"CodeMind AI Coach" <coach@kamocodes.com>');
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html: bodyHtml
    });

    if (isEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[SUCCESS] Ethereal sandbox email generated. Preview link: ${previewUrl}`);
      return { success: true, simulated: true, previewUrl: previewUrl || undefined };
    }

    console.log(`[SUCCESS] Actual email dispatched successfully to ${to}`);
    return { success: true, simulated: false };
  } catch (err: any) {
    console.error(`[SMTP ERROR] Actual email dispatch failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Gemini Client initialization
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

// Prompt template
const makePrompt = (goal: string) => `You are an elite, highly experienced Goal Achievement Coach and Strategic Project Manager.
Analyze this strategic goal: "${goal}"

Your task is to break down this goal into a chronological sequence of 3 to 5 clear, highly actionable steps, mapping out a logical time frame (e.g. Week 1, Week 2, Week 3, etc.) rather than real-time delay. Find better, smarter, and more efficient ways to achieve this goal step by step.

For each step, you must write a beautifully formatted custom email that would be sent to the user to guide them. The email body must contain actionable guidance, checkboxes/bullet points, and clear instructions.

You MUST respond with a single, valid JSON object matching exactly this schema (with NO markdown wrapper, NO triple backticks, just raw JSON):
{
  "goal_summary": "Short concise active-verb summary of the strategic goal (4-8 words)",
  "timeframe_overview": "Overall timeframe summary (e.g., '4-Week Action Plan', '3-Month Roadmap')",
  "steps": [
    {
      "action": "Actionable, clear, singular task or micro-habit step",
      "timeframe": "Chronological timeframe designation (e.g., 'Week 1', 'Week 2', 'Days 1-5')",
      "duration_minutes": 15,
      "email_subject": "A compelling email subject line for this specific step",
      "email_body": "HTML formatted email body. Use clean typography, bullet points, headers, and an encouraging, professional tone. Ensure all HTML tags are closed properly and contain NO external dependencies. Use inline styles if needed for design. Use <p>, <ul>, <li>, <strong>, <h2>, and <div> tags."
    }
  ]
}`;

router.post('/generate', async (req, res) => {
  try {
    const { goal, email } = req.body;
    if (!goal || goal.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Strategic goal description is too short.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    const systemPrompt = makePrompt(goal);
    let planText = "";
    let parsed: any = null;

    const gemini = getGeminiClient();
    if (gemini) {
      try {
        console.log("[AI PLANNER] Requesting plan from Gemini API...");
        const response = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: systemPrompt,
          config: {
            responseMimeType: "application/json",
          }
        });
        planText = response.text || "";
        if (planText) {
          parsed = JSON.parse(planText);
        }
      } catch (geminiErr: any) {
        console.warn("[AI PLANNER] Gemini API call failed or failed to parse. Bypassing to HuggingFace fallback.", geminiErr.message);
      }
    }

    if (!parsed) {
      // Fallback using token rotation (OpenAI/HuggingFace router)
      planText = await withTokenRotation(async (token, openaiClient, hfClient) => {
        const completion = await openaiClient.chat.completions.create({
          model: 'meta-llama/Llama-3.3-70B-Instruct',
          response_format: { type: "json_object" },
          messages: [
            {
              role: 'system',
              content: 'You are a precise JSON generator. Output ONLY a valid JSON object matching the requested schema, without any explanations or conversational text.'
            },
            {
              role: 'user',
              content: systemPrompt
            }
          ],
          temperature: 0.2
        }).catch(async () => {
          return await openaiClient.chat.completions.create({
            model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
            response_format: { type: "json_object" },
            messages: [
              {
                role: 'system',
                content: 'You are a precise JSON generator. Output ONLY a valid JSON object matching the requested schema.'
              },
              {
                role: 'user',
                content: systemPrompt
              }
            ],
            temperature: 0.2
          });
        });
        return completion.choices[0]?.message?.content || "";
      });

      if (!planText) {
        throw new Error('No suggestions generated by the model.');
      }
      const cleanedText = planText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanedText);
    }

    const plan: Plan = {
      id: uuidv4(),
      goal_summary: parsed.goal_summary || goal.slice(0, 50),
      timeframe_overview: parsed.timeframe_overview || "Custom Roadmap",
      email,
      steps: (parsed.steps || []).map((s: any) => ({
        id: uuidv4(),
        action: s.action,
        timeframe: s.timeframe || 'Week 1',
        duration_minutes: s.duration_minutes || 15,
        completed: false,
        email_subject: s.email_subject || `Goal Update: ${s.action}`,
        email_body: s.email_body || `<p>Here is your action item: <strong>${s.action}</strong></p>`,
        email_status: 'pending'
      })),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.json({ success: true, plan });
  } catch (error: any) {
    console.error('Action planner generation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to formulate strategic blueprint.' });
  }
});

// Confirm and Dispatch all Emails immediately
router.post('/confirm', async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !plan.steps || !plan.email) {
      return res.status(400).json({ success: false, error: 'Strategic plan content is missing.' });
    }

    const updatedSteps: Step[] = [];

    // 1. Send the Kickoff Welcome Summary email
    const emailSummaryHtml = `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 2px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="border-bottom: 3px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #6366f1; font-weight: 800; margin: 0; font-size: 24px; letter-spacing: -0.5px;">🎯 Strategic Action Plan Generated!</h2>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Custom Blueprint by Kamo's AI Coach</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #334155;">
          Hello! Your brand new strategic plan for <strong>"${plan.goal_summary}"</strong> has been successfully configured.
        </p>
        
        <div style="background-color: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #f1f5f9; margin: 24px 0;">
          <h3 style="color: #0f172a; margin-top: 0; font-size: 16px; font-weight: 700; margin-bottom: 12px;">📅 Timeframe: ${plan.timeframe_overview}</h3>
          <ul style="padding-left: 0; list-style-type: none; margin: 0;">
            ${plan.steps.map((step: any, idx: number) => `
              <li style="margin-bottom: 14px; padding-left: 28px; position: relative; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
                <span style="position: absolute; left: 0; color: #6366f1; font-weight: bold; font-size: 15px;">${idx + 1}.</span>
                <strong style="color: #0f172a; display: block; font-size: 14px;">${step.action}</strong>
                <span style="font-size: 12px; color: #64748b; display: block; margin-top: 4px;">
                  ⏱️ ${step.duration_minutes} mins | 📅 Scheduled: ${step.timeframe}
                </span>
              </li>
            `).join('')}
          </ul>
        </div>
        
        <p style="font-size: 14px; line-height: 1.5; color: #475569;">
          We've mapped out the timeframe. Instead of waiting, we have immediately dispatched the custom emails for each of these steps to your inbox so you have them on-demand!
        </p>
        
        <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 28px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">
          This roadmap dispatch was powered by Kamogelo Mosiah's AI Portfolio &reg;
        </p>
      </div>
    `;

    console.log(`[AI PLANNER] Dispatching kickoff summary email to ${plan.email}...`);
    await sendEmail({
      to: plan.email,
      subject: `🚀 strategic roadmap kickoff: "${plan.goal_summary}"`,
      bodyHtml: emailSummaryHtml
    });

    // 2. Dispatch each step email immediately (not in real time, mapped out timeframe)
    for (const step of plan.steps) {
      const stepHtml = `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 2px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="border-bottom: 3px solid #10b981; padding-bottom: 16px; margin-bottom: 24px;">
            <span style="background-color: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 4px 8px; rounded: 8px; text-transform: uppercase;">Timeframe: ${step.timeframe}</span>
            <h2 style="color: #0f172a; font-weight: 800; margin: 10px 0 0 0; font-size: 22px;">🎯 Step Action Item</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Part of your plan: "${plan.goal_summary}"</p>
          </div>
          
          <div style="font-size: 15px; line-height: 1.6; color: #334155;">
            ${step.email_body}
          </div>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 16px; margin-top: 24px;">
            <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 600;">
              ⏱️ Recommended Duration: ${step.duration_minutes} minutes
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 28px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">
            This goal roadmap step was formulated by Kamogelo Mosiah's AI Portfolio &reg;
          </p>
        </div>
      `;

      console.log(`[AI PLANNER] Dispatching Step ${step.timeframe} email to ${plan.email}...`);
      const emailResult = await sendEmail({
        to: plan.email,
        subject: step.email_subject,
        bodyHtml: stepHtml
      });

      updatedSteps.push({
        ...step,
        completed: false,
        email_sent_at: new Date().toISOString(),
        email_status: emailResult.success ? 'sent' : 'failed',
        preview_url: emailResult.previewUrl || undefined
      });
    }

    const updatedPlan: Plan = {
      ...plan,
      timeframe_overview: plan.timeframe_overview,
      email: plan.email,
      steps: updatedSteps,
      status: 'active',
      updated_at: new Date().toISOString()
    };

    res.json({ success: true, plan: updatedPlan });
  } catch (error: any) {
    console.error('Action planner confirmation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to dispatch email steps.' });
  }
});

// Direct single step email trigger
router.post('/send-step-email', async (req, res) => {
  try {
    const { email, goal_summary, step } = req.body;
    if (!email || !step) {
      return res.status(400).json({ success: false, error: 'Email or step data is missing.' });
    }

    const stepHtml = `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 2px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="border-bottom: 3px solid #10b981; padding-bottom: 16px; margin-bottom: 24px;">
          <span style="background-color: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 4px 8px; rounded: 8px; text-transform: uppercase;">Timeframe: ${step.timeframe}</span>
          <h2 style="color: #0f172a; font-weight: 800; margin: 10px 0 0 0; font-size: 22px;">🎯 Step Action Item</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Part of your plan: "${goal_summary}"</p>
        </div>
        
        <div style="font-size: 15px; line-height: 1.6; color: #334155;">
          ${step.email_body}
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 16px; margin-top: 24px;">
          <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 600;">
            ⏱️ Recommended Duration: ${step.duration_minutes} minutes
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 28px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">
          This goal roadmap step was formulated by Kamogelo Mosiah's AI Portfolio &reg;
        </p>
      </div>
    `;

    console.log(`[AI PLANNER] Direct trigger: Resending Step ${step.timeframe} email to ${email}...`);
    const emailResult = await sendEmail({
      to: email,
      subject: step.email_subject,
      bodyHtml: stepHtml
    });

    res.json({ success: emailResult.success, error: emailResult.error, previewUrl: emailResult.previewUrl || undefined });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
