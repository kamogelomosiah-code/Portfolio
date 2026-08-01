import * as webllm from "@mlc-ai/web-llm";

let engine: webllm.MLCEngine | null = null;

export async function initAI(onProgress?: (progress: webllm.InitProgressReport) => void) {
  if (engine) return engine;

  engine = new webllm.MLCEngine({
    appConfig: {
      model_list: webllm.prebuiltAppConfig.model_list,
      cacheBackend: "indexeddb"
    },
    initProgressCallback: (progress) => {
      console.log("[WebLLM Init Progress]:", progress.text);
      if (onProgress) onProgress(progress);
    }
  });

  // Load lightweight 4-bit Llama-3.2 1B Instruct model locally in the browser
  await engine.reload("Llama-3.2-1B-Instruct-q4f32_1-MLC");
  return engine;
}

export interface GeneratedPlanDay {
  day: number;
  title: string;
  tasks: string[];
}

export interface GeneratedPlanResponse {
  title: string;
  description?: string;
  estimatedDays?: number;
  days: GeneratedPlanDay[];
}

export async function createPlan(goal: string, onProgress?: (status: string) => void): Promise<GeneratedPlanResponse> {
  if (onProgress) onProgress("Initializing local WebLLM model...");

  let activeEngine: webllm.MLCEngine;
  try {
    activeEngine = await initAI((progress) => {
      if (onProgress) {
        const percent = Math.round((progress.progress || 0) * 100);
        onProgress(`Loading local AI model: ${percent > 0 ? percent + '%' : progress.text || 'Preparing...'}`);
      }
    });
  } catch (err: any) {
    console.error("WebLLM init error:", err);
    throw new Error(`Could not initialize local WebLLM AI model: ${err?.message || err}`);
  }

  if (onProgress) onProgress("AI is crafting your step-by-step action plan...");

  const response = await activeEngine.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are an expert productivity coach.
Break goals into realistic daily tasks.

Rules:
Keep tasks under 60 minutes.
Never create impossible schedules.
Spread work evenly.
Output JSON only.

Return format:
{
"title": "",
"description": "",
"estimatedDays": 0,
"days": [
  {
    "day": 1,
    "title": "",
    "tasks": []
  }
]
}`
      },
      {
        role: "user",
        content: goal
      }
    ],
    temperature: 0.2
  });

  const content = response.choices[0]?.message?.content || "{}";
  
  // Clean markdown backticks if present
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Could not parse AI response into structured plan JSON.");
  }
}
