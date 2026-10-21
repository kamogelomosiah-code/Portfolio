/**
 * Central configuration for the Render backend.
 * All frontend network calls to the AI service must go through here.
 */

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

export const API_ROUTES = {
  // Always use local full-stack server routes first to avoid cross-origin aborts and sleeping server delays
  chat: "/api/chat",
  health: "/HEALTH",
  externalChat: API_BASE_URL ? `${API_BASE_URL}/api/chat` : "",
  externalHealth: API_BASE_URL ? `${API_BASE_URL}/HEALTH` : "",
} as const;

/**
 * Standard request timeout. We use 30 seconds for local API calls,
 * with explicit abort reasons and seamless local intelligence fallback.
 */
export const COLD_START_TIMEOUT_MS = 30_000;
