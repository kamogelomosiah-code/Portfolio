import React, { useState, useRef, useEffect, UIEvent } from "react";
import { 
  Send, Sparkles, Mic, Link as LinkIcon, User, Mail, 
  GraduationCap, FileText, Menu, MessageSquare, PlusCircle, X, 
  AlertCircle, ChevronRight, CornerDownLeft, Plus,
  List, Cpu, RotateCw, Paperclip, ChevronDown, Zap,
  Image as ImageIcon, Database, Layers, Code2, Brain
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectCards, SkillChips, DownloadCV } from "./RichComponents";
import { WatermelonIcon } from "./WatermelonIcon";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { initAuth, googleSignIn, logout } from "../lib/auth";
import type { User as FirebaseUser } from "firebase/auth";

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
  uiBlock?: "projects" | "skills" | "cv" | null;
  status?: "sending" | "sent" | "error";
  attachments?: Attachment[];
};

const PROMPT_SETS = [
  [
    { text: "What are Kamogelo's top technical skills?", icon: "sparkles" },
    { text: "Tell me about Kamogelo's software engineering projects", icon: "code" },
    { text: "How can I contact Kamogelo or download his CV?", icon: "user" },
    { text: "What academic qualifications does Kamogelo hold?", icon: "cap" }
  ],
  [
    { text: "What is Kamo's professional IT and customer experience?", icon: "user" },
    { text: "Explain his 'CallTrax' billing platform project", icon: "layers" },
    { text: "Tell me about the 'kamocodes Library' system", icon: "list" },
    { text: "Does Kamo have experience with PHP and Laravel?", icon: "code" }
  ],
  [
    { text: "What is Kamo's main focus or career objective?", icon: "sparkles" },
    { text: "Explain the architecture of Kamo's AI Portfolio app", icon: "cpu" },
    { text: "Tell me about the 'kamocodes API' gateway project", icon: "database" },
    { text: "What databases is Kamo experienced with?", icon: "database" }
  ]
];

function renderPromptIcon(iconName: string) {
  switch (iconName) {
    case "list":
      return <List size={16} className="text-[var(--color-accent)]" />;
    case "mail":
      return <Mail size={16} className="text-[var(--color-accent)]" />;
    case "text":
      return <FileText size={16} className="text-[var(--color-accent)]" />;
    case "cpu":
      return <Cpu size={16} className="text-[var(--color-accent)]" />;
    case "sparkles":
      return <Sparkles size={16} className="text-[var(--color-accent)]" />;
    case "code":
      return <Code2 size={16} className="text-[var(--color-accent)]" />;
    case "user":
      return <User size={16} className="text-[var(--color-accent)]" />;
    case "cap":
      return <GraduationCap size={16} className="text-[var(--color-accent)]" />;
    case "layers":
      return <Layers size={16} className="text-[var(--color-accent)]" />;
    case "database":
      return <Database size={16} className="text-[var(--color-accent)]" />;
    default:
      return <MessageSquare size={16} className="text-[var(--color-accent)]" />;
  }
}

