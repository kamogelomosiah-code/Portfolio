import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Menu, Send, Copy, Check, Database, Users, Hash, KeyRound, Sparkles, Webhook } from "lucide-react";

interface ApiPageProps {
  onBackToChat: () => void;
  onToggleDrawer?: () => void;
}

type Status = { configured: boolean; online: boolean; storage?: string | null } | null;
type Entry = { id: string; name: string; message: string; createdAt: string };

const SNIPPETS: Array<{ title: string; code: string }> = [
  {
    title: "1. Save data",
    code: `await fetch("https://YOUR-API/api/v1/data/guestbook", {
  method: "POST",
  headers: { "X-API-Key": KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Jo", message: "Hello!" }),
});`,
  },
  {
    title: "2. Read it back",
    code: `const res = await fetch(
  "https://YOUR-API/api/v1/data/guestbook?sort=-createdAt&limit=20",
  { headers: { "X-API-Key": KEY } }
);
const { data, pagination } = await res.json();`,
  },
  {
    title: "3. Count something",
    code: `await fetch("https://YOUR-API/api/v1/counters/visits/increment", {
  method: "POST",
  headers: { "X-API-Key": KEY, "Content-Type": "application/json" },
  body: "{}",
}); // → { "name": "visits", "value": 42 }`,
  },
];

const FEATURES = [
  { icon: Database, title: "Data CRUD", text: "Any collection: create, read, update, delete, filter, sort and page." },
  { icon: Users, title: "User accounts", text: "Sign-up and log-in for each app's users, with hashed passwords." },
  { icon: Hash, title: "Counters & settings", text: "Atomic counters and a key-value store for flags and config." },
  { icon: Webhook, title: "Webhooks", text: "Signed notifications to your app when its data changes." },
  { icon: KeyRound, title: "One key per app", text: "Each app's data is separate, with its own rate limit." },
  { icon: Sparkles, title: "AI", text: "Text generation through Hugging Face, behind the same key." },
];

function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString();
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="border-2 border-outline-variant rounded-[20px] bg-surface-container overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b-2 border-outline-variant">
        <span className="text-label-large font-medium text-on-background">{title}</span>
        <button
          onClick={async () => {
            try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
          }}
          className="flex items-center gap-1 text-label-medium text-on-surface-variant hover:text-primary bg-transparent border-0 cursor-pointer px-2 py-1 rounded-full"
          aria-label={`Copy ${title}`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="m-0 p-4 overflow-x-auto text-[12.5px] leading-relaxed font-mono text-on-background whitespace-pre">{code}</pre>
    </div>
  );
}

