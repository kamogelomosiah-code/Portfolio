import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Sparkles, Settings, Mic, User, Mail, 
  GraduationCap, FileText, MessageSquare, AlertCircle, 
  Code2, Download, Phone, MapPin, Globe, ExternalLink, Github, Menu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectCards, SkillChips, DownloadCV } from "./RichComponents";
import { WatermelonIcon } from "./WatermelonIcon";
import { Message } from "./ChatInterface";
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
        x: { type: "spring", stiffness: 350, damping: 32 },
        opacity: { duration: 0.15 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 350, damping: 32 },
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
                  className="flex-1 overflow-y-auto w-full px-4 pt-3 pb-[140px] scroll-smooth"
                >
                  {isInitialState ? (
                    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
                      <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-main)] mb-2 leading-tight">
                        Kamogelo's Assistant
                      </h1>
                      <p className="text-[var(--text-muted)] text-[14px] leading-relaxed max-w-sm">
                        Hello! Ask me anything about his qualifications, projects, or background.
                      </p>

                      {/* Touch Friendly Action Buttons */}
                      <div className="flex flex-col gap-2.5 w-full max-w-xs mt-8">
                        <button 
                          onClick={() => handleSend("Can you tell me about yourself?")} 
                          className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-light)] p-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-white/5 dark:active:bg-white/10 transition-all text-left border-0 cursor-pointer text-[13.5px] font-medium"
                          style={{ minHeight: "48px" }}
                        >
                          <User size={16} className="text-[var(--color-accent)] shrink-0" />
                          <span className="flex-1">Tell me about Kamogelo</span>
                        </button>

                        <button 
                          onClick={() => handleSend("Show me some of your live projects!")} 
                          className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-light)] p-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-white/5 dark:active:bg-white/10 transition-all text-left border-0 cursor-pointer text-[13.5px] font-medium"
                          style={{ minHeight: "48px" }}
                        >
                          <Code2 size={16} className="text-[var(--color-accent)] shrink-0" />
                          <span className="flex-1">Show his live projects</span>
                        </button>

                        <button 
                          onClick={() => handleSend("How can I contact you?")} 
                          className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-light)] p-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-white/5 dark:active:bg-white/10 transition-all text-left border-0 cursor-pointer text-[13.5px] font-medium"
                          style={{ minHeight: "48px" }}
                        >
                          <Mail size={16} className="text-[var(--color-accent)] shrink-0" />
                          <span className="flex-1">How can I contact him?</span>
                        </button>
                      </div>
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
                                  <div className="text-[14px] leading-relaxed whitespace-pre-wrap break-words text-[var(--text-main)]">
                                    {msg.text}
                                  </div>
                                  
                                  {msg.uiBlock && (
                                    <div className="mt-3 w-full">
                                      {msg.uiBlock === "projects" && <ProjectCards />}
                                      {msg.uiBlock === "skills" && <SkillChips />}
                                      {msg.uiBlock === "cv" && <DownloadCV />}
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

                {/* Keyboard-Aware Pinned Composer bar */}
                <div className="absolute bottom-0 inset-x-0 pt-3 pb-4 px-4 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/95 to-transparent z-10">
                  <div className="w-full relative flex flex-col items-center">
                    
                    {/* Audio recording Overlay */}
                    <AnimatePresence>
                      {isRecording && (
                        <motion.div 
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 15 }}
                          className="absolute inset-x-0 bottom-full mb-3 z-20 bg-[var(--bg-card)] border border-[var(--color-accent)]/30 rounded-2xl flex items-center justify-center p-5 shadow-lg"
                          onPointerUp={stopRecording}
                          onTouchEnd={stopRecording}
                        >
                          <div className="absolute inset-0 bg-[var(--color-accent-light)] animate-pulse rounded-2xl"></div>
                          <div className="flex flex-col items-center gap-2 z-10">
                            <div className="w-12 h-12 bg-[var(--color-accent)] rounded-full flex items-center justify-center animate-bounce">
                              <Mic size={22} className="text-white" />
                            </div>
                            <span className="font-semibold text-[12px]">Listening... Release to transcribe</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Chat Input Field */}
                    <div className="w-full bg-[var(--bg-card)] border border-gray-300 dark:border-neutral-700 rounded-2xl flex items-center pl-3.5 pr-1.5 py-1.5 shadow-sm">
                      {isTranscribing ? (
                        <div className="flex-1 py-2 flex items-center gap-2 text-[var(--color-accent)] text-[13.5px] font-semibold">
                          <svg className="animate-spin h-4 w-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                          <span>Transcribing audio...</span>
                        </div>
                      ) : (
                        <textarea
                          ref={textareaRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onFocus={handleInputFocus}
                          placeholder="Type a message..."
                          rows={1}
                          className="flex-1 bg-transparent text-[var(--text-main)] focus:outline-none resize-none placeholder:text-[var(--text-muted)] text-[14.5px] leading-relaxed max-h-[100px] py-1.5 overflow-y-auto"
                        />
                      )}

                      <div className="flex items-center ml-1">
                        <button
                          onPointerDown={(e) => { e.preventDefault(); startRecording(); }}
                          className="flex items-center justify-center w-11 h-11 rounded-full text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer select-none border-0 bg-transparent shrink-0"
                          style={{ minWidth: "44px", minHeight: "44px" }}
                        >
                          <Mic size={18} />
                        </button>

                        <button
                          onClick={() => handleSend(input)}
                          disabled={!input.trim() || isLoading || isTranscribing}
                          className="flex items-center justify-center w-11 h-11 rounded-full disabled:bg-transparent bg-[var(--color-accent)] text-white hover:opacity-90 disabled:text-gray-300 transition-all cursor-pointer border-0 shrink-0 shadow-sm ml-1 active:scale-95"
                          style={{ minWidth: "44px", minHeight: "44px" }}
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
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
