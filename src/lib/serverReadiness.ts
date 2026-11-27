import { API_ROUTES } from "../config/api";

export type ServerReadinessState = "starting" | "waking" | "ready" | "failed";

export interface ReadinessProgress {
  state: "waking" | "ready" | "failed";
  attempt: number;
  elapsedMs: number;
}

export interface WaitForServerOptions {
  endpoint?: string;
  probeTimeoutMs?: number;
  retryIntervalMs?: number;
  maxTotalMs?: number;
  signal?: AbortSignal;
  onProgress?: (progress: ReadinessProgress) => void;
}

/**
 * Polls the health endpoint until the server is awake and responsive.
 * Resolves to 'ready' on 2xx status, or 'failed' if maxTotalMs is reached without success.
 * Never throws for a normal "not awake" result.
 */
export async function waitForServer(options: WaitForServerOptions = {}): Promise<"ready" | "failed"> {
  const {
    endpoint = API_ROUTES.health,
    probeTimeoutMs = 5000,
    retryIntervalMs = 3000,
    maxTotalMs = 120000,
    signal,
    onProgress,
  } = options;

  const startTime = Date.now();
  let attempt = 0;

  while (true) {
    if (signal?.aborted) {
      return "failed";
    }

    attempt += 1;
    const elapsedMs = Date.now() - startTime;

    if (elapsedMs >= maxTotalMs) {
      onProgress?.({ state: "failed", attempt, elapsedMs });
      return "failed";
    }

    onProgress?.({ state: "waking", attempt, elapsedMs });

    let isSuccess = false;
    const probeController = new AbortController();
    const probeTimeout = setTimeout(() => {
      try {
        probeController.abort();
      } catch {}
    }, probeTimeoutMs);

    const onAbort = () => {
      try {
        probeController.abort();
      } catch {}
    };
    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }

    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: probeController.signal,
      });

      if (res.ok) {
        isSuccess = true;
      }
    } catch {
      // Failed or timed out probe means not awake yet; not an error
      isSuccess = false;
    } finally {
      clearTimeout(probeTimeout);
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    }

    const currentElapsed = Date.now() - startTime;

    if (isSuccess) {
      onProgress?.({ state: "ready", attempt, elapsedMs: currentElapsed });
      return "ready";
    }

    if (currentElapsed + retryIntervalMs >= maxTotalMs) {
      onProgress?.({ state: "failed", attempt, elapsedMs: currentElapsed });
      return "failed";
    }

    // Wait for the retry interval before next probe
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, retryIntervalMs);
        if (signal) {
          signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(new Error("aborted"));
            },
            { once: true }
          );
        }
      });
    } catch {
      return "failed";
    }
  }
}
