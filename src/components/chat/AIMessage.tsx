import React, { useState, useEffect, useRef } from "react";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { Message } from "../ChatInterface";
import { AppIcon } from "../AppIcon";
import { Copy, Check, AlertCircle, RotateCw } from "lucide-react";

export function AIMessage({
  msg,
  isFirstInGroup,
  onStreamingComplete,
  renderUIBlock,
  onRetry,
  assistantName = "Kamogelo Mosia",
}: {
  msg: Message;
  isFirstInGroup: boolean;
  onStreamingComplete: (id: string) => void;
  renderUIBlock?: (uiBlock: string) => React.ReactNode;
  onRetry?: (text: string) => void;
  assistantName?: string;
}) {
  const hasAnimatedRef = useRef(false);
  const [displayedText, setDisplayedText] = useState(msg.text || "");
  const [copied, setCopied] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [localStatus, setLocalStatus] = useState<"loading" | "streaming" | "sent" | "error">(
    msg.status === "sending" || msg.status === "loading"
      ? "loading"
      : msg.status === "error"
      ? "error"
      : msg.status === "sent"
      ? "sent"
      : "streaming"
  );

  const onCompleteRef = useRef(onStreamingComplete);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  useEffect(() => {
    onCompleteRef.current = onStreamingComplete;
  }, [onStreamingComplete]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (msg.status === "loading" || msg.status === "sending") {
      setLoadingSeconds(0);
      interval = setInterval(() => {
        setLoadingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setLoadingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [msg.status]);

  useEffect(() => {
    if (msg.status === "loading" || msg.status === "sending") {
      setLocalStatus("loading");
      setDisplayedText("");
      hasAnimatedRef.current = false;
    } else if (msg.status === "error") {
      setLocalStatus("error");
      setDisplayedText(msg.text);
      hasAnimatedRef.current = true;
    } else if (msg.status === "streaming") {
      setLocalStatus("streaming");
      setDisplayedText(msg.text);
      if (!hasAnimatedRef.current) {
        hasAnimatedRef.current = true;
        onCompleteRef.current(msg.id);
      }
    } else if (msg.status === "sent") {
      setLocalStatus("sent");
      setDisplayedText(msg.text);
      hasAnimatedRef.current = true;
    }
  }, [msg.text, msg.status, msg.id]);

  return (
    <div className="flex items-start gap-3.5 w-full max-w-full scroll-mt-4" id={`msg-${msg.id}`}>
      <div className="w-7 h-7 shrink-0 mt-0.5 flex items-center justify-center">
        {isFirstInGroup ? (
          <div className="w-7 h-7 rounded-lg border border-outline-variant bg-surface flex items-center justify-center text-accent-ink">
            <AppIcon className={`w-4 h-4 ${localStatus === "loading" ? "animate-pulse" : ""}`} />
          </div>
        ) : (
          <div className="w-7 h-7" />
        )}
      </div>

      <div className="flex-1 flex flex-col items-start w-full min-w-0">
        {isFirstInGroup && (
          <span className="font-medium text-xs text-on-surface-variant mb-1">
            {assistantName}
          </span>
        )}

        <div className="text-on-background bg-transparent w-full text-left max-w-2xl min-h-[24px]">
          {localStatus === "loading" ? (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant py-1">
              <span>Thinking…</span>
              <span className="font-mono text-xs tabular-nums text-on-surface-variant/80">
                {loadingSeconds}s
              </span>
            </div>
          ) : localStatus === "error" ? (
            <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 max-w-xl my-1">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed">
                  {displayedText || "I couldn't reach the AI just now. Your message wasn't lost, so you can try again."}
                </div>
              </div>
              {(msg.meta?.failedUserText || onRetry) && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRetry?.(msg.meta?.failedUserText || "")}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 h-8 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-700 dark:text-red-300 transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {msg.meta?.isOfflineFallback && (
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md mb-2">
                  <span>Offline answer</span>
                </div>
              )}

              <div className="text-[15px] leading-relaxed">
                <MarkdownRenderer content={displayedText} isStreaming={localStatus === "streaming"} />
              </div>

              {localStatus === "sent" && (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs font-mono text-on-surface-variant hover:text-on-background px-1.5 py-1 -ml-1.5 rounded-md transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>

                  {msg.meta?.engine && (
                    <span className="text-[11px] font-mono text-on-surface-variant">
                      {msg.meta.engine}
                      {msg.meta.model ? ` · ${msg.meta.model}` : ""}
                    </span>
                  )}
                </div>
              )}

              {localStatus === "sent" && msg.uiBlock && renderUIBlock && (
                <div className="mt-3 flex flex-col gap-3 w-full max-w-2xl">
                  {renderUIBlock(msg.uiBlock)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
