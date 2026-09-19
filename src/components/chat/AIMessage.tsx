import React, { useState, useEffect, useRef } from "react";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { Message } from "../ChatInterface";
import { AppIcon } from "../AppIcon";
import { Copy, Check, AlertCircle } from "lucide-react";

export function AIMessage({
  msg,
  isFirstInGroup,
  onStreamingComplete,
  renderUIBlock
}: {
  msg: Message;
  isFirstInGroup: boolean;
  onStreamingComplete: (id: string) => void;
  renderUIBlock?: (uiBlock: string) => React.ReactNode;
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
  
  // Use a ref for the callback so it doesn't trigger re-renders
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

  // Track cold start elapsed loading seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (msg.status === "loading" || msg.status === "sending") {
      setLoadingSeconds(0);
      interval = setInterval(() => {
        setLoadingSeconds(prev => prev + 1);
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
    } else if (msg.status === "sent") {
      setLocalStatus("sent");
      setDisplayedText(msg.text);
      hasAnimatedRef.current = true;
    }
  }, [msg.text, msg.status, msg.id]);

  return (
    <div className="flex items-start gap-4 w-full max-w-full px-4 scroll-mt-4" id={`msg-${msg.id}`}>
      <div className="w-8 h-8 shrink-0 mt-1 flex items-center justify-center">
        {isFirstInGroup ? (
          <div className="card rounded-full flex items-center justify-center w-8 h-8">
            <AppIcon className={`w-4.5 h-4.5 text-primary ${localStatus === "loading" ? "animate-pulse" : ""}`} />
          </div>
        ) : (
          <div className="w-8 h-8" />
        )}
      </div>
      
      <div className="flex-1 flex flex-col items-start w-full min-w-0">
        {isFirstInGroup && (
          <span className="font-semibold text-[15px] sm:text-base text-on-surface-variant mb-1">
            Kamogelo Mosiah
          </span>
        )}
        
        <div className="text-on-background bg-transparent pb-1 w-full text-left max-w-3xl min-h-[24px]">
          {localStatus === "loading" ? (
            <div className="flex flex-col gap-1 text-on-surface-variant pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-normal italic">
                  Connecting to Kamo's AI
                </span>
                <span className="flex gap-1 items-center h-full ml-1">
                  <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
              <span className="text-xs opacity-70 font-normal">
                First request may take up to 50 seconds (Render cold start).
              </span>
            </div>
          ) : localStatus === "error" ? (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 max-w-xl my-1">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-body-medium font-normal leading-relaxed">
                {displayedText || "Kamo's AI is currently offline. Please try again later."}
              </div>
            </div>
          ) : (
            <>
              <div className="text-base sm:text-lg md:text-xl leading-relaxed">
                <MarkdownRenderer content={displayedText} isStreaming={localStatus === "streaming"} />
              </div>
              {localStatus === "sent" && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button 
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-on-surface-variant hover:text-primary bg-surface-container-high/45 px-2.5 py-1 rounded-full select-none shadow-sm transition-colors cursor-pointer border-0"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  
                  {(msg as any).meta && (
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-on-surface-variant bg-surface-container-high/45 px-2.5 py-1 rounded-full select-none shadow-sm">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      <span className="font-semibold text-primary">{(msg as any).meta.engine}</span>
                      <span className="opacity-40">•</span>
                      <span>Model: <span className="text-on-surface font-semibold">{(msg as any).meta.model}</span></span>
                      {(msg as any).meta.status && (
                        <>
                          <span className="opacity-40">•</span>
                          <span>Status: <span className="text-on-surface">{(msg as any).meta.status}</span></span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              {localStatus === "sent" && msg.uiBlock && renderUIBlock && (
                <div className="mt-4 flex flex-col gap-3 w-full max-w-3xl">
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
