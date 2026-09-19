import { askAI, extractJson } from "./aiClient";

export interface SmartAddResult {
  /** Canonical ISO date, YYYY-MM-DD */
  date: string;
  /** Cleaned-up task description, ready to store as a note */
  task: string;
}

function localFallbackSmartAdd(prompt: string): SmartAddResult {
  const text = prompt.trim();
  const lower = text.toLowerCase();
  const now = new Date();

  let targetDate = new Date(now);
  let cleanedTask = text;

  // Check for ISO date format in prompt (YYYY-MM-DD)
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    targetDate = new Date(isoMatch[1]);
    cleanedTask = text.replace(isoMatch[0], "").trim();
  } else if (lower.includes("tomorrow")) {
    targetDate.setDate(targetDate.getDate() + 1);
    cleanedTask = text.replace(/tomorrow/i, "").trim();
  } else if (lower.includes("next week")) {
    targetDate.setDate(targetDate.getDate() + 7);
    cleanedTask = text.replace(/next week/i, "").trim();
  } else {
    // Check "in X days"
    const inDaysMatch = lower.match(/in\s+(\d+)\s+days?/i);
    if (inDaysMatch) {
      targetDate.setDate(targetDate.getDate() + parseInt(inDaysMatch[1], 10));
      cleanedTask = text.replace(inDaysMatch[0], "").trim();
    } else {
      // Days of week
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      for (let i = 0; i < days.length; i++) {
        const dayName = days[i];
        if (lower.includes(dayName)) {
          const currentDay = now.getDay();
          let diff = i - currentDay;
          if (diff <= 0) diff += 7;
          targetDate.setDate(targetDate.getDate() + diff);
          cleanedTask = text.replace(new RegExp(`(next\\s+)?(on\\s+)?${dayName}`, "i"), "").trim();
          break;
        }
      }
    }
  }

  // Clean leading/trailing noise
  cleanedTask = cleanedTask
    .replace(/^(remind me to|please|i need to|schedule|add|task:?)\s+/i, "")
    .replace(/\s+(on|at|by|for)\s*$/i, "")
    .trim();

  if (!cleanedTask) cleanedTask = text;

  const dateStr = targetDate.toISOString().split("T")[0];
  return { date: dateStr, task: cleanedTask };
}

/**
 * Ask the Render backend to parse a natural-language prompt into
 * { date, task } for the calendar planner.
 *
 * The backend contract is a plain chat completion, so we embed the
 * output schema directly in the prompt and parse JSON out of the reply.
 */
export async function smartAdd(prompt: string): Promise<SmartAddResult> {
  const trimmed = prompt.trim();
  if (!trimmed) throw new Error("Empty prompt");

  const today = new Date().toISOString().split("T")[0];

  const instruction = `You are a strict calendar parser. Today's date is ${today}.

Task: Extract the TASK DESCRIPTION and the TARGET DATE from the user's request.

Rules:
- The target date MUST be a real calendar date in YYYY-MM-DD format.
- If no date is mentioned, use today: ${today}.
- If a relative date is mentioned ("tomorrow", "next Tuesday", "in 3 days", "next week"), compute it from today.
- The task description should be short, imperative, and cleaned up (e.g. "Call John", "Buy milk", "Submit PRDP application").

Output format:
Return ONLY a single JSON object. No markdown fences. No prose. No explanation.
Exact shape: {"date":"YYYY-MM-DD","task":"short cleaned-up description"}

User request:
"""${trimmed}"""`;

  try {
    const reply = await askAI(instruction, { timeoutMs: 60_000 });
    const parsed = extractJson<{ date?: string; task?: string }>(reply);

    if (parsed && typeof parsed.date === "string" && typeof parsed.task === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      const task = parsed.task.trim();
      if (task) {
        return { date: parsed.date, task };
      }
    }
  } catch (err) {
    console.warn("AI smart-add parsing error, using local fallback parser:", err);
  }

  return localFallbackSmartAdd(trimmed);
}
