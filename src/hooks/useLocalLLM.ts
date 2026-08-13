import { useState, useEffect, useCallback } from "react";

export function useLocalLLM() {
  const [status, setStatus] = useState<{
    tiny_model: string;
    large_model: { status: string };
  }>({
    tiny_model: "loading",
    large_model: { status: "loading" },
  });
  const [isLargeReady, setIsLargeReady] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/ping-model", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "anthropic/claude-3.5-sonnet" }) });
        if (!res.ok) {
          setStatus({
            tiny_model: "failed",
            large_model: { status: "failed" },
          });
          setIsLargeReady(false);
          return;
        }
        const data = await res.json();
        if (data.success || data.connected) {
          setStatus({
            tiny_model: "ready",
            large_model: { status: "ready" },
          });
          setIsLargeReady(true);
        } else {
          setStatus({
            tiny_model: "unavailable",
            large_model: { status: "unavailable" },
          });
          setIsLargeReady(false);
        }
      } catch (err) {
        setStatus({
          tiny_model: "failed",
          large_model: { status: "failed" },
        });
        setIsLargeReady(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const generate = useCallback(async (text: string, { model = "tiny", history = [] }: { model?: string, history?: any[] } = {}) => {
    const messages = [...(history || []).map((m: any) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text || m.content })), { role: "user", content: text }];
    const res = await fetch("/api/openrouter/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        messages,
        options: { model: model === "large" ? "meta-llama/llama-3.3-70b-instruct" : "meta-llama/llama-3.3-70b-instruct" }
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed with status ${res.status}`);
    }

    const data = await res.json();
    return { generated: data.choices?.[0]?.message?.content || "" };
  }, []);

  return { status, generate, isLargeReady };
}
