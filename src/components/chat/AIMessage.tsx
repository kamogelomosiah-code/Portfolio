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

  useEffect(() => {
    if (msg.status === "loading" || msg.status === "sending") {
      setLocalStatus("loading");
      setDisplayedText("");
      hasAnimatedRef.current = false;
    } else if (msg.text && !hasAnimatedRef.current && localStatus !== "sent") {
      hasAnimatedRef.current = true;
      setLocalStatus("streaming");
      let currentIndex = 0;
      const textToStream = msg.text;
      
      const interval = setInterval(() => {
        currentIndex += Math.floor(Math.random() * 3) + 2; // advance 2-4 chars at a time
        if (currentIndex >= textToStream.length) {
          currentIndex = textToStream.length;
          clearInterval(interval);
          setLocalStatus("sent");
          onStreamingComplete(msg.id);
        }
        setDisplayedText(textToStream.substring(0, currentIndex));
      }, 10); // 10ms per chunk

      return () => clearInterval(interval);
    } else if (msg.status === "sent" && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      setDisplayedText(msg.text);
      setLocalStatus("sent");
    }
  }, [msg.text, msg.status, msg.id, localStatus, onStreamingComplete]);

  return (
    <div className="flex items-start gap-4 w-full max-w-full px-1 scroll-mt-4" id={`msg-${msg.id}`}>
      <div className="w-8 h-8 shrink-0 mt-1 flex items-center justify-center">
        {isFirstInGroup ? (
          <div className="flex items-center justify-center rounded-full bg-surface w-8 h-8 shadow-sm">
            <AppIcon className={`w-4.5 h-4.5 text-primary ${localStatus === "loading" ? "animate-pulse" : ""}`} />
          </div>
        ) : (
          <div className="w-8 h-8" />
        )}
      </div>
      
      <div className="flex-1 flex flex-col items-start w-full min-w-0">
        {isFirstInGroup && (
          <span className="font-semibold text-body-small text-on-surface-variant mb-1">
            Kamogelo Mosiah
          </span>
        )}
        
        <div className="text-on-background bg-transparent pb-1 w-full text-left max-w-3xl min-h-[24px]">
          {localStatus === "loading" ? (
            <div className="flex items-center gap-1.5 text-on-surface-variant pt-1">
              <span className="text-body-medium font-normal italic">Thinking</span>
              <span className="flex gap-1 items-center h-full ml-1">
                <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </span>
            </div>
          ) : (
            <>
              <MarkdownRenderer content={displayedText} isStreaming={localStatus === "streaming"} />
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
