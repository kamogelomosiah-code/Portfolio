import { askAI, extractJson } from "./aiClient";

export interface SmartAddResult {
  /** Canonical ISO date, YYYY-MM-DD */
  date: string;
  /** Cleaned-up task description, ready to store as a note */
  task: string;
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

  const reply = await askAI(instruction, { timeoutMs: 60_000 });
  const parsed = extractJson<{ date?: string; task?: string }>(reply);

  if (!parsed || typeof parsed.date !== "string" || typeof parsed.task !== "string") {
    throw new Error(
      "AI did not return a usable { date, task } object. Raw: " + reply.slice(0, 200)
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
    throw new Error("AI returned an invalid date format: " + parsed.date);
  }

  const task = parsed.task.trim();
  if (!task) throw new Error("AI returned an empty task");

  return { date: parsed.date, task };
}
