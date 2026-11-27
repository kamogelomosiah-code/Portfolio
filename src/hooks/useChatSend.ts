import { useState, useRef, useCallback } from "react";
import { Message } from "../components/ChatInterface";
import { API_ROUTES } from "../config/api";

export const CHAT_REQUEST_TIMEOUT_MS = 90_000;

interface UseChatSendOptions {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isReady: boolean;
  onScrollToMessage?: (messageId: string) => void;
  setActiveClarifications?: (clarifications: string[]) => void;
}

export function useChatSend({
  messages,
  setMessages,
  isReady,
  onScrollToMessage,
  setActiveClarifications,
}: UseChatSendOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const activeControllerRef = useRef<AbortController | null>(null);
  // Always the latest conversation, without re-creating handleSend on every message.
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      // Guard: do not run if empty or server not ready
      if (!trimmed || !isReady) return;

      const userMsgId = Date.now().toString();
      const userMsg: Message = {
        id: userMsgId,
        role: "user",
        text: trimmed,
        status: "sent",
      };

      const agentMsgId = (Date.now() + 1).toString();
      const initialAgentMsg: Message = {
        id: agentMsgId,
        role: "agent",
        text: "",
        status: "loading",
      };

      // The last few finished turns, so follow-up questions make sense to the model.
      const history = messagesRef.current
        .filter((m) => m.text.trim() && m.status !== "loading" && m.status !== "error")
        .slice(-6)
        .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

      setMessages((prev) => [...prev, userMsg, initialAgentMsg]);
      setIsLoading(true);
      setActiveClarifications?.([]);

      if (onScrollToMessage) {
        setTimeout(() => {
          onScrollToMessage(`msg-${agentMsgId}`);
        }, 50);
      }

      const controller = new AbortController();
      activeControllerRef.current = controller;

      const timeoutId = setTimeout(() => {
        try {
          controller.abort(new DOMException("Chat request timed out after 90 seconds", "TimeoutError"));
        } catch {
          controller.abort();
        }
      }, CHAT_REQUEST_TIMEOUT_MS);

      try {
        const res = await fetch(API_ROUTES.chat, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const data = await res.json().catch(() => null);
        const rawReply =
          typeof data?.reply === "string"
            ? data.reply
            : typeof data?.text === "string"
            ? data.text
            : "";

        if (!rawReply.trim()) {
          throw new Error("Empty or malformed reply from AI server");
        }

        clearTimeout(timeoutId);

        let replyText = rawReply.trim();
        const isOfflineFallback = Boolean(data?.fallback);

        // Parse UI tokens and follow-up clarifications
        let uiBlock: Message["uiBlock"] = null;
        let followUps: string[] = [];

        const clarifyMatch = replyText.match(/\[CLARIFY:\s*([^\]]+)\]/);
        if (clarifyMatch) {
          followUps = clarifyMatch[1]
            .split("|")
            .map((q: string) => q.trim())
            .filter(Boolean);
          replyText = replyText.replace(/\[CLARIFY:\s*([^\]]+)\]/, "").trim();
        }

        if (replyText.includes("[UI:PROJECTS]")) {
          uiBlock = "projects";
          replyText = replyText.replace("[UI:PROJECTS]", "").trim();
        } else if (replyText.includes("[UI:SKILLS]")) {
          uiBlock = "skills";
          replyText = replyText.replace("[UI:SKILLS]", "").trim();
        } else if (replyText.includes("[UI:CONTACT]")) {
          uiBlock = "contact";
          replyText = replyText.replace("[UI:CONTACT]", "").trim();
        } else if (replyText.includes("[UI:CV]")) {
          uiBlock = "cv";
          replyText = replyText.replace("[UI:CV]", "").trim();
        }

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === agentMsgId) {
              return {
                ...m,
                status: "streaming",
                text: replyText,
                uiBlock,
                meta: isOfflineFallback
                  ? { ...m.meta, isOfflineFallback: true }
                  : m.meta,
              };
            }
            return m;
          })
        );

        if (followUps.length > 0 && setActiveClarifications) {
          setActiveClarifications(followUps);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        // Do NOT silently substitute generateLocalAssistantReply!
        // Show an error message in the chat bubble with Retry capability.
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === agentMsgId) {
              return {
                ...m,
                status: "error",
                text: "I couldn't reach the AI just now. Your message wasn't lost, so you can try again.",
                meta: {
                  ...m.meta,
                  failedUserText: trimmed,
                },
              };
            }
            return m;
          })
        );
      } finally {
        clearTimeout(timeoutId);
        activeControllerRef.current = null;
        setIsLoading(false);
      }
    },
    [isReady, onScrollToMessage, setActiveClarifications, setMessages]
  );

  return {
    handleSend,
    isLoading,
  };
}
