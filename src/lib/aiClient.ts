import { API_BASE_URL, COLD_START_TIMEOUT_MS } from "../config/api";

export interface AskAIOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Send a single-turn message to the Render backend and return the reply string.
 * Throws on non-2xx responses, malformed payloads, or timeout.
 */
export async function askAI(message: string, opts: AskAIOptions = {}): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? COLD_START_TIMEOUT_MS
  );

  const signal = opts.signal
    ? anySignal([controller.signal, opts.signal])
    : controller.signal;

  try {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`AI backend error ${res.status}: ${errText.slice(0, 160)}`);
    }

    const data = await res.json();
    if (typeof data?.reply !== "string") {
      throw new Error("Malformed AI response: missing 'reply' string");
    }
    return data.reply;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Minimal polyfill for AbortSignal.any() so we can compose the internal
 * timeout signal with an externally supplied one.
 */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    s.addEventListener("abort", () => controller.abort(s.reason), { once: true });
  }
  return controller.signal;
}

/**
 * Extract the first JSON object from a raw model reply.
 * Handles: bare JSON, ```json fences, and prose-wrapped JSON.
 * Returns null if no valid JSON object is found.
 */
export function extractJson<T = unknown>(raw: string): T | null {
  if (!raw) return null;

  const stripped = raw
    .replace(/```(?:json)?\s*([\s\S]*?)```/gi, "$1")
    .trim();

  try {
    return JSON.parse(stripped) as T;
  } catch {
    // Fall through to brace-scan
  }

  const start = stripped.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < stripped.length; i++) {
    if (stripped[i] === "{") depth++;
    else if (stripped[i] === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(stripped.slice(start, i + 1)) as T;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
