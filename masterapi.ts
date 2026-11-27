// Client for MasterAPI, the shared backend. Used server-side only, so the app key never reaches the browser.
// Enabled when both MASTERAPI_URL and MASTERAPI_KEY are set.

const base = (process.env.MASTERAPI_URL || '').replace(/\/$/, '');
const key = process.env.MASTERAPI_KEY || '';
export const masterApiEnabled = Boolean(base && key);

export class MasterApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call(method: string, path: string, body?: unknown): Promise<any> {
  const res = await fetch(`${base}/api/v1${path}`, {
    method,
    headers: { 'x-api-key': key, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new MasterApiError(res.status, data.error || `MasterAPI responded ${res.status}`);
  return data;
}

const col = (name: string) => `/data/${encodeURIComponent(name)}`;

/** Health of the MasterAPI server (no key needed). */
export async function masterApiHealth(): Promise<{ ok: boolean; storage?: string }> {
  if (!base) return { ok: false };
  try {
    const r = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(6000) });
    const j: any = await r.json().catch(() => ({}));
    return { ok: r.ok && j.status === 'ok', storage: j.storage };
  } catch {
    return { ok: false };
  }
}

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