export default function ChatInterface({ 
  selectedModel = "gemini-2.5-flash",
  setSelectedModel,
  onToggleDrawer,
  messages,
  setMessages,
  onViewCv
}: { 
  selectedModel?: string,
  setSelectedModel?: (model: string) => void,
  onToggleDrawer?: () => void,
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  onViewCv?: () => void
}) {
  const [input, setInput] = useState("");
  const [promptSetIndex, setPromptSetIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [introStage, setIntroStage] = useState<"initial" | "options">("initial");
  const [isHfConnected, setIsHfConnected] = useState<boolean | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
  };

  useEffect(() => {
    const checkHfHealth = async () => {
      try {
        const res = await fetch("/api/hf-health");
        const data = await res.json();
        setIsHfConnected(!!data.connected);
      } catch (err) {
        setIsHfConnected(false);
      }
    };
    checkHfHealth();
    const interval = setInterval(checkHfHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      setIntroStage("initial");
      const timer = setTimeout(() => {
        setIntroStage("options");
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setIntroStage("options");
    }
  }, [messages.length]);

  // Client side typing stream states
  const [streamedTexts, setStreamedTexts] = useState<Record<string, string>>({});
  const [currentlyStreamingId, setCurrentlyStreamingId] = useState<string | null>(null);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastScrollY = useRef(0);

  // Smart Clarification / Follow-up Questions State
  const [activeClarifications, setActiveClarifications] = useState<string[]>([]);

  // Dedicated helper to trigger precise scroll-to-bottom on the chat container
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  // High-reliability scrolling on message shifts
  useEffect(() => {
    scrollToBottom('auto');
    const t1 = setTimeout(() => scrollToBottom('smooth'), 40);
    const t2 = setTimeout(() => scrollToBottom('smooth'), 150);
    const t3 = setTimeout(() => scrollToBottom('smooth'), 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [messages, isLoading, isTranscribing, input]);

  // Resize observer to scroll when bubble height increases dynamically
  useEffect(() => {
    if (!scrollContentRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 500;
        if (isNearBottom || isLoading || currentlyStreamingId) {
          scrollToBottom('smooth');
        }
      }
    });

    resizeObserver.observe(scrollContentRef.current);
    return () => resizeObserver.disconnect();
  }, [isLoading, currentlyStreamingId]);

  // Progressive Token/Word streaming effect
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "agent" && !streamedTexts[lastMsg.id] && currentlyStreamingId !== lastMsg.id) {
      setCurrentlyStreamingId(lastMsg.id);
      
      const fullText = lastMsg.text;
      const words = fullText.split(/(\s+)/); // keep spaces
      let currentWordIndex = 0;
      let currentText = "";
      
      const interval = setInterval(() => {
        if (currentWordIndex < words.length) {
          currentText += words[currentWordIndex];
          currentWordIndex++;
          setStreamedTexts(prev => ({
            ...prev,
            [lastMsg.id]: currentText
          }));
          scrollToBottom('auto');
        } else {
          clearInterval(interval);
          setCurrentlyStreamingId(null);
          setStreamedTexts(prev => ({
            ...prev,
            [lastMsg.id]: fullText
          }));
        }
      }, 15); // lightning fast word streaming

      return () => clearInterval(interval);
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    setIsScrolled(currentScrollY > 20);
    lastScrollY.current = currentScrollY;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        const formData = new FormData();
        formData.append('audio', audioBlob, 'record.webm');

        try {
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (res.ok && data.text) {
            setInput((prev) => prev + (prev.length > 0 ? " " : "") + data.text);
          } else if (data.error) {
            alert(data.error);
          }
        } catch (error) {
          console.error("Transcription failed", error);
        } finally {
          setIsTranscribing(false);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const getOfflineResponse = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("project") || lower.includes("portfolio") || lower.includes("work")) {
      return "I can't fetch live data right now, but here are some of Kamogelo's highlighted projects: [UI:PROJECTS]";
    }
    if (lower.includes("skill") || lower.includes("tech") || lower.includes("stack")) {
      return "Kamogelo is an IT Engineer. Here is an overview of his technical skills: [UI:SKILLS]";
    }
    if (lower.includes("cv") || lower.includes("resume") || lower.includes("hire") || lower.includes("download")) {
      return "You can download Kamogelo's full CV right here: [UI:CV]";
    }
    if (lower.includes("contact") || lower.includes("email") || lower.includes("message")) {
      return "Kamogelo can be reached at kamogelomosiah@gmail.com. Feel free to reach out to him directly!";
    }
    
    return "I'm currently operating in offline mode. I can show you Kamogelo's projects, skills, or CV. What would you like to see?";
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: "user", 
      text: text.trim(), 
      status: "sending"
    };
    const updatedMessages = [...messages, userMsg];
    
    // Set UI to loading immediately
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setActiveClarifications([]);

    if (isHfConnected === false) {
      setTimeout(() => {
        let replyText = getOfflineResponse(text);
        let uiBlock: Message["uiBlock"] = null;

        if (replyText.includes("[UI:PROJECTS]")) {
          uiBlock = "projects";
          replyText = replyText.replace("[UI:PROJECTS]", "").trim();
        } else if (replyText.includes("[UI:SKILLS]")) {
          uiBlock = "skills";
          replyText = replyText.replace("[UI:SKILLS]", "").trim();
        } else if (replyText.includes("[UI:CV]")) {
          uiBlock = "cv";
          replyText = replyText.replace("[UI:CV]", "").trim();
        }

        const agentMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "agent",
          text: replyText,
          uiBlock,
          status: "sent"
        };

        setMessages(prev => {
          const updated = prev.map(m => m.id === userMsg.id ? { ...m, status: "sent" as const } : m);
          return [...updated, agentMsg];
        });
        setIsLoading(false);
      }, 600);
      return;
    }

    try {
      const history = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const { getAccessToken } = await import('../lib/auth');
      const token = await getAccessToken();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ history, message: text.trim(), model: selectedModel }),
      });
      
      const data = await res.json();
      let replyText = data.text || "Sorry, I had trouble processing that.";
      let uiBlock: Message["uiBlock"] = null;

      // Extract clarifying follow-up questions
      let followUps: string[] = [];
      const clarifyMatch = replyText.match(/\[CLARIFY:\s*([^\]]+)\]/);
      if (clarifyMatch) {
        followUps = clarifyMatch[1].split("|").map((q: string) => q.trim()).filter(Boolean);
        replyText = replyText.replace(/\[CLARIFY:\s*([^\]]+)\]/, "").trim();
      }

      if (replyText.includes("[UI:PROJECTS]")) {
        uiBlock = "projects";
        replyText = replyText.replace("[UI:PROJECTS]", "").trim();
      } else if (replyText.includes("[UI:SKILLS]")) {
        uiBlock = "skills";
        replyText = replyText.replace("[UI:SKILLS]", "").trim();
      } else if (replyText.includes("[UI:CV]")) {
        uiBlock = "cv";
        replyText = replyText.replace("[UI:CV]", "").trim();
      }

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        text: replyText,
        uiBlock,
        status: "sent"
      };

      setMessages(prev => {
        const updated = prev.map(m => m.id === userMsg.id ? { ...m, status: "sent" as const } : m);
        return [...updated, agentMsg];
      });

      if (followUps.length > 0) {
        setActiveClarifications(followUps);
      }

    } catch (error) {
      console.error("Chat Error:", error);
      // Optimistic failure feedback
      setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, status: "error" as const } : m));
    } finally {
      setIsLoading(false);
    }
  };

  const renderComposer = (isFixed: boolean) => {
    return (
      <div className={`${isFixed ? 'w-full max-w-3xl' : 'w-full max-w-2xl mx-auto mt-4'} relative flex flex-col items-center pointer-events-auto`}>
        {/* Audio recording layout overlay */}
        <AnimatePresence>
          {isRecording && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute inset-x-0 bottom-full mb-4 z-20 bg-[var(--bg-card)] border border-[var(--color-accent)]/30 rounded-none flex items-center justify-center p-6 cursor-pointer shadow-xl overflow-hidden touch-none select-none text-[var(--text-main)]"
              onPointerUp={stopRecording}
              onPointerLeave={stopRecording}
              onTouchEnd={stopRecording}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="absolute inset-0 bg-[var(--color-accent-light)] animate-pulse"></div>
              <div className="flex flex-col items-center justify-center gap-3 z-10">
                <div className="w-16 h-16 bg-[var(--color-accent)] rounded-none flex items-center justify-center animate-bounce shadow-md">
                  <Mic size={30} className="text-white" />
                </div>
                <span className="font-semibold text-[13.5px] tracking-wide">Listening... Release to transcribe</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Clarification Questions Popup */}
        <AnimatePresence>
          {activeClarifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="w-full bg-[var(--bg-card)] border border-[var(--color-accent)]/20 shadow-xl p-4 mb-3 rounded-none relative z-30 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-[var(--color-accent)] font-semibold text-[13px] sm:text-[14px]">
                  <Sparkles size={14} className="animate-pulse" />
                  <span>Interactive Follow-up Questions</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveClarifications([])}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-0.5 border-0 bg-transparent cursor-pointer"
                  title="Dismiss suggestions"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-[12.5px] text-[var(--text-muted)] mb-3 leading-relaxed">
                Choose a question below to refine your query, or ask anything else:
              </p>
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                {activeClarifications.map((question, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleSend(question);
                      setActiveClarifications([]);
                    }}
                    className="w-full text-left px-3.5 py-2 text-[13px] sm:text-[13.5px] font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)] border border-neutral-200 dark:border-neutral-800 hover:border-[var(--color-accent)]/30 transition-all rounded-none duration-150 active:scale-[0.99] cursor-pointer"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input box */}
        <div className={`w-full bg-[var(--bg-card)] border ${isTranscribing ? 'border-[var(--color-accent)] shadow-[0_6px_24px_rgba(30,142,62,0.15)]' : 'border-neutral-200 dark:border-neutral-800 shadow-sm'} rounded-[32px] focus-within:shadow-[0_6px_20px_rgba(30,142,62,0.06)] focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]/10 transition-all flex flex-col p-4.5 pb-3.5 relative`}>
          {isTranscribing && (
            <div className="absolute inset-0 bg-[var(--bg-card)]/95 backdrop-blur-sm z-10 rounded-[32px] flex items-center justify-center gap-3">
               <svg className="animate-spin h-5 w-5 text-[var(--color-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <span className="font-semibold text-[14.5px] text-[var(--color-accent)]">Transcribing voice input...</span>
            </div>
          )}

          {/* Top Row: text area */}
          <div className="flex items-start justify-between gap-3 w-full min-h-[46px]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => { if (introStage !== "options") setIntroStage("options"); }}
              onKeyDown={(e) => {
                 if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                 }
              }}
              placeholder="Type a message or hold to speak..." 
              ref={textareaRef}
              className="flex-1 bg-transparent text-[var(--text-main)] py-1.5 px-1 focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 font-normal text-[15.5px] sm:text-[16.5px] leading-relaxed max-h-[140px] overflow-y-auto border-0"
              disabled={isLoading || isTranscribing}
              rows={2}
            />
          </div>

          {/* Bottom Row: Actions & Send */}
          <div className="flex items-center justify-between mt-2.5 px-1 w-full gap-2 select-none">
            {/* Left side: Think Pill in DeepSeek Style */}
            <div className="flex items-center gap-1.5 bg-[#f4f4f5] dark:bg-[#27272a] p-0.5 rounded-full overflow-hidden">
              <div className="flex items-center pl-2 text-neutral-500">
                <Brain size={14} />
              </div>
              <select
                value={selectedModel}
                onChange={(e) => {
                  if (setSelectedModel) setSelectedModel(e.target.value);
                }}
                className="bg-transparent text-[11.5px] sm:text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 py-1.5 pr-2 focus:outline-none cursor-pointer border-0 w-32 sm:w-48 text-ellipsis"
              >
                <option value="MiniMaxAI/MiniMax-M3:preferred">MiniMax-M3</option>
                <option value="deepseek-ai/DeepSeek-V4-Flash:novita">DeepSeek-V4-Flash</option>
                <option value="Qwen/Qwen3.6-27B:featherless-ai">Qwen3.6-27B</option>
                <option value="fusion">Think Longer (Agentic)</option>
              </select>
            </div>

            {/* Right side: Options, Voice, Character count and Send */}
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] text-[var(--text-muted)] font-mono hidden sm:inline select-none pr-1">
                {input.length}/1000
              </span>

              {/* Send button */}
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading || isTranscribing}
                className={`w-9.5 h-9.5 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                  input.trim() && !isLoading && !isTranscribing
                    ? "border-transparent bg-[var(--color-accent)] text-white hover:opacity-90 active:scale-95 shadow-sm"
                    : "border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/30 text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
                }`}
                title="Send message"
              >
                <Send size={18} strokeWidth={2.2} className="-ml-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer text with elegant small connection status */}
        <div className="text-center mt-2 w-full flex flex-col sm:flex-row items-center justify-between px-1.5 gap-1.5 sm:gap-0 select-none">
           <div className="flex items-center gap-1.5">
             <span className="relative flex h-2 w-2">
               {isHfConnected === null ? (
                 <>
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                 </>
               ) : isHfConnected ? (
                 <>
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </>
               ) : (
                 <>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                 </>
               )}
             </span>
             <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 font-mono">
               {isHfConnected === null ? (
                 "Checking server..."
               ) : isHfConnected ? (
                 "HuggingFace: Active"
               ) : (
                 "Offline Mode: Active"
               )}
             </span>
           </div>

           <span className="text-[10.5px] text-[var(--text-muted)] font-normal">
              Assistant can make mistakes. Please check important details.
           </span>
        </div>
      </div>
    );
  };

  const isInitialState = messages.length === 0;
  const isShrunk = isScrolled || !isInitialState;

  return (
    <div className="flex-1 flex h-full overflow-hidden relative bg-[var(--bg-main)] w-full font-sans antialiased">
      
      {/* Main Conversation Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-30 w-full flex items-center justify-between h-[64px] border-b border-[var(--border-light)] bg-[var(--bg-card)]/95 backdrop-blur-md px-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={onToggleDrawer} 
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--text-muted)] cursor-pointer border-0 bg-transparent"
              title="Navigation Menu"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-2">
              <WatermelonIcon className="w-5 h-5 text-[var(--color-accent)] shrink-0" />
              <span className="font-semibold text-[15px] sm:text-[16px] text-[var(--text-main)] font-display tracking-tight">
                Kamogelo's GPT
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {needsAuth ? (
              <button onClick={handleLogin} disabled={isLoggingIn} className="gsi-material-button bg-white text-gray-700 font-semibold py-1.5 px-3 rounded shadow border border-gray-300 flex items-center gap-2 text-[13px] hover:bg-gray-50 cursor-pointer">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                {isLoggingIn ? "Signing in..." : "Sign in with Google"}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-[var(--text-muted)] font-medium truncate max-w-[150px]">
                  {user?.email}
                </span>
                <button onClick={handleLogout} className="text-[12px] text-red-500 hover:text-red-600 bg-transparent border-0 cursor-pointer font-medium px-2 py-1">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable chat body */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto w-full flex flex-col relative scroll-smooth pt-2"
          onScroll={handleScroll}
        >
          <div ref={scrollContentRef} className="w-full max-w-[850px] mx-auto flex flex-col px-4 sm:px-6 pt-4 pb-[190px] min-h-full">
              
              {isInitialState && (
                <div className="flex flex-col text-left w-full max-w-3xl mx-auto pt-6 min-h-[300px] justify-center">
                  <AnimatePresence mode="wait">
                    {introStage === "initial" ? (
                      <motion.div 
                        key="greeting"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="flex flex-col text-left w-full py-8"
                      >
                        {/* Greeting Hero */}
                        <div className="mb-6">
                          <h1 className="text-[36px] sm:text-[44px] font-bold tracking-tight text-[var(--text-main)] mb-1 leading-none font-display">
                            Hi there, <span className="bg-gradient-to-r from-[var(--color-accent)] to-[#C084FC] bg-clip-text text-transparent">Friend</span>
                          </h1>
                          <h2 className="text-[36px] sm:text-[44px] font-bold tracking-tight text-[#4F46E5] dark:text-[#818CF8] mb-4 leading-none font-display">
                            What would you like to know?
                          </h2>
                          <p className="text-[var(--text-muted)] text-[15.5px] font-normal leading-relaxed">
                            Use one of the most common prompts below or use your own to begin learning about me.
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="options"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex flex-col text-left w-full"
                      >
                        {/* Compact suggestions header */}
                        <div className="mb-3.5">
                          <p className="text-[var(--text-muted)] text-[12px] font-semibold uppercase tracking-wider">
                            Quick Suggestions
                          </p>
                        </div>

                        {/* Reduced Sleek Horizontal Prompt Cards (3 Columns) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
                          {PROMPT_SETS[promptSetIndex].slice(0, 3).map((prompt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(prompt.text)}
                              className="flex items-center gap-3.5 p-3.5 bg-[var(--bg-card)] border border-[var(--border-light)] hover:border-gray-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-all duration-200 active:scale-[0.98] cursor-pointer text-left min-h-[64px] rounded-none shadow-sm"
                            >
                              <div className="shrink-0 w-8 h-8 rounded-none bg-[var(--color-accent-light)] flex items-center justify-center">
                                {renderPromptIcon(prompt.icon)}
                              </div>
                              <span className="text-[13px] text-[var(--text-main)] font-semibold leading-tight line-clamp-2">
                                {prompt.text}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Refresh Prompts left-aligned */}
                        <div className="mt-3.5 flex justify-start mb-8">
                          <button
                            onClick={() => setPromptSetIndex((prev) => (prev + 1) % PROMPT_SETS.length)}
                            className="flex items-center gap-1.5 text-[12.5px] text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium transition-colors bg-transparent border-0 cursor-pointer p-1"
                          >
                            <RotateCw size={13} />
                            <span>Refresh Suggestions</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {messages.length > 0 && (
                <div className="flex flex-col w-full relative">
                  {messages.map((msg, index) => {
                    const isUser = msg.role === "user";
                    const isFirstInGroup = index === 0 || messages[index - 1].role !== msg.role;
                    const isLastInGroup = index === messages.length - 1 || messages[index + 1].role !== msg.role;
                    
                    const isStreaming = currentlyStreamingId === msg.id;
                    const textToShow = isStreaming ? (streamedTexts[msg.id] || "") : msg.text;

                    return (
                      <div 
                        key={msg.id} 
                        className={`flex w-full ${isUser ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-6" : "mt-2"}`}
                      >
                        {isUser ? (
                          /* 5 & 6. User: Rounded bubble, right-aligned, accent-colored background */
                          <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%]">
                            <div 
                              className="text-[var(--text-main)] px-4.5 py-3 sm:px-5 sm:py-3.5 rounded-[20px] rounded-tr-[4px] border shadow-sm"
                              style={{ 
                                backgroundColor: "var(--color-accent-light)", 
                                borderColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)" 
                              }}
                            >
                              <p className="text-[14.5px] sm:text-[15px] whitespace-pre-wrap font-normal leading-relaxed break-words">
                                {msg.text}
                              </p>
                              
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-3 flex flex-col gap-2 w-full max-w-xs">
                                  {msg.attachments.map((attachment, attIdx) => {
                                    const isImage = attachment.type.startsWith("image/");
                                    return (
                                      <div key={attIdx} className="w-full">
                                        {isImage && attachment.dataUrl ? (
                                          <img 
                                            src={attachment.dataUrl} 
                                            alt={attachment.name} 
                                            className="max-w-full max-h-[160px] object-cover rounded-lg border border-black/10 dark:border-white/10 shadow-sm" 
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <div className="flex items-center gap-2.5 px-3 py-2 bg-white/60 dark:bg-black/30 border border-black/5 dark:border-white/5 rounded-lg select-none text-left">
                                            <FileText size={15} className="text-[var(--color-accent)] shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                              <span className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[160px]">{attachment.name}</span>
                                              <span className="text-[10px] text-neutral-500 font-mono">{(attachment.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            {msg.status === "error" && (
                              <button 
                                onClick={() => handleSend(msg.text)} 
                                className="mt-1.5 text-red-500 hover:text-red-600 flex items-center gap-1.5 text-[12px] font-medium bg-transparent border-0 cursor-pointer"
                              >
                                <AlertCircle size={13} />
                                <span>Failed to send. Click to retry</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          /* 5 & 6. Assistant: Plain text on bg, avatar on left, shown once per group */
                          <div className="flex items-start gap-4 w-full max-w-full px-1">
                            <div className="w-8 h-8 shrink-0 mt-1 flex items-center justify-center">
                              {isFirstInGroup ? (
                                <div className="flex items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border-light)] w-8 h-8 shadow-sm">
                                  <WatermelonIcon className="w-4.5 h-4.5 text-[var(--color-accent)] animate-pulse" />
                                </div>
                              ) : (
                                <div className="w-8 h-8" />
                              )}
                            </div>
                            
                            <div className="flex-1 flex flex-col items-start w-full min-w-0">
                              {isFirstInGroup && (
                                <span className="font-semibold text-[13px] text-[var(--text-muted)] mb-1">
                                  CodeMind Assistant
                                </span>
                              )}
                              <div className="text-[var(--text-main)] bg-transparent pb-1 w-full text-left max-w-3xl">
                                <MarkdownRenderer content={textToShow} isStreaming={isStreaming} />
                                
                                {/* Rich Visual UI widgets, rendered only once completed */}
                                {!isStreaming && msg.uiBlock && (
                                  <div className="mt-4 flex flex-col gap-3 w-full max-w-3xl">
                                    {msg.uiBlock === "projects" && <ProjectCards />}
                                    {msg.uiBlock === "skills" && <SkillChips />}
                                    {msg.uiBlock === "cv" && <DownloadCV onViewCv={onViewCv} />}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* While AI is responding status indicator */}
                  {isLoading && (
                    <div className="flex items-start w-full justify-start mt-6 px-1">
                      <div className="flex items-start gap-4 w-full max-w-full">
                        <div className="flex items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border-light)] w-8 h-8 shrink-0 mt-1 shadow-sm">
                          <WatermelonIcon className="w-4.5 h-4.5 text-[var(--color-accent)] animate-pulse" />
                        </div>
                        <div className="flex-1 flex flex-col items-start w-full">
                          <span className="font-semibold text-[13px] text-[var(--text-muted)] mb-1">
                            CodeMind Assistant
                          </span>
                          <div className="py-2 flex items-center gap-1.5 text-[var(--text-muted)]">
                            <span className="text-[14px] font-normal italic">
                              {selectedModel === 'fusion' ? 'Consulting models...' : 'Thinking'}
                            </span>
                            <span className="inline-block animate-pulse font-bold text-[var(--color-accent)] select-none">▍</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={endOfMessagesRef} className="h-4" />
                </div>
              )}
            </div>
        </div>

        {/* Custom Composer fixed at bottom - always displayed to be sticky bottom and always visible */}
        <div className="absolute bottom-0 left-0 right-0 pt-4 pb-3 sm:pb-4 px-4 sm:px-6 flex justify-center z-10 pointer-events-none bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/95 via-45% to-transparent">
          {renderComposer(true)}
        </div>

      </div>

      {/* Model Selection Drawer Bottom Sheet */}
      <AnimatePresence>
        {modelSelectorOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModelSelectorOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-50 cursor-pointer pointer-events-auto"
            />
            {/* Drawer Body */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[var(--bg-card)] rounded-t-3xl shadow-2xl z-50 overflow-hidden flex flex-col pb-8 pt-4 px-6 text-[var(--text-main)] pointer-events-auto border-t border-gray-200 dark:border-neutral-800"
            >
              {/* Drag Handle Accent */}
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-neutral-700 rounded-full mx-auto mb-5 shrink-0" />

              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[20px] text-[var(--text-main)] flex items-center gap-2 m-0 font-display">
                  <Sparkles size={18} className="text-[var(--color-accent)] animate-pulse" />
                  Select Model Engine
                </h3>
                <button
                  onClick={() => setModelSelectorOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center border-0 cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-[14px] text-[var(--text-muted)] mb-6">
                Choose the model configuration that powers Kamo's AI response engine.
              </p>
              
              <div className="flex flex-col gap-3">
                {[
                  { 
                    id: "swift", 
                    name: "Swift Model (Fast Pass)", 
                    icon: Zap, 
                    desc: "A highly-optimized, lightning-fast single model. Designed for standard professional inquiries, direct Q&A, and quick CV retrieval with minimal latency.", 
                    color: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/20" 
                  },
                  { 
                    id: "fusion", 
                    name: "Fusion Engine (Ensemble Reasoning)", 
                    icon: Brain, 
                    desc: "An advanced multi-model ensemble. Reasons deeply, synthesizes professional IT background data, and cross-references answers for maximum depth and accuracy.", 
                    color: "text-[var(--color-accent)] bg-[var(--color-accent-light)]" 
                  }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModel?.(m.id);
                        setModelSelectorOpen(false);
                      }}
                      className={`flex items-start text-left gap-4 p-4 rounded-xl border transition-all cursor-pointer bg-transparent w-full ${
                        isSelected
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]/40 shadow-sm ring-1 ring-[var(--color-accent)]"
                          : "border-[var(--border-light)] hover:bg-gray-50 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <div className={`w-10 h-10 flex items-center justify-center rounded-lg shrink-0 ${m.color}`}>
                        <Icon size={18} className="stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0 font-sans">
                        <span className="text-[15.5px] font-bold text-[var(--text-main)] leading-snug">{m.name}</span>
                        <span className="text-[13px] text-[var(--text-muted)] font-normal leading-relaxed mt-1 whitespace-normal">{m.desc}</span>
                      </div>
                      {isSelected && (
                        <div className="w-5.5 h-5.5 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white shrink-0 mt-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-end">
                 <button
                   onClick={() => setModelSelectorOpen(false)}
                   className="px-8 py-3 rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90 font-bold text-[14.5px] transition-colors cursor-pointer border-0 shadow-sm"
                 >
                   Done
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
