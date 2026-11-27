/**
 * Browser AI — a small language model that runs entirely on the visitor's
 * device using WebLLM (WebGPU). No server, no API key, nothing leaves the
 * browser. The model (~400 MB) is downloaded once and cached by the browser.
 *
 * The module is loaded lazily, so visitors who never enable it don't pay
 * for the download or the extra JavaScript.
 */
import { useEffect, useState } from "react";
import type { MLCEngineInterface, InitProgressReport } from "@mlc-ai/web-llm";
import meData from "../../me.json";

export const BROWSER_AI_MODEL = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
const ENABLED_KEY = "browser_ai_enabled";

export type BrowserAIStatus = "idle" | "unsupported" | "loading" | "ready" | "error";

export interface BrowserAIState {
  status: BrowserAIStatus;
  /** 0..1 download / compile progress while loading */
  progress: number;
  message: string;
}

let state: BrowserAIState = {
  status: isBrowserAISupported() ? "idle" : "unsupported",
  progress: 0,
  message: "",
};
let engine: MLCEngineInterface | null = null;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<(s: BrowserAIState) => void>();

function setState(patch: Partial<BrowserAIState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

export function isBrowserAISupported(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export function getBrowserAIState(): BrowserAIState {
  return state;
}

export function isBrowserAIReady(): boolean {
  return state.status === "ready" && engine !== null;
}

function rememberEnabled(on: boolean) {
  try {
    if (on) localStorage.setItem(ENABLED_KEY, "1");
    else localStorage.removeItem(ENABLED_KEY);
  } catch {
    /* storage unavailable — ignore */
  }
}

export function wasBrowserAIEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Turns a technical load error into a sentence a visitor can act on. */
export function explainLoadError(err: any): string {
  const m = String(err?.message || err || "");
  if (/WebGPU|gpu|adapter/i.test(m)) return "Your browser can't use the graphics card for AI. Try a recent Chrome or Edge.";
  if (/Failed to fetch|NetworkError|network|ERR_/i.test(m)) return "Couldn't download the AI model. Check your connection and try again.";
  if (/memory|out of memory|allocation/i.test(m)) return "Not enough memory on this device for the AI model. The chat still works without it.";
  return "The AI model couldn't start. The chat still works without it.";
}

/** Download (first time) and start the in-browser model. Safe to call repeatedly. */
export function loadBrowserAI(): Promise<void> {
  if (engine) return Promise.resolve();
  if (loadPromise) return loadPromise;
  if (!isBrowserAISupported()) {
    setState({ status: "unsupported", message: "This browser doesn't support WebGPU." });
    return Promise.reject(new Error("WebGPU not supported"));
  }

  setState({ status: "loading", progress: 0, message: "Preparing model…" });
  loadPromise = (async () => {
    try {
      const webllm = await import("@mlc-ai/web-llm");
      engine = await webllm.CreateMLCEngine(BROWSER_AI_MODEL, {
        initProgressCallback: (r: InitProgressReport) =>
          setState({ status: "loading", progress: r.progress, message: r.text }),
      });
      rememberEnabled(true);
      setState({ status: "ready", progress: 1, message: "Running on your device" });
    } catch (err: any) {
      engine = null;
      loadPromise = null;
      rememberEnabled(false);
      setState({ status: "error", message: explainLoadError(err) });
      throw err;
    }
  })();
  return loadPromise;
}

/** Stop the model and free GPU memory. */
export async function unloadBrowserAI(): Promise<void> {
  rememberEnabled(false);
  const e = engine;
  engine = null;
  loadPromise = null;
  setState({ status: isBrowserAISupported() ? "idle" : "unsupported", progress: 0, message: "" });
  if (e) await e.unload().catch(() => {});
}

export interface AskBrowserAIOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

/** Single-turn completion with the in-browser model. Throws if not ready. */
export async function askBrowserAI(prompt: string, opts: AskBrowserAIOptions = {}): Promise<string> {
  if (!engine) throw new Error("Browser AI is not loaded");
  const res = await engine.chat.completions.create({
    messages: [
      { role: "system", content: opts.system ?? PORTFOLIO_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    max_tokens: opts.maxTokens ?? 400,
    temperature: opts.temperature ?? 0.3,
  });
  const text = res.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("Empty reply from browser AI");
  return text.trim();
}

/** System prompt grounded in me.json so the small model doesn't invent facts. */
export const PORTFOLIO_SYSTEM_PROMPT = [
  `You are Kamo's GPT, a friendly assistant on the portfolio website of ${meData.name} ("${meData.nickname}").`,
  "Answer questions about him using ONLY the profile below. If the answer isn't there, say you don't know and suggest using the contact page.",
  "Keep answers short (under 150 words), clear and professional. Use Markdown lists where helpful.",
  "",
  "PROFILE (JSON):",
  JSON.stringify(meData),
].join("\n");

/** React hook: live Browser AI state. */
export function useBrowserAI(): BrowserAIState {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    setS(state);
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return s;
}

// Visitors who turned it on before get it back automatically (served from cache).
if (typeof window !== "undefined" && isBrowserAISupported() && wasBrowserAIEnabled()) {
  setTimeout(() => {
    loadBrowserAI().catch(() => {});
  }, 1500);
}
