import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { motion, AnimatePresence } from "motion/react";
import { ProjectCards, SkillChips, DownloadCV } from "./RichComponents";
import { WatermelonIcon } from "./WatermelonIcon";
import { Message, Attachment } from "./ChatInterface";
import { MarkdownRenderer } from "./MarkdownRenderer";
import MenuDrawer from "./MenuDrawer";

const ProjectsPage = lazy(() => import("./ProjectsPage"));
const CvPage = lazy(() => import("./CvPage"));
const ContactPage = lazy(() => import("./ContactPage"));
const ChangelogPage = lazy(() => import("./ChangelogPage"));
const WorkspacePage = lazy(() => import("./WorkspacePage"));

const FallbackLoader = () => (
  <div className="flex w-full h-full items-center justify-center bg-[var(--bg-main)]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
  </div>
);

interface MobileAppProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const TABS = ["chat", "projects", "cv", "contact", "workspace", "changelog"] as const;
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
      return <MaterialIcon name="list" className="text-[var(--color-accent)] text-[16px]" />;
    case "mail":
      return <MaterialIcon name="mail" className="text-[var(--color-accent)] text-[16px]" />;
    case "text":
      return <MaterialIcon name="description" className="text-[var(--color-accent)] text-[16px]" />;
    case "cpu":
      return <MaterialIcon name="memory" className="text-[var(--color-accent)] text-[16px]" />;
    case "sparkles":
      return <MaterialIcon name="auto_awesome" className="text-[var(--color-accent)] text-[16px]" />;
    case "code":
      return <MaterialIcon name="code" className="text-[var(--color-accent)] text-[16px]" />;
    case "user":
      return <MaterialIcon name="person" className="text-[var(--color-accent)] text-[16px]" />;
    case "cap":
      return <MaterialIcon name="school" className="text-[var(--color-accent)] text-[16px]" />;
    case "layers":
      return <MaterialIcon name="layers" className="text-[var(--color-accent)] text-[16px]" />;
    case "database":
      return <MaterialIcon name="storage" className="text-[var(--color-accent)] text-[16px]" />;
    default:
      return <MaterialIcon name="chat" className="text-[var(--color-accent)] text-[16px]" />;
  }
}

