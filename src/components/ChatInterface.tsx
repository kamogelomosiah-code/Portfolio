import React, { useState, useRef, useEffect, UIEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, Mic, Square, RefreshCw, X, AlertCircle, RotateCcw, Trash2, Sun, Moon } from "lucide-react";
import { ProjectCards, SkillChips, DownloadCV, ContactCard } from "./RichComponents";
import { AppIcon } from "./AppIcon";
import { AIMessage } from "./chat/AIMessage";
import { useChatReadiness } from "../hooks/useChatReadiness";
import { useChatSend } from "../hooks/useChatSend";
import type { NavTab, ProfileData } from "../types/profile";

export type Attachment = {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
};

export type Message = {
  id: string;
  role: "user" | "agent";
  text: string;
  uiBlock?: "projects" | "skills" | "cv" | "contact" | null;
  status?: "sending" | "sent" | "error" | "loading" | "streaming";
  attachments?: Attachment[];
  meta?: {
    engine?: string;
    model?: string;
    status?: string;
    isOfflineFallback?: boolean;
    failedUserText?: string;
  };
};

const PROMPT_SETS = [
  [
    "Who is Kamogelo Mosia and what is his background?",
    "How can I find or contact Kamogelo?",
    "Tell me about Kamogelo's software engineering projects",
  ],
  [
    "What are Kamogelo's core technical skills?",
    "Can I view Kamogelo's CV and availability?",
    "Where can I see Kamogelo's GitHub and live work?",
  ],
  [
    "Tell me about CallTrax and the kamocodes systems",
    "What academic qualifications does Kamogelo hold?",
    "Is Kamogelo available for full-stack or IT roles?",
  ],
];

