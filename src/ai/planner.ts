import { aiService, PLANNER_PROMPT } from './index';

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
  if (onProgress) onProgress("AI is crafting your step-by-step action plan...");
  
  const response = await aiService.chat(
    [
      { role: "system", content: PLANNER_PROMPT },
      { role: "user", content: goal }
    ],
    {
      temperature: 0.2,
      responseFormat: "json_object",
      onProgress
    }
  );

  const content = response || "{}";
    
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