export default function MobileApp({
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
        {/* Microphone audio recording removed */}

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
                  <MaterialIcon name="auto_awesome" className="text-[14px] animate-pulse" />
                  <span>Interactive Follow-up Questions</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveClarifications([])}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1 border-0 bg-transparent cursor-pointer flex items-center justify-center"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                  title="Dismiss suggestions"
                >
                  <MaterialIcon name="close" className="text-[16px]" />
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
        <div className="w-full bg-[var(--bg-card)] border border-neutral-200 dark:border-neutral-800 shadow-sm rounded-[32px] focus-within:shadow-[0_6px_20px_rgba(30,142,62,0.06)] focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]/10 transition-all flex flex-col p-4 pb-3.5 relative">
          {/* Top Row: text area */}
          <div className="flex items-start justify-between gap-2.5 w-full min-h-[44px]">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Ask me about math or coding!" 
              className="flex-1 bg-transparent text-[var(--text-main)] py-1.5 px-1 focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 font-normal text-[15px] leading-relaxed max-h-[100px] overflow-y-auto border-0"
              disabled={isLoading}
              rows={2}
            />
          </div>

          {/* Bottom Row: Actions & Send in DeepSeek Style */}
          <div className="flex items-center justify-between mt-2.5 px-1 w-full gap-2 select-none">
            {/* Thinking Mode Toggle button */}
            <button
              type="button"
              onClick={() => {
                if (setSelectedModel) {
                  setSelectedModel(selectedModel === "fusion" ? "MiniMaxAI/MiniMax-M3:preferred" : "fusion");
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold transition-all duration-200 border cursor-pointer shrink-0 min-h-[44px]"
              style={{
                backgroundColor: selectedModel === "fusion" ? "var(--color-accent-light)" : "transparent",
                borderColor: selectedModel === "fusion" ? "var(--color-accent)" : "transparent",
                color: selectedModel === "fusion" ? "var(--color-accent)" : "var(--text-muted)"
              }}
              title={selectedModel === "fusion" ? "Thinking Mode Active" : "Enable Thinking Mode for advanced responses"}
            >
              <MaterialIcon name="psychology" className={`text-[16px] ${selectedModel === "fusion" ? "animate-pulse" : ""}`} />
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
              <span className="text-[11px] text-[var(--text-muted)] font-mono hidden sm:inline select-none pr-1">
                {input.length}/1000
              </span>

              {/* Send button (Enlarged for Mobile Touch Targets) */}
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
                  input.trim() && !isLoading
                    ? "border-transparent bg-[var(--color-accent)] text-white hover:opacity-90 active:scale-95 shadow-sm"
                    : "border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/30 text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
                }`}
                style={{ minWidth: "44px", minHeight: "44px" }}
                title="Send message"
              >
                <MaterialIcon name="send" className="text-[18px]" />
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

  // Recording Logic removed

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
              className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--text-muted)] cursor-pointer border-0 bg-transparent shrink-0"
              style={{ minWidth: "44px", minHeight: "44px" }}
              title="Menu"
            >
              <MaterialIcon name="menu" className="text-[24px]" />
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
                                className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-main)] font-semibold transition-colors bg-transparent border-0 cursor-pointer p-2.5 min-h-[44px]"
                              >
                                <MaterialIcon name="refresh" className="text-[14px]" />
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
                                                <MaterialIcon name="description" className="text-[14px] text-[var(--color-accent)] shrink-0" />
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
                                    className="mt-1 text-red-500 flex items-center gap-1 text-[11px] bg-transparent border-0 min-h-[44px]"
                                  >
                                    <MaterialIcon name="error" className="text-[14px] text-red-500 mr-1" /> Retry
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
                                      Kamogelo Mosiah
                                    </span>
                                  )}
                                  <div className="text-[14px] leading-relaxed text-[var(--text-main)] w-full">
                                    <MarkdownRenderer content={msg.text} />
                                  </div>

                                  <div className="flex flex-wrap gap-1.5 mt-2 mb-1 select-none">
                                    <button
                                      onClick={() => handleSend("Tell me about your software projects")}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 hover:bg-[var(--color-accent-light)] dark:bg-neutral-800 dark:hover:bg-[var(--color-accent-light)] text-neutral-700 dark:text-neutral-300 hover:text-[var(--color-accent)] dark:hover:text-[var(--color-accent)] border border-neutral-200/60 dark:border-neutral-700/60 hover:border-[var(--color-accent)]/30 transition-all duration-150 cursor-pointer shadow-sm"
                                    >
                                      <span>📂 View Projects</span>
                                    </button>
                                    <button
                                      onClick={() => handleSend("What are your core technical skills?")}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 hover:bg-[var(--color-accent-light)] dark:bg-neutral-800 dark:hover:bg-[var(--color-accent-light)] text-neutral-700 dark:text-neutral-300 hover:text-[var(--color-accent)] dark:hover:text-[var(--color-accent)] border border-neutral-200/60 dark:border-neutral-700/60 hover:border-[var(--color-accent)]/30 transition-all duration-150 cursor-pointer shadow-sm"
                                    >
                                      <span>🛠️ Check Skills</span>
                                    </button>
                                    <button
                                      onClick={() => handleSend("Can I see your CV / Resume?")}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 hover:bg-[var(--color-accent-light)] dark:bg-neutral-800 dark:hover:bg-[var(--color-accent-light)] text-neutral-700 dark:text-neutral-300 hover:text-[var(--color-accent)] dark:hover:text-[var(--color-accent)] border border-neutral-200/60 dark:border-neutral-700/60 hover:border-[var(--color-accent)]/30 transition-all duration-150 cursor-pointer shadow-sm"
                                    >
                                      <span>📄 Download CV</span>
                                    </button>
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
                              Kamogelo Mosiah
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
              <Suspense fallback={<FallbackLoader />}>
                <ProjectsPage 
                  onBackToChat={() => handleTabChange("chat")} 
                  onToggleDrawer={() => setDrawerOpen(true)}
                />
              </Suspense>
            )}

            {activeTab === "cv" && (
              <Suspense fallback={<FallbackLoader />}>
                <CvPage 
                  onBackToChat={() => handleTabChange("chat")} 
                  onToggleDrawer={() => setDrawerOpen(true)}
                />
              </Suspense>
            )}

            {activeTab === "contact" && (
              <Suspense fallback={<FallbackLoader />}>
                <ContactPage 
                  onBackToChat={() => handleTabChange("chat")} 
                  onToggleDrawer={() => setDrawerOpen(true)}
                />
              </Suspense>
            )}

            {activeTab === "workspace" && (
              <Suspense fallback={<FallbackLoader />}>
                <WorkspacePage 
                  onBackToChat={() => handleTabChange("chat")} 
                  onToggleDrawer={() => setDrawerOpen(true)}
                />
              </Suspense>
            )}

            {activeTab === "changelog" && (
              <Suspense fallback={<FallbackLoader />}>
                <ChangelogPage 
                  onBackToChat={() => handleTabChange("chat")} 
                  onToggleDrawer={() => setDrawerOpen(true)}
                />
              </Suspense>
            )}
          </motion.div>
        </AnimatePresence>
      </main>



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
