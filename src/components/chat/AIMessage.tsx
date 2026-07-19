import React, { useState, useEffect, useRef } from "react";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { Message } from "../ChatInterface";
import { AppIcon } from "../AppIcon";

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
  const [displayedText, setDisplayedText] = useState(msg.status === "sent" ? msg.text : "");
  const [localStatus, setLocalStatus] = useState<"loading" | "streaming" | "sent">(
    msg.status === "sending" || msg.status === "loading" ? "loading" : msg.status === "sent" ? "sent" : "streaming"
  );
  
  // Use a ref for the callback so it doesn't trigger re-renders
  const onCompleteRef = useRef(onStreamingComplete);
  useEffect(() => {
    onCompleteRef.current = onStreamingComplete;
  }, [onStreamingComplete]);

  useEffect(() => {
    if (msg.status === "loading" || msg.status === "sending") {
      setLocalStatus("loading");
      setDisplayedText("");
      hasAnimatedRef.current = false;
    } else if (msg.text && !hasAnimatedRef.current && localStatus !== "sent") {
      hasAnimatedRef.current = true;
      setLocalStatus("streaming");
      let currentIndex = 0;
      
      const interval = setInterval(() => {
        currentIndex += Math.floor(Math.random() * 2) + 1; // 1-2 chars
        if (currentIndex >= msg.text.length) {
          currentIndex = msg.text.length;
          clearInterval(interval);
          setLocalStatus("sent");
          onCompleteRef.current(msg.id);
        }
        setDisplayedText(msg.text.substring(0, currentIndex));
      }, 15); // Slower stream

      return () => clearInterval(interval);
    } else if (msg.status === "sent" && localStatus !== "sent") {
      hasAnimatedRef.current = true;
      setDisplayedText(msg.text);
      setLocalStatus("sent");
    }
  }, [msg.text, msg.status, msg.id]);

  return (
    <div className="flex items-start gap-4 w-full max-w-full px-4 scroll-mt-4" id={`msg-${msg.id}`}>
      <div className="w-8 h-8 shrink-0 mt-1 flex items-center justify-center">
        {isFirstInGroup ? (
          <div className="flex items-center justify-center rounded-full bg-surface border-2 border-outline-variant w-8 h-8 shadow-sm">
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
            <div className="flex items-center gap-1.5 text-on-surface-variant pt-1">
              <span className="text-base sm:text-lg font-normal italic">Thinking</span>
              <span className="flex gap-1 items-center h-full ml-1">
                <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </span>
            </div>
          ) : (
            <>
              <div className="text-base sm:text-lg md:text-xl leading-relaxed">
                <MarkdownRenderer content={displayedText} isStreaming={localStatus === "streaming"} />
              </div>
              {localStatus === "sent" && (msg as any).meta && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-mono text-on-surface-variant bg-surface-container-high/45 px-2.5 py-1 rounded-full border border-outline-variant select-none">
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