export default function ChatInterface({
  messages,
  setMessages,
  onNavigateTab,
  profile,
  theme = "dark",
  onToggleTheme,
}: {
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  onToggleDrawer?: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onNavigateTab?: (tab: NavTab) => void;
  profile?: ProfileData;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}) {
  const [input, setInput] = useState("");
  const [promptSetIndex, setPromptSetIndex] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const { readinessState, elapsedMs, retry: retryReadiness, isReady } = useChatReadiness();
  const [activeClarifications, setActiveClarifications] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { handleSend, isLoading } = useChatSend({
    messages,
    setMessages,
    isReady,
    onScrollToMessage: (id) => {
      const el = document.getElementById(id);
      if (el && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: el.offsetTop - 16,
          behavior: "smooth",
        });
      }
    },
    setActiveClarifications,
  });

  const hasFocusedRef = useRef(false);
  useEffect(() => {
    if (readinessState === "ready" && !hasFocusedRef.current) {
      hasFocusedRef.current = true;
      textareaRef.current?.focus();
    }
  }, [readinessState]);

  const isGenerating = messages.some((m) => m.status === "loading" || m.status === "streaming");

  const supportSpeechRecognition =
    typeof window !== "undefined" &&
    (!!(window as any).SpeechRecognition ||
      !!(window as any).webkitSpeechRecognition ||
      !!navigator?.mediaDevices?.getUserMedia);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");
  const [interimSpeech, setInterimSpeech] = useState("");
  const finalSpeechRef = useRef("");
  const cancelledSpeechRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    if (isRecording) return;
    setInterimSpeech("");
    finalSpeechRef.current = "";
    cancelledSpeechRef.current = false;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsRecording(true);
          setRecordingStatus("Listening… Click Stop when done");
        };

        recognition.onresult = (event: any) => {
          let accumulatedFinal = "";
          let interimTranscript = "";
          for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              accumulatedFinal += event.results[i][0].transcript + " ";
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          const combined = (accumulatedFinal + interimTranscript).trim();
          finalSpeechRef.current = accumulatedFinal.trim() || combined;
          setInterimSpeech(combined);
        };

        recognition.onerror = (event: any) => {
          if (event.error === "aborted" || event.error === "no-speech") {
            setIsRecording(false);
            setRecordingStatus("");
            setInterimSpeech("");
            return;
          }
          setRecordingStatus(
            event.error === "not-allowed" ? "Microphone permission denied." : "Speech recognition unavailable."
          );
          setTimeout(() => setRecordingStatus(""), 3000);
          setIsRecording(false);
          setInterimSpeech("");
        };

        recognition.onend = () => {
          if (!cancelledSpeechRef.current && finalSpeechRef.current) {
            const spoken = finalSpeechRef.current.trim();
            if (spoken) {
              setInput((prev) => (prev ? `${prev.trimEnd()} ${spoken}` : spoken));
            }
          }
          finalSpeechRef.current = "";
          setInterimSpeech("");
          setIsRecording(false);
          setRecordingStatus("");
          recognitionRef.current = null;
        };

        recognition.start();
        return;
      } catch {
        // Fall through to MediaRecorder
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;

        if (cancelledSpeechRef.current) {
          setIsRecording(false);
          setRecordingStatus("");
          return;
        }

        setRecordingStatus("Transcribing audio…");
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "speech.webm");

          const res = await fetch("/api/gemini/transcribe", {
            method: "POST",
            body: formData,
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.error) {
            setRecordingStatus(data.error || `Transcription failed (${res.status})`);
            setTimeout(() => setRecordingStatus(""), 5000);
          } else if (data.text) {
            const transcribed = String(data.text).trim();
            if (transcribed) {
              setInput((prev) => (prev ? `${prev.trimEnd()} ${transcribed}` : transcribed));
            }
            setRecordingStatus("");
          } else {
            setRecordingStatus("");
          }
        } catch {
          setRecordingStatus("Network error during transcription.");
          setTimeout(() => setRecordingStatus(""), 4000);
        } finally {
          setIsRecording(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStatus("Recording… Click Stop to transcribe");
    } catch {
      setRecordingStatus("Microphone access denied. Please check permissions.");
      setTimeout(() => setRecordingStatus(""), 4000);
    }
  };

  const stopRecording = (cancel = false) => {
    cancelledSpeechRef.current = cancel;
    if (recognitionRef.current) {
      try {
        if (cancel) {
          recognitionRef.current.abort();
        } else {
          recognitionRef.current.stop();
        }
      } catch {
        setIsRecording(false);
        setRecordingStatus("");
        setInterimSpeech("");
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        setIsRecording(false);
        setRecordingStatus("");
      }
    }
  };

  useEffect(() => {
    return () => {
      cancelledSpeechRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const scrolledToTopMsgIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "agent") {
      if (
        (lastMsg.status === "streaming" || lastMsg.status === "sent") &&
        !scrolledToTopMsgIds.current.has(lastMsg.id)
      ) {
        scrolledToTopMsgIds.current.add(lastMsg.id);
        setTimeout(() => {
          const el = document.getElementById(`msg-${lastMsg.id}`);
          if (el && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: el.offsetTop - 16,
              behavior: "smooth",
            });
          }
        }, 100);
      }
    }
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = 144;
    const nextHeight = Math.max(42, Math.min(el.scrollHeight, maxHeight));
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [input]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const onSubmitInput = (textToSend?: string) => {
    const raw = typeof textToSend === "string" ? textToSend : input;
    const trimmed = raw.trim();
    if (!trimmed || !isReady || isLoading || isGenerating) return;
    if (typeof textToSend !== "string") {
      setInput("");
    }
    handleSend(trimmed);
  };

  const canSend = Boolean(input.trim()) && isReady && !isLoading && !isGenerating;

  return (
    <div className="flex flex-col h-full w-full relative bg-background">
      <header className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-outline-variant bg-surface z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg border border-outline-variant bg-surface-container-low flex items-center justify-center text-accent-ink shrink-0">
            <AppIcon className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm sm:text-base font-semibold text-on-background truncate">
              {profile?.nickname ? `${profile.nickname}'s AI` : "Kamo's AI"}
            </h1>
            <span className="text-outline-variant">·</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-on-surface-variant whitespace-nowrap">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  readinessState === "waking" || readinessState === "starting"
                    ? "bg-amber-500 animate-pulse"
                    : readinessState === "failed"
                    ? "bg-red-500"
                    : isLoading
                    ? "bg-amber-500 animate-pulse"
                    : "bg-emerald-500"
                }`}
              />
              {readinessState === "waking" || readinessState === "starting"
                ? `Waking (${Math.floor(elapsedMs / 1000)}s)`
                : readinessState === "failed"
                ? "Offline"
                : isLoading
                ? "Thinking"
                : "Ready"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setActiveClarifications([]);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Clear conversation"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors cursor-pointer"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle color theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </div>
      </header>

      <div
        className="flex-1 overflow-y-auto w-full relative"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        <div className="min-h-full flex flex-col px-4 sm:px-6 py-5 sm:py-8 w-full max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="my-auto max-w-xl mx-auto w-full py-4">
              <h2 className="text-2xl sm:text-3xl font-semibold text-on-background tracking-tight text-balance">
                Ask about {profile?.name || "Kamogelo Mosia"}.
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant mt-2.5 leading-relaxed">
                Learn about his background, explore his projects and CV, or find out how to contact him directly.
              </p>

              {onNavigateTab && (
                <div className="flex flex-wrap items-center gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => onNavigateTab("contact")}
                    className="inline-flex items-center justify-center px-4 h-10 rounded-lg bg-primary text-on-primary text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Contact {profile?.nickname || "Kamo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("cv")}
                    className="inline-flex items-center justify-center px-4 h-10 rounded-lg border border-outline-variant bg-surface text-on-background text-xs sm:text-sm font-medium hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    View CV
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("projects")}
                    className="inline-flex items-center justify-center px-4 h-10 rounded-lg border border-outline-variant bg-surface text-on-background text-xs sm:text-sm font-medium hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Explore Projects
                  </button>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2">
                {PROMPT_SETS[promptSetIndex].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={!isReady}
                    onClick={() => onSubmitInput(prompt)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-outline-variant bg-surface hover:border-outline hover:bg-surface-container-low transition-colors text-xs sm:text-sm text-on-background cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between gap-3 min-h-[44px]"
                  >
                    <span>{prompt}</span>
                    <ArrowUp size={14} className="text-on-surface-variant shrink-0 rotate-45" />
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setPromptSetIndex((prev) => (prev + 1) % PROMPT_SETS.length)}
                  className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-background py-2 transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>More suggestions</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 pb-4">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const isFirstInGroup = index === 0 || messages[index - 1].role !== msg.role;
                return (
                  <div
                    id={`msg-${msg.id}`}
                    key={msg.id}
                    className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {isUser ? (
                      <div className="flex flex-col items-end max-w-[85%] sm:max-w-[80%]">
                        <div className="text-on-background px-4 py-2.5 rounded-2xl rounded-tr-sm bg-surface-container-high border border-outline-variant">
                          <p className="text-sm sm:text-[15px] whitespace-pre-wrap leading-relaxed break-words">
                            {msg.text}
                          </p>
                        </div>
                        {msg.status === "error" && (
                          <button
                            type="button"
                            onClick={() => handleSend(msg.text)}
                            className="mt-1 text-red-500 inline-flex items-center gap-1 text-xs cursor-pointer py-1"
                          >
                            <RotateCcw size={12} />
                            <span>Retry</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <AIMessage
                        msg={msg}
                        isFirstInGroup={isFirstInGroup}
                        assistantName={profile?.name || "Kamogelo Mosia"}
                        onStreamingComplete={(id) => {
                          setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "sent" } : m)));
                        }}
                        onRetry={(failedText) => {
                          if (failedText) handleSend(failedText);
                        }}
                        renderUIBlock={(uiBlock) => (
                          <>
                            {uiBlock === "projects" && <ProjectCards profile={profile} />}
                            {uiBlock === "skills" && <SkillChips profile={profile} />}
                            {uiBlock === "contact" && (
                              <ContactCard profile={profile} onNavigateTab={onNavigateTab} />
                            )}
                            {uiBlock === "cv" && <DownloadCV profile={profile} />}
                          </>
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="w-full shrink-0 py-3 sm:py-4 px-3.5 sm:px-6 flex justify-center z-10 bg-background border-t border-outline-variant relative">
        {!isAtBottom && messages.length > 0 && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute -top-11 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-surface border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-on-background cursor-pointer shadow-sm"
            aria-label="Scroll to bottom"
          >
            <ArrowUp size={14} className="rotate-180" />
          </button>
        )}

        <div className="w-full max-w-3xl flex flex-col gap-2">
          {(readinessState === "starting" || readinessState === "waking") && (
            <div className="w-full bg-surface border border-outline-variant text-on-surface px-3.5 py-2 rounded-xl text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="text-on-surface-variant truncate">
                  Waking up the AI server. This can take up to a minute on first load…
                </span>
              </div>
              <span className="font-mono text-xs text-accent-ink font-medium tabular-nums shrink-0">
                {Math.floor(elapsedMs / 1000)}s
              </span>
            </div>
          )}

          {readinessState === "failed" && (
            <div className="w-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle size={15} className="shrink-0" />
                <span>The AI server didn&apos;t respond after two minutes. Try again.</span>
              </div>
              <button
                type="button"
                onClick={retryReadiness}
                className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-medium cursor-pointer shrink-0"
              >
                <RotateCcw size={12} />
                <span>Retry</span>
              </button>
            </div>
          )}

          <AnimatePresence>
            {(recordingStatus || interimSpeech) && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="w-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <span className="truncate">{interimSpeech || recordingStatus}</span>
                </div>
                {isRecording && (
                  <button
                    type="button"
                    onClick={() => stopRecording(true)}
                    className="p-1 rounded-md hover:bg-red-500/15 cursor-pointer shrink-0"
                    aria-label="Cancel recording"
                    title="Cancel recording"
                  >
                    <X size={14} />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeClarifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="w-full bg-surface border border-outline-variant p-3 rounded-xl flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                    Follow-up
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveClarifications([])}
                    className="p-1 text-on-surface-variant hover:text-on-background cursor-pointer"
                    aria-label="Dismiss follow-ups"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto">
                  {activeClarifications.map((question, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onSubmitInput(question);
                        setActiveClarifications([]);
                      }}
                      className="w-full text-left px-3 py-2 text-xs sm:text-sm text-on-background bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-lg transition-colors cursor-pointer"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && isReady) {
                textareaRef.current?.focus();
              }
            }}
            className={`w-full bg-surface border rounded-2xl flex items-end gap-2 px-3 py-2 transition-colors ${
              isReady
                ? "border-outline-variant focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15"
                : "border-outline-variant/70 opacity-75"
            }`}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  onSubmitInput();
                }
              }}
              enterKeyHint="send"
              placeholder={isReady ? "Write a message…" : ""}
              aria-label="Message input"
              disabled={!isReady}
              rows={1}
              className="flex-1 min-w-0 bg-transparent text-on-background py-2 px-1 focus:outline-none resize-none placeholder:text-on-surface-variant/65 text-base sm:text-[15px] leading-relaxed disabled:cursor-not-allowed min-h-[42px]"
            />

            <div className="flex items-center gap-1.5 pb-0.5 shrink-0">
              {supportSpeechRecognition && (
                <button
                  type="button"
                  onClick={() => (isRecording ? stopRecording(false) : startRecording())}
                  disabled={!isReady}
                  className={`w-10 h-10 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                    isRecording
                      ? "bg-red-600 text-white"
                      : "text-on-surface-variant hover:text-on-background hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
                  }`}
                  title={isRecording ? "Stop voice input" : "Voice input"}
                  aria-label={isRecording ? "Stop recording" : "Start voice input"}
                >
                  {isRecording ? <Square size={15} /> : <Mic size={16} />}
                </button>
              )}

              <button
                type="button"
                onClick={() => onSubmitInput()}
                disabled={!canSend}
                className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Send message"
              >
                <ArrowUp size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
