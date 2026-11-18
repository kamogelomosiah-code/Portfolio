import { MaterialIcon } from "./MaterialIcon";
import { useBrowserAI, loadBrowserAI, unloadBrowserAI } from "../lib/browserAI";

/**
 * Small pill that lets the visitor download and run the AI model in their
 * own browser. Shows progress while loading and lets them switch it off.
 */
export default function BrowserAIToggle({ compact = false }: { compact?: boolean }) {
  const ai = useBrowserAI();

  if (ai.status === "unsupported") {
    return compact ? null : (
      <span
        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] text-on-surface-variant border border-outline-variant/50"
        title="Your browser doesn't support WebGPU, so the on-device AI can't run here. Chat still works."
      >
        <MaterialIcon name="memory" className="text-sm" />
        Browser AI unavailable
      </span>
    );
  }

  if (ai.status === "loading") {
    const pct = Math.round(ai.progress * 100);
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-primary bg-primary/10 border border-primary/30"
        title={ai.message}
        aria-live="polite"
      >
        <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        {compact ? `${pct}%` : `Loading browser AI ${pct}%`}
      </span>
    );
  }

  if (ai.status === "ready") {
    return (
      <button
        type="button"
        onClick={() => unloadBrowserAI()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 transition-colors cursor-pointer"
        title="AI is running privately on your device. Click to turn it off."
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        {compact ? "On-device" : "Browser AI on"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        loadBrowserAI().catch(() => {});
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-on-surface bg-surface-container-high border border-outline-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
      title={
        ai.status === "error"
          ? `Couldn't start: ${ai.message}. Click to retry.`
          : "Download a small AI model (~400 MB, once) and run it privately in your browser."
      }
    >
      <MaterialIcon name={ai.status === "error" ? "error" : "memory"} className="text-sm" />
      {ai.status === "error" ? "Retry browser AI" : compact ? "Browser AI" : "Run AI in browser"}
    </button>
  );
}
