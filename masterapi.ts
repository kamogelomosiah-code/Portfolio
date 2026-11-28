// Client for MasterAPI, the shared backend for all my apps. Used on the server only, so the app key
// never reaches the browser. Enabled when both MASTERAPI_URL and MASTERAPI_KEY are set.
//
// What this site uses it for: chat (AI), contact mail, saving the profile and admin passcode so they
// survive redeploys, plus the visit counter and guestbook on the API page.

const base = (process.env.MASTERAPI_URL || '').replace(/\/$/, '');
const key = process.env.MASTERAPI_KEY || '';
export const masterApiEnabled = Boolean(base && key);

export class MasterApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call(method: string, path: string, body?: unknown, timeoutMs = 8000): Promise<any> {
  let res: Response;
  try {
    res = await fetch(`${base}/api/v1${path}`, {
      method,
      headers: { 'x-api-key': key, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e: any) {
    throw new MasterApiError(0, e?.name === 'TimeoutError' ? 'MasterAPI did not answer in time' : 'MasterAPI is unreachable');
  }
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new MasterApiError(res.status, data.error || `MasterAPI responded ${res.status}`);
  return data;
}

const col = (name: string) => `/data/${encodeURIComponent(name)}`;

// ---- Status and wake-up ----

/** Health of the MasterAPI server (no key needed). */
export async function masterApiHealth(): Promise<{ ok: boolean; storage?: string; ai?: boolean; mail?: boolean; persistent?: boolean }> {
  if (!base) return { ok: false };
  try {
    const r = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(6000) });
    const j: any = await r.json().catch(() => ({}));
    return { ok: r.ok && j.status === 'ok', storage: j.storage, persistent: j.persistent, ai: j.services?.ai?.configured, mail: j.services?.mail?.configured };
  } catch {
    return { ok: false };
  }
}

let lastWake = 0;
/** Free hosts sleep when idle. Poking MasterAPI early (at most every 5 minutes) gets it awake before the first chat. */
export function wakeMasterApi() {
  if (!base || Date.now() - lastWake < 5 * 60_000) return;
  lastWake = Date.now();
  fetch(`${base}/api/health`, { signal: AbortSignal.timeout(70_000) }).catch(() => {});
}

// ---- AI chat ----

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Asks MasterAPI's AI service. It tries several Hugging Face models and answers within about a minute. */
export async function chat(opts: { system: string; history: ChatTurn[]; prompt: string }): Promise<{ reply: string; model: string }> {
  const r = await call('POST', '/ai/chat', { system: opts.system, history: opts.history, prompt: opts.prompt, maxTokens: 500, temperature: 0.4 }, 62_000);
  return { reply: r.reply, model: r.model };
}

// ---- Contact mail ----

export async function sendContact(f: { name: string; email: string; subject: string; message: string }): Promise<{ saved: boolean; emailed: boolean; note?: string }> {
  const r = await call('POST', '/mail/contact', f, 25_000);
  return { saved: Boolean(r.saved), emailed: Boolean(r.emailed), note: r.note };
}

// ---- Small values that must survive redeploys (profile, admin passcode) ----

export async function kvGet(name: string): Promise<any | null> {
  try {
    return (await call('GET', `/kv/${encodeURIComponent(name)}`, undefined, 15_000)).value;
  } catch (e) {
    if (e instanceof MasterApiError && e.status === 404) return null;
    throw e;
  }
}

export async function kvPut(name: string, value: unknown): Promise<void> {
  await call('PUT', `/kv/${encodeURIComponent(name)}`, { value }, 15_000);
}

// ---- Visit counter and guestbook (the "API" page) ----

export async function incrementCounter(name: string, by = 1): Promise<number> {
  const r = await call('POST', `/counters/${encodeURIComponent(name)}/increment`, { by });
  return r.value;
}

export async function getCounter(name: string): Promise<number> {
  const r = await call('GET', `/counters/${encodeURIComponent(name)}`);
  return r.value || 0;
}

export async function createDoc(collection: string, doc: Record<string, unknown>) {
  const r = await call('POST', col(collection), doc);
  return r.data;
}

export async function recentDocs(collection: string, limit = 20) {
  const r = await call('GET', `${col(collection)}?limit=${limit}&sort=-createdAt`);
  return { data: r.data as any[], total: r.pagination?.total ?? 0 };
}
