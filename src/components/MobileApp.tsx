import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Sparkles, Mic, User, Mail, 
  GraduationCap, FileText, MessageSquare, AlertCircle, 
  Code2, Download, Phone, MapPin, Globe, ExternalLink, Github, Menu,
  Cpu, RotateCw, List, ChevronDown, Image as ImageIcon, Database, Layers, Linkedin, Paperclip, Zap, X, Brain
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectCards, SkillChips, DownloadCV } from "./RichComponents";
import { WatermelonIcon } from "./WatermelonIcon";
import { Message, Attachment } from "./ChatInterface";
import { MarkdownRenderer } from "./MarkdownRenderer";
import ProjectsPage from "./ProjectsPage";
import CvPage from "./CvPage";
import ContactPage from "./ContactPage";
import MenuDrawer from "./MenuDrawer";

interface MobileAppProps {
  accentColor: string;
  setAccentColor: (color: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const TABS = ["chat", "projects", "cv", "contact"] as const;
type TabType = typeof TABS[number];

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

export default function MobileApp({
  accentColor,
  setAccentColor,
  selectedModel,
  setSelectedModel,
  messages,
  setMessages
}: MobileAppProps) {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [direction, setDirection] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [input, setInput] = useState("");
  const [promptSetIndex, setPromptSetIndex] = useState(0);
  const [introStage, setIntroStage] = useState<"initial" | "options">("initial");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Smart Clarification / Follow-up Questions State
  const [activeClarifications, setActiveClarifications] = useState<string[]>([]);

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

  const renderComposer = (isFixed: boolean) => {
    return (
      <div className={`${isFixed ? 'w-full' : 'w-full mt-4'} relative flex flex-col items-center pointer-events-auto`}>
        {/* Audio recording Layout */}
        <AnimatePresence>
          {isRecording && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute inset-x-0 bottom-full mb-3 z-20 bg-[var(--bg-card)] border border-[var(--color-accent)]/30 rounded-none flex items-center justify-center p-5 shadow-lg overflow-hidden touch-none select-none text-[var(--text-main)]"
              onPointerUp={stopRecording}
              onTouchEnd={stopRecording}
            >
              <div className="absolute inset-0 bg-[var(--color-accent-light)] animate-pulse"></div>
              <div className="flex flex-col items-center justify-center gap-2 z-10">
                <div className="w-12 h-12 bg-[var(--color-accent)] rounded-none flex items-center justify-center animate-bounce shadow-sm">
                  <Mic size={22} className="text-white" />
                </div>
                <span className="font-semibold text-[12px]">Listening... Release to transcribe</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Clarification Questions Popup */}
        <AnimatePresence>
          {activeClarifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="w-full bg-[var(--bg-card)] border border-[var(--color-accent)]/20 shadow-lg p-3 mb-2.5 rounded-none relative z-30 text-left"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1 text-[var(--color-accent)] font-semibold text-[12px] sm:text-[13px]">
                  <Sparkles size={12} className="animate-pulse" />
                  <span>Interactive Follow-up Questions</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveClarifications([])}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-0.5 border-0 bg-transparent cursor-pointer"
                  title="Dismiss suggestions"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="flex flex-col gap-1.5 max-h-[130px] overflow-y-auto pr-0.5">
                {activeClarifications.map((question, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleSend(question);
                      setActiveClarifications([]);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-[12px] font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)] border border-neutral-200 dark:border-neutral-800/80 hover:border-[var(--color-accent)]/30 rounded-none transition-all active:scale-[0.99] cursor-pointer"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input box */}
        <div className={`w-full bg-[var(--bg-card)] border ${isTranscribing ? 'border-[var(--color-accent)] shadow-[0_6px_24px_rgba(30,142,62,0.15)]' : 'border-neutral-200 dark:border-neutral-800 shadow-sm'} rounded-[32px] focus-within:shadow-[0_6px_20px_rgba(30,142,62,0.06)] focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]/10 transition-all flex flex-col p-4 pb-3.5 relative`}>
          {isTranscribing && (
            <div className="absolute inset-0 bg-[var(--bg-card)]/95 backdrop-blur-sm z-10 rounded-[32px] flex items-center justify-center gap-3">
               <svg className="animate-spin h-5 w-5 text-[var(--color-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <span className="font-semibold text-[13.5px] text-[var(--color-accent)]">Transcribing audio...</span>
            </div>
          )}

          {/* Top Row: text area */}
          <div className="flex items-start justify-between gap-2.5 w-full min-h-[44px]">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Type a message or hold to speak..." 
              className="flex-1 bg-transparent text-[var(--text-main)] py-1.5 px-1 focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 font-normal text-[15px] leading-relaxed max-h-[100px] overflow-y-auto border-0"
              disabled={isLoading || isTranscribing}
              rows={2}
            />
          </div>

          {/* Bottom Row: Actions & Send in DeepSeek Style */}
          <div className="flex items-center justify-between mt-2.5 px-1 w-full gap-2 select-none">
            {/* Left side: Think Pill */}
            <div className="flex items-center gap-1.5 bg-[#f4f4f5] dark:bg-[#27272a] p-0.5 rounded-full shrink-0">
              <div className="flex items-center pl-2 text-neutral-500">
                <Brain size={14} />
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="bg-transparent flex items-center justify-between text-[11px] font-bold text-neutral-700 dark:text-neutral-300 py-1.5 px-2 focus:outline-none cursor-pointer border-0 w-auto min-w-[140px] text-left"
                >
                  <span className="whitespace-nowrap">
                    {selectedModel === 'MiniMaxAI/MiniMax-M3:preferred' ? 'MiniMax-M3' :
                     selectedModel === 'deepseek-ai/DeepSeek-V4-Flash:novita' ? 'DeepSeek-V4-Flash' :
                     selectedModel === 'Qwen/Qwen3.6-27B:featherless-ai' ? 'Qwen3.6-27B' :
                     'Think Longer (Agentic)'}
                  </span>
                  <svg className={`w-3 h-3 ml-1 shrink-0 text-neutral-500 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                
                {isModelDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsModelDropdownOpen(false)}></div>
                    <div className="absolute bottom-full left-0 mb-1 w-auto min-w-[180px] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg shadow-xl z-30 py-1 overflow-hidden">
                      {[
                        { id: 'MiniMaxAI/MiniMax-M3:preferred', name: 'MiniMax-M3' },
                        { id: 'deepseek-ai/DeepSeek-V4-Flash:novita', name: 'DeepSeek-V4-Flash' },
                        { id: 'Qwen/Qwen3.6-27B:featherless-ai', name: 'Qwen3.6-27B' },
                        { id: 'fusion', name: 'Think Longer (Agentic)' }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            if (setSelectedModel) setSelectedModel(m.id);
                            setIsModelDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-[12px] font-medium border-0 cursor-pointer whitespace-nowrap ${selectedModel === m.id ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]' : 'bg-transparent text-[var(--text-main)] hover:bg-[var(--bg-main)]'}`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right side: Options, Voice, Counter and Send */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] text-[var(--text-muted)] font-mono hidden sm:inline select-none pr-1">
                {input.length}/1000
              </span>

              {/* Send button */}
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading || isTranscribing}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                  input.trim() && !isLoading && !isTranscribing
                    ? "border-transparent bg-[var(--color-accent)] text-white hover:opacity-90 active:scale-95 shadow-sm"
                    : "border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/30 text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
                }`}
                title="Send message"
              >
                <Send size={16} strokeWidth={2.2} className="-ml-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer info with connection dot status */}
        <div className="w-full flex items-center justify-between mt-1.5 px-1 select-none text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              {isHfConnected === null ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                </>
              ) : isHfConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </>
              ) : (
                <>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                </>
              )}
            </span>
            <span className="font-semibold text-neutral-400 dark:text-neutral-500 font-mono">
              {isHfConnected === null ? "Connecting..." : isHfConnected ? "Server: Connected" : "Mode: Offline"}
            </span>
          </div>

          <span className="text-[10px] text-[var(--text-muted)] font-normal">
            Assistant can make mistakes.
          </span>
        </div>
      </div>
    );
  };
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [isHfConnected, setIsHfConnected] = useState<boolean | null>(null);

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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Page index helper to determine animation direction
  const getTabIndex = (tab: TabType) => TABS.indexOf(tab);

  const handleTabChange = (newTab: TabType) => {
    const currentIndex = getTabIndex(activeTab);
    const newIndex = getTabIndex(newTab);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Keyboard awareness - scroll when input receives focus
  const handleInputFocus = () => {
    if (introStage !== "options") {
      setIntroStage("options");
    }
    setTimeout(() => {
      scrollToBottom();
    }, 150);
  };

  // Recording Logic (Web Audio API)
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

  // Send message logic
  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: "user", 
      text: text.trim(), 
      status: "sending"
    };
    const updatedMessages = [...messages, userMsg];
    
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

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, status: "error" as const } : m));
    } finally {
      setIsLoading(false);
    }
  };

  const isInitialState = messages.length === 0;

  // Slide Animation Variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 350, damping: 32 },
        opacity: { duration: 0.15 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      transition: {
        x: { type: "spring" as const, stiffness: 350, damping: 32 },
        opacity: { duration: 0.15 }
      }
    })
  };

  return (
    <div className="flex flex-col h-dvh w-full bg-[var(--bg-main)] text-[var(--text-main)] font-sans select-none overflow-hidden relative">
      
      {/* Top Header - Only displayed on Chat tab */}
      {activeTab === "chat" && (
        <header className="sticky top-0 z-30 w-full flex items-center justify-between h-[60px] border-b border-[var(--border-light)] bg-[var(--bg-card)]/90 backdrop-blur-md px-4 shrink-0 shadow-sm safe-top">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setDrawerOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--text-muted)] cursor-pointer border-0 bg-transparent shrink-0"
              style={{ minWidth: "40px", minHeight: "40px" }}
              title="Menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <WatermelonIcon className="w-5 h-5 text-[var(--color-accent)] animate-pulse" />
              <span className="font-bold text-[15px] font-display tracking-tight text-[var(--text-main)]">
                Kamogelo's GPT
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Screen Container with Swipe-Style Tab Transitions */}
      <main className="flex-1 w-full overflow-hidden relative bg-[var(--bg-main)]">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full overflow-hidden flex flex-col"
          >
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Scrollable Conversation Block */}
                <div 
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto w-full px-4 pt-3 pb-4 scroll-smooth"
                >
                  {isInitialState ? (
                    <div className="flex flex-col text-left w-full py-6 px-1 min-h-[280px] justify-center">
                      <AnimatePresence mode="wait">
                        {introStage === "initial" ? (
                          <motion.div
                            key="greeting"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="flex flex-col text-left w-full"
                          >
                            {/* Greeting Hero */}
                            <div className="mb-5">
                              <h1 className="text-[30px] font-bold tracking-tight text-[var(--text-main)] mb-0.5 leading-none font-display">
                                Hi there, <span className="bg-gradient-to-r from-[var(--color-accent)] to-[#C084FC] bg-clip-text text-transparent">Friend</span>
                              </h1>
                              <h2 className="text-[30px] font-bold tracking-tight text-[#4F46E5] dark:text-[#818CF8] mb-3 leading-none font-display">
                                What would you like to know?
                              </h2>
                              <p className="text-[var(--text-muted)] text-[14px] font-normal leading-relaxed">
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
                            <div className="mb-2.5">
                              <p className="text-[var(--text-muted)] text-[11px] font-semibold uppercase tracking-wider">
                                Quick Suggestions
                              </p>
                            </div>

                            {/* Reduced Sleek Horizontal Prompt Cards (Vertical Stack on Mobile) */}
                            <div className="flex flex-col gap-2.5 w-full">
                              {PROMPT_SETS[promptSetIndex].slice(0, 3).map((prompt, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSend(prompt.text)}
                                  className="flex items-center gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border-light)] hover:border-gray-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-all duration-200 active:scale-[0.98] cursor-pointer text-left min-h-[54px] rounded-none shadow-sm"
                                >
                                  <div className="shrink-0 w-7 h-7 rounded-none bg-[var(--color-accent-light)] flex items-center justify-center">
                                    {renderPromptIcon(prompt.icon)}
                                  </div>
                                  <span className="text-[12.5px] text-[var(--text-main)] font-semibold leading-tight line-clamp-2">
                                    {prompt.text}
                                  </span>
                                </button>
                              ))}
                            </div>

                            {/* Refresh Prompts left-aligned */}
                            <div className="mt-3.5 flex justify-start mb-6">
                              <button
                                onClick={() => setPromptSetIndex((prev) => (prev + 1) % PROMPT_SETS.length)}
                                className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium transition-colors bg-transparent border-0 cursor-pointer p-1"
                              >
                                <RotateCw size={12} />
                                <span>Refresh Suggestions</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {messages.map((msg, index) => {
                        const isUser = msg.role === "user";
                        const isFirst = index === 0 || messages[index - 1].role !== msg.role;
                        
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                          >
                            {isUser ? (
                              <div className="flex flex-col items-end max-w-[85%]">
                                <div 
                                  className="text-[var(--text-main)] px-4 py-3 rounded-[20px] rounded-tr-[4px] border shadow-sm"
                                  style={{ 
                                    backgroundColor: "var(--color-accent-light)", 
                                    borderColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)" 
                                  }}
                                >
                                  <p className="text-[14px] whitespace-pre-wrap leading-relaxed break-words">
                                    {msg.text}
                                  </p>
                                  
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2.5 flex flex-col gap-1.5 w-full max-w-[200px]">
                                      {msg.attachments.map((attachment, attIdx) => {
                                        const isImage = attachment.type.startsWith("image/");
                                        return (
                                          <div key={attIdx} className="w-full">
                                            {isImage && attachment.dataUrl ? (
                                              <img 
                                                src={attachment.dataUrl} 
                                                alt={attachment.name} 
                                                className="max-w-full max-h-[130px] object-cover rounded-lg border border-black/10 dark:border-white/10 shadow-sm" 
                                                referrerPolicy="no-referrer"
                                              />
                                            ) : (
                                              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/60 dark:bg-black/30 border border-black/5 dark:border-white/5 rounded-lg select-none text-left">
                                                <FileText size={13} className="text-[var(--color-accent)] shrink-0" />
                                                <div className="flex flex-col min-w-0">
                                                  <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[120px]">{attachment.name}</span>
                                                  <span className="text-[9px] text-neutral-500 font-mono leading-none mt-0.5">{(attachment.size / 1024).toFixed(1)} KB</span>
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
                                    className="mt-1 text-red-500 flex items-center gap-1 text-[11px] bg-transparent border-0"
                                  >
                                    <AlertCircle size={12} /> Retry
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-start gap-3 w-full">
                                <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border-light)] shadow-sm">
                                  <WatermelonIcon className="w-4 h-4 text-[var(--color-accent)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {isFirst && (
                                    <span className="block font-semibold text-[11px] text-[var(--text-muted)] mb-0.5">
                                      CodeMind Assistant
                                    </span>
                                  )}
                                  <div className="text-[14px] leading-relaxed text-[var(--text-main)] w-full">
                                    <MarkdownRenderer content={msg.text} />
                                  </div>
                                  
                                  {msg.uiBlock && (
                                    <div className="mt-3 w-full">
                                      {msg.uiBlock === "projects" && <ProjectCards />}
                                      {msg.uiBlock === "skills" && <SkillChips />}
                                      {msg.uiBlock === "cv" && <DownloadCV onViewCv={() => handleTabChange("cv")} />}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {isLoading && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border-light)] shadow-sm">
                            <WatermelonIcon className="w-4 h-4 text-[var(--color-accent)] animate-pulse" />
                          </div>
                          <div className="flex-1">
                            <span className="block font-semibold text-[11px] text-[var(--text-muted)] mb-0.5">
                              CodeMind Assistant
                            </span>
                            <div className="flex items-center gap-1.5 text-[var(--text-muted)] py-1.5">
                              <span className="text-[13px] italic">
                                {selectedModel === 'fusion' ? 'Consulting models...' : 'Thinking'}
                              </span>
                              <span className="inline-block animate-pulse text-[var(--color-accent)]">▍</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Keyboard-Aware Pinned Composer bar - always visible and sticky bottom */}
                <div className="w-full pt-3 pb-4 px-4 shrink-0 bg-[var(--bg-main)] z-10 border-t border-[var(--border-subtle)]">
                  {renderComposer(true)}
                </div>
              </div>
            )}

            {activeTab === "projects" && (
              <ProjectsPage 
                onBackToChat={() => handleTabChange("chat")} 
                onToggleDrawer={() => setDrawerOpen(true)}
              />
            )}

            {activeTab === "cv" && (
              <CvPage 
                onBackToChat={() => handleTabChange("chat")} 
                onToggleDrawer={() => setDrawerOpen(true)}
              />
            )}

            {activeTab === "contact" && (
              <ContactPage 
                onBackToChat={() => handleTabChange("chat")} 
                onToggleDrawer={() => setDrawerOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

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
                <h3 className="font-semibold text-[19px] text-[var(--text-main)] flex items-center gap-2 m-0 font-display">
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
              <p className="text-[13px] text-[var(--text-muted)] mb-5">
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
                      className={`flex items-start text-left gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer bg-transparent w-full ${
                        isSelected
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]/40 shadow-sm ring-1 ring-[var(--color-accent)]"
                          : "border-[var(--border-light)] hover:bg-gray-50 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <div className={`w-10 h-10 flex items-center justify-center rounded-lg shrink-0 ${m.color}`}>
                        <Icon size={17} className="stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0 font-sans">
                        <span className="text-[14.5px] font-bold text-[var(--text-main)] leading-snug">{m.name}</span>
                        <span className="text-[12px] text-[var(--text-muted)] font-normal leading-relaxed mt-0.5 whitespace-normal">{m.desc}</span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white shrink-0 mt-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                 <button
                   onClick={() => setModelSelectorOpen(false)}
                   className="px-6 py-2.5 rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90 font-bold text-[14px] transition-colors cursor-pointer border-0 shadow-sm"
                 >
                   Done
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Menu Drawer Integration */}
      <MenuDrawer
        currentTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab)}
        isOpen={drawerOpen}
        onToggle={() => setDrawerOpen(!drawerOpen)}
      />
    </div>
  );
}