export default function ApiPage({ onBackToChat, onToggleDrawer }: ApiPageProps) {
  const [status, setStatus] = useState<Status>(null);
  const [visits, setVisits] = useState<number | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ name: "", message: "" });
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const loadGuestbook = async () => {
    const r = await fetch("/api/masterapi/guestbook");
    if (!r.ok) return;
    const j = await r.json();
    setEntries(j.entries || []);
    setTotal(j.total || 0);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s: Status = await (await fetch("/api/masterapi/status")).json();
        if (!alive) return;
        setStatus(s);
        if (!s?.online) return;
        // Count each visitor once per browser session.
        let counted = false;
        try { counted = sessionStorage.getItem("api-page-visit") === "1"; } catch { /* ignore */ }
        const v = await fetch(counted ? "/api/masterapi/visits" : "/api/masterapi/visit", { method: counted ? "GET" : "POST" });
        if (v.ok && alive) {
          setVisits((await v.json()).visits);
          try { sessionStorage.setItem("api-page-visit", "1"); } catch { /* ignore */ }
        }
        if (alive) await loadGuestbook();
      } catch {
        if (alive) setStatus({ configured: false, online: false });
      }
    })();
    return () => { alive = false; };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setNote(null);
    try {
      const r = await fetch("/api/masterapi/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Something went wrong.");
      setForm({ name: "", message: "" });
      setNote({ ok: true, text: "Saved to MasterAPI. You're on the list below." });
      await loadGuestbook();
    } catch (err: any) {
      setNote({ ok: false, text: err.message });
    } finally {
      setSending(false);
    }
  };

  const live = status?.online;
  const statusText = status === null ? "Checking…" : live ? `Online · ${status.storage === "mongodb" ? "MongoDB" : "file storage"}` : status.configured ? "Offline right now" : "Not connected on this server";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex-1 h-full w-full bg-background text-on-background flex flex-col overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-center pointer-events-none pt-[calc(env(safe-area-inset-top)+12px)] sm:pt-[calc(env(safe-area-inset-top)+20px)] px-4 sm:px-6">
        <div className="flex items-center justify-between w-full pointer-events-auto bg-surface/90 backdrop-blur-md rounded-xl shadow-md border-2 border-outline-variant/60 px-4 py-2 max-w-3xl">
          <h1 className="font-medium text-title-medium sm:text-title-large md:text-headline-small text-on-background tracking-normal font-display m-0 ml-1 py-1">My API</h1>
          <span className="flex items-center gap-2 text-label-medium text-on-surface-variant" data-testid="api-status">
            <span className={`w-2 h-2 rounded-full ${live ? "bg-emerald-500" : status === null ? "bg-zinc-400" : "bg-rose-500"}`} />
            {statusText}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pb-36 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+92px)]">
        <div className="w-full max-w-3xl flex flex-col gap-6">
          <section>
            <p className="text-body-large text-on-surface-variant leading-relaxed m-0">
              <b className="text-on-background font-semibold">MasterAPI</b> is the backend I built to power my apps: my video site, a household budget app and this portfolio.
              Each app gets one key and its own separate data. Try it below. Everything you do here is a real request to the live API.
            </p>
          </section>

          {/* Live demo */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-outline-variant rounded-[24px] p-5 bg-surface-container flex flex-col gap-1">
              <p className="text-label-medium text-on-surface-variant m-0">Visitors counted by the API</p>
              <p className="text-display-small font-semibold text-primary m-0" data-testid="api-visits">{visits ?? "—"}</p>
              <p className="text-body-small text-on-surface-variant m-0">One <code className="text-primary">POST /counters/…/increment</code> per visit.</p>
            </div>

            <form onSubmit={submit} className="md:col-span-2 border-2 border-outline-variant rounded-[24px] p-5 bg-surface-container flex flex-col gap-3" data-testid="guestbook-form">
              <div>
                <p className="text-title-medium font-medium m-0">Sign the guestbook</p>
                <p className="text-body-small text-on-surface-variant m-0">Your message is saved with <code className="text-primary">POST /data/guestbook</code>.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  maxLength={60}
                  required
                  disabled={!live}
                  className="sm:col-span-1 min-w-0 bg-surface-container-high border-2 border-outline-variant rounded-xl placeholder:text-on-surface-variant px-3 py-2.5 text-body-medium text-on-background focus:outline-none focus:border-primary"
                />
                <input
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Say hello…"
                  maxLength={500}
                  required
                  disabled={!live}
                  className="sm:col-span-2 min-w-0 bg-surface-container-high border-2 border-outline-variant rounded-xl placeholder:text-on-surface-variant px-3 py-2.5 text-body-medium text-on-background focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={!live || sending}
                  className="flex items-center gap-2 bg-primary text-on-primary rounded-full px-5 py-2.5 font-medium text-label-large border-0 cursor-pointer disabled:opacity-50 disabled:cursor-default"
                >
                  <Send size={16} /> {sending ? "Saving…" : "Save to the API"}
                </button>
                {note && <span className={`text-body-small ${note.ok ? "text-emerald-500" : "text-rose-500"}`} role="status">{note.text}</span>}
                {!live && status !== null && <span className="text-body-small text-on-surface-variant">The demo is offline right now. The code below still shows how it works.</span>}
              </div>
            </form>
          </section>

          {live && (
            <section className="border-2 border-outline-variant rounded-[24px] p-5 bg-surface-container" data-testid="guestbook-list">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-3 mb-3">
                <p className="text-title-medium font-medium m-0">Guestbook</p>
                <p className="text-body-small text-on-surface-variant m-0">{total} message{total === 1 ? "" : "s"} · <code className="text-primary">GET /data/guestbook?sort=-createdAt</code></p>
              </div>
              {entries.length ? (
                <ul className="m-0 p-0 list-none flex flex-col divide-y divide-outline-variant">
                  {entries.map((e) => (
                    <li key={e.id} className="py-3 flex flex-col gap-0.5">
                      <span className="text-body-medium text-on-background break-words">{e.message}</span>
                      <span className="text-body-small text-on-surface-variant">{e.name} · {timeAgo(e.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-medium text-on-surface-variant m-0">No messages yet. Be the first.</p>
              )}
            </section>
          )}

          {/* How to use it */}
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-title-large font-medium m-0">How to use it</h2>
              <p className="text-body-medium text-on-surface-variant m-0 mt-1">
                Create an app in the MasterAPI console to get a key, then send it as <code className="text-primary">X-API-Key</code>. Keep the key on your server.
                This page calls the portfolio's own backend, which adds the key.
              </p>
            </div>
            {SNIPPETS.map((s) => <CodeBlock key={s.title} {...s} />)}
          </section>

          {/* What it does */}
          <section className="flex flex-col gap-3">
            <h2 className="text-title-large font-medium m-0">What it does</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="border-2 border-outline-variant rounded-[20px] p-4 bg-surface-container flex gap-3">
                  <div className="p-2 bg-primary-container rounded-full text-primary shrink-0 h-fit"><Icon size={18} /></div>
                  <div>
                    <p className="text-title-small font-medium m-0">{title}</p>
                    <p className="text-body-small text-on-surface-variant m-0 mt-0.5">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-surface-container-high rounded-full shadow-xl border-2 border-outline-variant/60 px-2 py-2">
          {onToggleDrawer && (
            <button onClick={onToggleDrawer} className="md:hidden flex items-center justify-center w-12 h-12 rounded-full hover:bg-background text-on-background transition-colors cursor-pointer border-0 bg-transparent" title="Menu">
              <Menu size={24} />
            </button>
          )}
          <button onClick={onBackToChat} className="flex items-center justify-center gap-2 h-12 px-5 md:px-6 rounded-full hover:bg-background text-on-background transition-colors cursor-pointer border-0 bg-transparent" title="Back to Chat">
            <ArrowLeft size={20} />
            <span className="font-medium text-title-small">Back to Chat</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
