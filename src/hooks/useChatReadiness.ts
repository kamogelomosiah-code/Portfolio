import { useState, useEffect, useRef, useCallback } from "react";
import { waitForServer, ServerReadinessState } from "../lib/serverReadiness";
import { API_ROUTES } from "../config/api";

// Module-level readiness flag so once ready, switching views does not re-probe
let hasServerReportedReady = false;

export function useChatReadiness() {
  const [readinessState, setReadinessState] = useState<ServerReadinessState>(
    hasServerReportedReady ? "ready" : "starting"
  );
  const [elapsedMs, setElapsedMs] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startProbe = useCallback(() => {
    if (hasServerReportedReady) {
      setReadinessState("ready");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setReadinessState("starting");
    setElapsedMs(0);
    setAttempt(0);

    waitForServer({
      endpoint: API_ROUTES.health,
      probeTimeoutMs: 5000,
      retryIntervalMs: 3000,
      maxTotalMs: 120000,
      signal: controller.signal,
      onProgress: (p) => {
        if (!controller.signal.aborted) {
          setReadinessState(p.state);
          setElapsedMs(p.elapsedMs);
          setAttempt(p.attempt);
        }
      },
    }).then((result) => {
      if (!controller.signal.aborted) {
        if (result === "ready") {
          hasServerReportedReady = true;
          setReadinessState("ready");
        } else {
          setReadinessState("failed");
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!hasServerReportedReady) {
      startProbe();
    } else {
      setReadinessState("ready");
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [startProbe]);

  const retry = useCallback(() => {
    hasServerReportedReady = false;
    startProbe();
  }, [startProbe]);

  return {
    readinessState,
    elapsedMs,
    attempt,
    retry,
    isReady: readinessState === "ready",
  };
}
