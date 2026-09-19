/**
 * Central configuration for the Render backend.
 * All frontend network calls to the AI service must go through here.
 */

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://kamo-portfolio-ai.onrender.com";

export const API_ROUTES = {
  chat: `${API_BASE_URL}/api/chat`,
  health: `${API_BASE_URL}/HEALTH`,
} as const;

/**
 * Render free-tier backends cold-start after ~15 min of inactivity.
 * The first request can take 30–50 s. We use a generous timeout so the
 * UI can show a "Warming up…" indicator rather than a hard failure.
 */
export const COLD_START_TIMEOUT_MS = 60_000;
