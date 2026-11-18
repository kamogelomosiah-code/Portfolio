import { askAI, extractJson } from "./aiClient";
import { isBrowserAIReady, askBrowserAI } from "./browserAI";

/** Local calendar date as YYYY-MM-DD (not UTC, so late-night entries land on the right day). */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface SmartAddResult {
  /** Canonical ISO date, YYYY-MM-DD */
  date: string;
  /** Cleaned-up task description, ready to store as a note */
  task: string;
}

function localFallbackSmartAdd(prompt: string): SmartAddResult & { matchedDate: boolean } {
  const text = prompt.trim();
  const lower = text.toLowerCase();
  const now = new Date();

  let targetDate = new Date(now);
  let cleanedTask = text;
  let matchedDate = true;

  // Check for ISO date format in prompt (YYYY-MM-DD)
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    const [y, m, d] = isoMatch[1].split("-").map(Number);
    targetDate = new Date(y, m - 1, d);
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
          matchedDate = true;
          break;
        }
        matchedDate = false;
      }
    }
  }

  // Clean leading/trailing noise
  cleanedTask = cleanedTask
    .replace(/^(remind me to|please|i need to|schedule|add|task:?)\s+/i, "")
    .replace(/\s+(on|at|by|for)\s*$/i, "")
    .trim();

  if (!cleanedTask) cleanedTask = text;

  const dateStr = localDateKey(targetDate);
  return { date: dateStr, task: cleanedTask, matchedDate };
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

  const now = new Date();
  const today = localDateKey(now);
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });

  const instruction = `You are a strict calendar parser. Today is ${weekday}, ${today}.

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
    // Prefer the on-device model when the visitor has it running; otherwise the server.
    const reply = isBrowserAIReady()
      ? await askBrowserAI(instruction, {
          system: "You convert requests into calendar JSON. Reply with JSON only.",
          maxTokens: 120,
          temperature: 0,
        })
      : await askAI(instruction, { timeoutMs: 60_000 });
    const parsed = extractJson<{ date?: string; task?: string }>(reply);

    if (parsed && typeof parsed.date === "string" && typeof parsed.task === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      const task = parsed.task.trim();
      if (task) {
        // Rule-based date math is exact; trust it over the model when it found a date phrase.
        const local = localFallbackSmartAdd(trimmed);
        return { date: local.matchedDate ? local.date : parsed.date, task };
      }
    }
  } catch (err) {
    console.warn("AI smart-add parsing error, using local fallback parser:", err);
  }

  const { date, task } = localFallbackSmartAdd(trimmed);
  return { date, task };
}
