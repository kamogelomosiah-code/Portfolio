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

/** Creates or updates one document by id. */
export async function upsertDoc(collection: string, id: string, doc: Record<string, unknown>) {
  try {
    return await call('PATCH', `${col(collection)}/${encodeURIComponent(id)}`, doc);
  } catch (e) {
    if (e instanceof MasterApiError && e.status === 404) {
      return call('POST', col(collection), { ...doc, id });
    }
    throw e;
  }
}

export async function listDocs(collection: string, limit = 200) {
  const r = await call('GET', `${col(collection)}?limit=${limit}&sort=createdAt`);
  return r.data as any[];
}

export async function deleteDoc(collection: string, id: string) {
  try {
    return await call('DELETE', `${col(collection)}/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof MasterApiError && e.status === 404) return { deleted: false };
    throw e;
  }
}
