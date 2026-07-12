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
import { AppIcon } from "./AppIcon";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MaterialIcon } from "./MaterialIcon";
import { initAuth, googleSignIn, logout, getAccessToken } from "../lib/auth";
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
      return <List size={16} className="text-primary" />;
    case "mail":
      return <Mail size={16} className="text-primary" />;
    case "text":
      return <FileText size={16} className="text-primary" />;
    case "cpu":
      return <Cpu size={16} className="text-primary" />;
    case "sparkles":
      return <Sparkles size={16} className="text-primary" />;
    case "code":
      return <Code2 size={16} className="text-primary" />;
    case "user":
      return <User size={16} className="text-primary" />;
    case "cap":
      return <GraduationCap size={16} className="text-primary" />;
    case "layers":
      return <Layers size={16} className="text-primary" />;
    case "database":
      return <Database size={16} className="text-primary" />;
    default:
      return <MessageSquare size={16} className="text-primary" />;
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
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && !err?.message?.includes('popup-closed-by-user')) {
        console.error('Login failed:', err);
      }
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
    // Only auto scroll to bottom if user is sending a message or it's loading
    if (isLoading || input) {
      scrollToBottom('auto');
      const t1 = setTimeout(() => scrollToBottom('smooth'), 40);
      const t2 = setTimeout(() => scrollToBottom('smooth'), 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [messages, isLoading, input]);

  // Resize observer to scroll when bubble height increases dynamically
  useEffect(() => {
    if (!scrollContentRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom && !currentlyStreamingId) {
          scrollToBottom('smooth');
        }
      }
    });

    resizeObserver.observe(scrollContentRef.current);
    return () => resizeObserver.disconnect();
  }, [currentlyStreamingId]);

  // Progressive Token/Word streaming effect
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "agent" && !streamedTexts[lastMsg.id] && currentlyStreamingId !== lastMsg.id) {
      setCurrentlyStreamingId(lastMsg.id);
      
      // Scroll to the start of the message
      setTimeout(() => {
        const msgEl = document.getElementById(`message-${lastMsg.id}`);
        if (msgEl) {
          msgEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);

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

  // Microphone recording removed

  const getOfflineResponse = (text: string) => {
    return "The engine can not be reached.";
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
        {/* Smart Clarification Questions Popup */}
        <AnimatePresence>
          {activeClarifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="w-full bg-surface border border-primary/20 shadow-xl p-4 mb-3 rounded-none relative z-30 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-primary font-semibold text-body-small sm:text-body-medium">
                  <MaterialIcon name="auto_awesome" className="text-title-medium animate-pulse" />
                  <span>Interactive Follow-up Questions</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveClarifications([])}
                  className="text-on-surface-variant hover:text-on-surface-variant  transition-colors p-1 border-0 bg-transparent cursor-pointer flex items-center justify-center rounded-lg hover:bg-surface-container-highest"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                  title="Dismiss suggestions"
                >
                  <MaterialIcon name="close" className="text-title-large" />
                </button>
              </div>
              <p className="text-[12.5px] text-on-surface-variant mb-3 leading-relaxed">
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
                    className="w-full text-left px-3.5 py-2.5 text-body-small sm:text-[13.5px] font-medium text-on-surface  bg-surface-container-low hover:bg-primary-container hover:text-primary border border-outline-variant hover:border-primary/30 transition-all rounded-none duration-150 active:scale-[0.99] cursor-pointer min-h-[44px]"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input box */}
        <div className="w-full bg-surface border border-outline-variant shadow-sm rounded-[32px] focus-within:shadow-[0_6px_20px_rgba(30,142,62,0.06)] focus-within:border-primary focus-within:ring-2 focus-within:ring-[var(--color-accent)]/10 transition-all flex flex-col p-4.5 pb-3.5 relative">
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
              placeholder="Ask me about math or coding!" 
              ref={textareaRef}
              className="flex-1 bg-transparent text-on-background py-1.5 px-1 focus:outline-none resize-none placeholder:text-on-surface-variant  font-normal text-[15.5px] sm:text-[16.5px] leading-relaxed max-h-[140px] overflow-y-auto border-0"
              disabled={isLoading}
              rows={2}
            />
          </div>

          {/* Bottom Row: Actions & Send */}
          <div className="flex items-center justify-between mt-2.5 px-1 w-full gap-2 select-none">
            {/* Thinking Mode Toggle button */}
            <button
              type="button"
              onClick={() => {
                if (setSelectedModel) {
                  setSelectedModel(selectedModel === "fusion" ? "MiniMaxAI/MiniMax-M3:preferred" : "fusion");
                }
              }}
              className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-full text-label-medium font-semibold transition-all duration-200 border cursor-pointer shrink-0 min-h-[44px]"
              style={{
                backgroundColor: selectedModel === "fusion" ? "var(--color-accent-light)" : "transparent",
                borderColor: selectedModel === "fusion" ? "var(--color-accent)" : "transparent",
                color: selectedModel === "fusion" ? "var(--color-accent)" : "var(--text-muted)"
              }}
              title={selectedModel === "fusion" ? "Thinking Mode Active" : "Enable Thinking Mode for advanced responses"}
            >
              <MaterialIcon name="psychology" className={`text-title-large ${selectedModel === "fusion" ? "animate-pulse" : ""}`} />
              <span>Thinking Mode</span>
              {selectedModel === "fusion" && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                </span>
              )}
            </button>

            {/* Right side: Character count and Send */}
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] text-on-surface-variant font-mono hidden sm:inline select-none pr-1">
                {input.length}/1000
              </span>

              {/* Send button (Sized appropriately for Touch Target requirements) */}
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
                  input.trim() && !isLoading
                    ? "border-transparent bg-primary text-on-primary hover:opacity-90 active:scale-95 shadow-sm"
                    : "border-outline-variant bg-surface-container-low text-on-surface-variant cursor-not-allowed"
                }`}
                style={{ minWidth: "44px", minHeight: "44px" }}
                title="Send message"
              >
                <MaterialIcon name="send" className="text-title-large" />
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
             <span className="text-label-small font-semibold text-on-surface-variant font-mono">
               {isHfConnected === null ? (
                 "Checking server..."
               ) : isHfConnected ? (
                 "HuggingFace: Active"
               ) : (
                 "Offline Mode: Active"
               )}
             </span>
           </div>

           <span className="text-[10.5px] text-on-surface-variant font-normal">
              Assistant can make mistakes. Please check important details.
           </span>
        </div>
      </div>
    );
  };

  const isInitialState = messages.length === 0;
  const isShrunk = isScrolled || !isInitialState;

  return (
    <div className="flex-1 flex h-full overflow-hidden relative bg-background w-full font-sans antialiased">
      
      {/* Main Conversation Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-30 w-full flex items-center justify-between h-[64px] border-b border-outline-variant bg-surface/95 backdrop-blur-md px-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={onToggleDrawer} 
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg hover:bg-inverse-surface/5  transition-colors text-on-surface-variant cursor-pointer border-0 bg-transparent"
              style={{ minWidth: "44px", minHeight: "44px" }}
              title="Navigation Menu"
            >
              <MaterialIcon name="menu" className="text-headline-large" />
            </button>
            
            <div className="flex items-center gap-2">
              <AppIcon className="w-5 h-5 text-primary shrink-0" />
              <span className="font-semibold text-title-small sm:text-title-medium text-on-background font-display tracking-tight">
                Kamogelo's GPT
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {needsAuth ? (
              <button onClick={handleLogin} disabled={isLoggingIn} className="gsi-material-button bg-surface text-on-surface font-semibold py-1.5 px-3 rounded shadow border border-outline-variant flex items-center gap-2 text-body-small hover:bg-surface-container-low cursor-pointer">
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
                <span className="text-body-small text-on-surface-variant font-medium truncate max-w-[150px]">
                  {user?.email}
                </span>
                <button onClick={handleLogout} className="text-label-medium text-red-500 hover:text-red-600 bg-transparent border-0 cursor-pointer font-medium px-2 py-1">
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
          <div ref={scrollContentRef} className="w-full max-w-[850px] mx-auto flex flex-col px-4 sm:px-6 pt-4 pb-6 min-h-full">
              
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
                          <h1 className="text-display-medium sm:text-[44px] font-bold tracking-tight text-on-background mb-1 leading-none font-display">
                            Hi there, <span className="bg-gradient-to-r from-[var(--color-accent)] to-[#C084FC] bg-clip-text text-transparent">Friend</span>
                          </h1>
                          <h2 className="text-display-medium sm:text-[44px] font-bold tracking-tight text-[#4F46E5]  mb-4 leading-none font-display">
                            What would you like to know?
                          </h2>
                          <p className="text-on-surface-variant text-[15.5px] font-normal leading-relaxed">
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
                          <p className="text-on-surface-variant text-label-medium font-semibold uppercase tracking-wider">
                            Quick Suggestions
                          </p>
                        </div>

                        {/* Reduced Sleek Horizontal Prompt Cards (3 Columns) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
                          {PROMPT_SETS[promptSetIndex].slice(0, 3).map((prompt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(prompt.text)}
                              className="flex items-center gap-3.5 p-3.5 bg-surface border border-outline-variant hover:bg-surface-container-highest transition-all duration-200 active:scale-[0.98] cursor-pointer text-left min-h-[64px] rounded-none shadow-sm"
                            >
                              <div className="shrink-0 w-8 h-8 rounded-none bg-primary-container flex items-center justify-center">
                                {renderPromptIcon(prompt.icon)}
                              </div>
                              <span className="text-body-small text-on-background font-semibold leading-tight line-clamp-2">
                                {prompt.text}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Refresh Prompts left-aligned */}
                        <div className="mt-3.5 flex justify-start mb-8">
                          <button
                            onClick={() => setPromptSetIndex((prev) => (prev + 1) % PROMPT_SETS.length)}
                            className="flex items-center gap-1.5 text-[12.5px] text-on-surface-variant hover:text-on-background font-semibold transition-colors bg-transparent border-0 cursor-pointer p-2.5 min-h-[44px]"
                          >
                            <MaterialIcon name="refresh" className="text-body-medium" />
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
                        id={`message-${msg.id}`}
                        key={msg.id} 
                        className={`flex w-full ${isUser ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-6" : "mt-2"}`}
                      >
                        {isUser ? (
                          /* 5 & 6. User: Rounded bubble, right-aligned, accent-colored background */
                          <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%]">
                            <div 
                              className="text-on-background px-4.5 py-3 sm:px-5 sm:py-3.5 rounded-[20px] rounded-tr-[4px] border shadow-sm"
                              style={{ 
                                backgroundColor: "var(--color-accent-light)", 
                                borderColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)" 
                              }}
                            >
                              <p className="text-[14.5px] sm:text-title-small whitespace-pre-wrap font-normal leading-relaxed break-words">
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
                                            className="max-w-full max-h-[160px] object-cover rounded-lg border border-black/10  shadow-sm" 
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <div className="flex items-center gap-2.5 px-3 py-2 bg-surface/60  border border-black/5  rounded-lg select-none text-left">
                                            <MaterialIcon name="description" className="text-title-medium text-primary shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                              <span className="text-label-medium font-semibold text-on-surface  truncate max-w-[160px]">{attachment.name}</span>
                                              <span className="text-[10px] text-on-surface-variant font-mono">{(attachment.size / 1024).toFixed(1)} KB</span>
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
                                className="mt-1.5 text-red-500 hover:text-red-600 flex items-center gap-1.5 text-label-medium font-semibold bg-transparent border-0 cursor-pointer min-h-[44px]"
                              >
                                <MaterialIcon name="error" className="text-body-medium text-red-500 mr-1" />
                                <span>Failed to send. Click to retry</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          /* 5 & 6. Assistant: Plain text on bg, avatar on left, shown once per group */
                          <div className="flex items-start gap-4 w-full max-w-full px-1">
                            <div className="w-8 h-8 shrink-0 mt-1 flex items-center justify-center">
                              {isFirstInGroup ? (
                                <div className="flex items-center justify-center rounded-full bg-surface border border-outline-variant w-8 h-8 shadow-sm">
                                  <AppIcon className="w-4.5 h-4.5 text-primary animate-pulse" />
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
                              <div className="text-on-background bg-transparent pb-1 w-full text-left max-w-3xl">
                                <MarkdownRenderer content={textToShow} isStreaming={isStreaming} />
                                
                                {!isStreaming && (
                                  <div className="flex flex-wrap gap-2 mt-3 mb-1 select-none">
                                    <button
                                      onClick={() => handleSend("Tell me about your software projects")}
                                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-label-medium font-semibold bg-surface-container hover:bg-surface-container-highest text-on-surface hover:text-primary border border-outline-variant transition-all duration-150 cursor-pointer shadow-sm"
                                    >
                                      <span>📂 View Projects</span>
                                    </button>
                                    <button
                                      onClick={() => handleSend("What are your core technical skills?")}
                                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-label-medium font-semibold bg-surface-container hover:bg-surface-container-highest text-on-surface hover:text-primary border border-outline-variant transition-all duration-150 cursor-pointer shadow-sm"
                                    >
                                      <span>🛠️ Check Skills</span>
                                    </button>
                                    <button
                                      onClick={() => handleSend("Can I see your CV / Resume?")}
                                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-label-medium font-semibold bg-surface-container hover:bg-surface-container-highest text-on-surface hover:text-primary border border-outline-variant transition-all duration-150 cursor-pointer shadow-sm"
                                    >
                                      <span>📄 Download CV</span>
                                    </button>
                                  </div>
                                )}

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
                        <div className="flex items-center justify-center rounded-full bg-surface border border-outline-variant w-8 h-8 shrink-0 mt-1 shadow-sm">
                          <AppIcon className="w-4.5 h-4.5 text-primary animate-pulse" />
                        </div>
                        <div className="flex-1 flex flex-col items-start w-full">
                          <span className="font-semibold text-body-small text-on-surface-variant mb-1">
                            Kamogelo Mosiah
                          </span>
                          <div className="py-2 flex items-center gap-1.5 text-on-surface-variant">
                            <span className="text-body-medium font-normal italic">
                              {selectedModel === 'fusion' ? 'Consulting models...' : 'Thinking'}
                            </span>
                            <span className="inline-block animate-pulse font-bold text-primary select-none">▍</span>
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
        <div className="w-full shrink-0 pt-4 pb-3 sm:pb-4 px-4 sm:px-6 flex justify-center z-10 bg-background border-t border-outline-variant">
          {renderComposer(true)}
        </div>

      </div>

      {/* Model Selection Drawer Bottom Sheet */}


    </div>
  );
}
