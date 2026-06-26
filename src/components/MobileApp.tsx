import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Sparkles, Settings, Mic, User, Mail, 
  GraduationCap, FileText, MessageSquare, AlertCircle, 
  Code2, Download, Phone, MapPin, Globe, ExternalLink, Github, Menu,
  Cpu, RotateCw, List, ChevronDown, Image as ImageIcon, Database, Layers, Linkedin, Paperclip, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectCards, SkillChips, DownloadCV } from "./RichComponents";
import { WatermelonIcon } from "./WatermelonIcon";
import { Message } from "./ChatInterface";
import { MarkdownRenderer } from "./MarkdownRenderer";
import SettingsModal from "./SettingsModal";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [input, setInput] = useState("");
  const [promptSetIndex, setPromptSetIndex] = useState(0);
  const [introStage, setIntroStage] = useState<"initial" | "options">("initial");

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

        {/* Input box */}
        <div className={`w-full bg-[var(--bg-card)] border ${isTranscribing ? 'border-[var(--color-accent)] shadow-[0_2px_12px_rgba(26,115,232,0.15)]' : 'border-gray-300 dark:border-neutral-700 shadow-sm'} rounded-none focus-within:shadow-[0_2px_8px_rgba(0,0,0,0.08)] focus-within:border-gray-400 dark:focus-within:border-neutral-500 transition-all flex flex-col p-4.5 relative`}>
          {isTranscribing && (
            <div className="absolute inset-0 bg-[var(--bg-card)]/95 backdrop-blur-sm z-10 rounded-none flex items-center justify-center gap-3">
               <svg className="animate-spin h-5 w-5 text-[var(--color-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <span className="font-semibold text-[13.5px] text-[var(--color-accent)]">Transcribing audio...</span>
            </div>
          )}

          {/* Top Row: text area & Mode Select */}
          <div className="flex items-start justify-between gap-2.5 w-full min-h-[46px]">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Ask whatever you want...." 
              className="flex-1 bg-transparent text-[var(--text-main)] py-1.5 focus:outline-none resize-none placeholder:text-[var(--text-muted)] font-normal text-[14.5px] leading-relaxed max-h-[100px] overflow-y-auto border-0"
              disabled={isLoading || isTranscribing}
              rows={2}
            />

            <button 
              onClick={() => setSettingsOpen(true)}
              type="button"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-[var(--text-muted)] border border-[var(--border-light)] rounded-none hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer shrink-0"
              title="Select AI Mode"
            >
              {selectedModel === "swift" ? (
                <Zap size={11} className="text-amber-500 fill-amber-500/10" />
              ) : (
                <Cpu size={11} className="text-[var(--color-accent)]" />
              )}
              <span className="truncate max-w-[60px]">
                {selectedModel === "swift" ? "Swift" : "Fusion"}
              </span>
              <ChevronDown size={9} className="text-neutral-400" />
            </button>
          </div>

          {/* Separator line */}
          <div className="h-px bg-gray-100 dark:bg-neutral-800 my-2.5 w-full" />

          {/* Bottom Row: Actions & Send */}
          <div className="flex items-center justify-between w-full">
            {/* Left actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1.5 text-[11.5px] font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors border-0 bg-transparent cursor-pointer rounded-none"
              >
                <Paperclip size={13} className="text-neutral-400" />
                <span className="hidden xs:inline">Attach</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1.5 text-[11.5px] font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors border-0 bg-transparent cursor-pointer rounded-none"
              >
                <ImageIcon size={13} className="text-neutral-400" />
                <span className="hidden xs:inline">Image</span>
              </button>
            </div>

            {/* Right counter & Send */}
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                {input.length}/1000
              </span>
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading || isTranscribing}
                className="flex items-center justify-center w-8 h-8 rounded-full disabled:text-gray-300 disabled:bg-transparent bg-[var(--color-accent)] text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer border-0 shadow-sm"
                title="Send message"
              >
                <Send size={13} className="-ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

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

  // Send message logic
  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim(), status: "sending" };
    const updatedMessages = [...messages, userMsg];
    
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

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
          
          <button 
            onClick={() => setSettingsOpen(true)}
            className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 transition-colors cursor-pointer border-0 bg-transparent shrink-0"
            style={{ minWidth: "44px", minHeight: "44px" }}
            title="Settings"
          >
            <Settings size={18} />
          </button>
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
                  className="flex-1 overflow-y-auto w-full px-4 pt-3 pb-[170px] scroll-smooth"
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
                                      Kamogelo's GPT
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
                              Kamogelo's GPT
                            </span>
                            <div className="flex items-center gap-1.5 text-[var(--text-muted)] py-1.5">
                              <span className="text-[13px] italic">Thinking</span>
                              <span className="inline-block animate-pulse text-[var(--color-accent)]">▍</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Keyboard-Aware Pinned Composer bar - always visible and sticky bottom */}
                <div className="absolute bottom-0 inset-x-0 pt-3 pb-4 px-4 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/95 to-transparent z-10">
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

      {/* Settings Modal Integration */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        accentColor={accentColor}
        setAccentColor={setAccentColor}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />

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
