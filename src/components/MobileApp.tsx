import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { motion, AnimatePresence } from "motion/react";
import { ProjectCards, SkillChips, DownloadCV } from "./RichComponents";
import { AppIcon } from "./AppIcon";
import { Message, Attachment } from "./ChatInterface";
import { AIMessage } from "./chat/AIMessage";
import MenuDrawer from "./MenuDrawer";
import { router } from "../lib/modelRouter";

const ProjectsPage = lazy(() => import("./ProjectsPage"));
const CvPage = lazy(() => import("./CvPage"));
const ContactPage = lazy(() => import("./ContactPage"));
const ChangelogPage = lazy(() => import("./ChangelogPage"));
const ActionPlanner = lazy(() => import("./ActionPlanner").then(module => ({ default: module.ActionPlanner })));
const SupportAssistant = lazy(() => import("./SupportAssistant/SupportAssistant").then(module => ({ default: module.SupportAssistant })));

const FallbackLoader = () => (
  <div className="flex w-full h-full items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
  </div>
);

interface MobileAppProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  llmStatus?: any;
  isLargeReady?: boolean;
}

const TABS = ["chat", "projects", "cv", "contact", "changelog", "planner", "support"] as const;
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
      return <MaterialIcon name="list" className="text-primary text-title-medium" />;
    case "mail":
      return <MaterialIcon name="mail" className="text-primary text-title-medium" />;
    case "text":
      return <MaterialIcon name="description" className="text-primary text-title-medium" />;
    case "cpu":
      return <MaterialIcon name="memory" className="text-primary text-title-medium" />;
    case "sparkles":
      return <MaterialIcon name="auto_awesome" className="text-primary text-title-medium" />;
    case "code":
      return <MaterialIcon name="code" className="text-primary text-title-medium" />;
    case "user":
      return <MaterialIcon name="person" className="text-primary text-title-medium" />;
    case "cap":
      return <MaterialIcon name="school" className="text-primary text-title-medium" />;
    case "layers":
      return <MaterialIcon name="layers" className="text-primary text-title-medium" />;
    case "database":
      return <MaterialIcon name="storage" className="text-primary text-title-medium" />;
    default:
      return <MaterialIcon name="chat" className="text-primary text-title-medium" />;
  }
}

import { SettingsModal } from './SettingsModal';

export default function MobileApp({
  selectedModel,
  setSelectedModel,
  messages,
  setMessages,
  llmStatus,
  isLargeReady
}: MobileAppProps) {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [direction, setDirection] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [input, setInput] = useState("");
  const [promptSetIndex, setPromptSetIndex] = useState(0);
  const [introStage, setIntroStage] = useState<"initial" | "options">("initial");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastScrollY = useRef(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isHfConnected, setIsHfConnected] = useState<boolean | null>(null);

  const [aiEngine, setAiEngine] = useState<"cloud" | "local">("cloud");
  const [localStatus, setLocalStatus] = useState(() => router.getStatus());
  const [localInitialized, setLocalInitialized] = useState(router.initialized);
  const [localLoading, setLocalLoading] = useState(router.loadingInProcess);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    let active = true;
    const tick = () => {
      if (!active) return;
      setLocalStatus(router.getStatus());
      setLocalInitialized(router.initialized);
      setLocalLoading(router.loadingInProcess);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      active = false;
    };
  }, []);

  const isGenerating = messages.some(m => m.status === 'loading' || m.status === 'streaming');

  // Tap and hold voice recording state for mobile
  const supportSpeechRecognition = typeof window !== 'undefined' && (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition || !!(navigator?.mediaDevices?.getUserMedia));
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");
  const [interimSpeech, setInterimSpeech] = useState("");
  const finalSpeechRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    setInterimSpeech("");
    finalSpeechRef.current = "";
    
    // Try Web Speech API first if supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsRecording(true);
          setRecordingStatus("Listening... Speak now");
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          const spoken = finalTranscript || interimTranscript;
          if (spoken) {
            setInterimSpeech(spoken);
            finalSpeechRef.current = spoken;
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setRecordingStatus("Speech error: " + event.error);
          setTimeout(() => setRecordingStatus(""), 3000);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
          setRecordingStatus("");
        };

        recognition.start();
        return;
      } catch (e) {
        console.warn("SpeechRecognition failed, falling back to MediaRecorder", e);
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        setRecordingStatus("Transcribing via Hugging Face...");
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'speech.webm');

          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (data.text) {
            setInput(prev => (prev ? prev + " " + data.text : data.text));
          } else if (data.error) {
            console.error("Transcription error:", data.error);
            setRecordingStatus("Transcription note: " + data.error);
            setTimeout(() => setRecordingStatus(""), 4000);
          }
        } catch (err) {
          console.error("Transcription request failed:", err);
          setRecordingStatus("Network error during transcription.");
          setTimeout(() => setRecordingStatus(""), 3000);
        } finally {
          setRecordingStatus("");
          setIsRecording(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStatus("Listening... Release to transcribe");
    } catch (err) {
      console.error("Microphone access denied or unavailable:", err);
      setRecordingStatus("Microphone access denied. Please check permissions.");
      setTimeout(() => setRecordingStatus(""), 4000);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
      if (finalSpeechRef.current) {
         setInput(prev => (prev ? prev + " " + finalSpeechRef.current : finalSpeechRef.current));
      }
      setInterimSpeech("");
      setIsRecording(false);
      setRecordingStatus("");
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getTabIndex = (tab: TabType) => TABS.indexOf(tab);

  const handleTabChange = (newTab: TabType) => {
    const currentIndex = getTabIndex(activeTab);
    const newIndex = getTabIndex(newTab);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    lastScrollY.current = scrollTop;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  };

  const [activeClarifications, setActiveClarifications] = useState<string[]>([]);
  const scrolledToTopMsgIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "agent") {
      if ((lastMsg.status === "streaming" || lastMsg.status === "sent") && !scrolledToTopMsgIds.current.has(lastMsg.id)) {
        scrolledToTopMsgIds.current.add(lastMsg.id);
        setTimeout(() => {
          const el = document.getElementById(`msg-${lastMsg.id}`);
          if (el && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: el.offsetTop - 16,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    }
  }, [messages]);

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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 100;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
      textareaRef.current.scrollTop = 0;
    }
  }, [input]);

  const handleInputFocus = () => {
    if (introStage !== "options") {
      setIntroStage("options");
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: "user", 
      text: text.trim(), 
      status: "sending"
    };
    const agentMsgId = (Date.now() + 1).toString();
    const initialAgentMsg: Message = {
      id: agentMsgId,
      role: "agent",
      text: "",
      status: "loading"
    };

    const updatedMessages = [...messages, userMsg, initialAgentMsg];
    
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setActiveClarifications([]);

    // Scroll to the top of the response (do not force scroll to bottom)
    setTimeout(() => {
      const el = document.getElementById(`msg-${agentMsgId}`);
      if (el && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: el.offsetTop - 16,
          behavior: 'smooth'
        });
      }
    }, 50);

    try {
      const history = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          history, 
          message: text.trim(), 
          model: selectedModel === "large" ? "fusion" : "swift" 
        }),
      });
      
      const data = await res.json();
      let replyText = data.text || data.generated || "Sorry, I had trouble processing that.";
      let uiBlock: Message["uiBlock"] = null;

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

      setMessages(prev => prev.map(m => {
        if (m.id === userMsg.id) return { ...m, status: "sent" as const };
        if (m.id === agentMsgId) return { ...m, status: "streaming" as const, text: replyText, uiBlock };
        return m;
      }));

      if (followUps.length > 0) {
        setActiveClarifications(followUps);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(m => {
        if (m.id === userMsg.id) return { ...m, status: "error" as const };
        if (m.id === agentMsgId) return { ...m, status: "error" as const, text: "An error occurred." };
        return m;
      }));
      setIsLoading(false);
    }
  };

  const renderComposer = (isFixed: boolean) => {
    return (
      <div className={`${isFixed ? 'w-full' : 'w-full mt-4'} relative flex flex-col items-center pointer-events-auto`}>
        {/* Recording status banner */}
        <AnimatePresence>
          {(recordingStatus || interimSpeech) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="w-full bg-rose-500/10 border-2 border-rose-500/30 text-rose-600 dark:text-rose-400 px-4 py-1.5 rounded-2xl mb-2 text-center text-label-medium font-medium flex items-center justify-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>{interimSpeech ? interimSpeech : recordingStatus}</span>
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
              className="w-full bg-surface border-2 border-primary/20 shadow-lg p-3 mb-2.5 rounded-2xl relative z-30 text-left"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1 text-primary font-semibold text-label-medium sm:text-body-small">
                  <MaterialIcon name="auto_awesome" className="text-body-medium animate-pulse" />
                  <span>Interactive Follow-up Questions</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveClarifications([])}
                  className="text-on-surface-variant hover:text-on-surface transition-colors p-1 border-0 bg-transparent cursor-pointer flex items-center justify-center rounded-2xl"
                  style={{ minWidth: "44px", minHeight: "44px" }}
                  title="Dismiss suggestions"
                >
                  <MaterialIcon name="close" className="text-title-medium" />
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
                    className="w-full text-left px-4 py-1.5 text-label-medium font-normal text-on-background bg-surface-container-low hover:bg-primary-container hover:text-primary border-2 border-outline-variant/80 hover:border-primary/30 rounded-2xl transition-all active:scale-[0.99] cursor-pointer"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input box with minimalistic ChatGPT styling */}
        <div className="w-full bg-surface-container-low rounded-3xl focus-within:ring-2 focus-within:ring-primary/50 transition-all flex items-end p-2 pb-2 relative border border-outline-variant/30 shadow-sm mx-4 mb-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={handleInputFocus}
            placeholder="Message Kamo's AI..." 
            className="flex-1 bg-transparent text-on-background py-2.5 px-4 focus:outline-none resize-none placeholder:text-on-surface-variant font-normal text-body-large leading-relaxed border-0 max-h-[200px]"
            disabled={isLoading || isGenerating}
            rows={1}
            style={{ minHeight: "44px" }}
          />

          {/* Right side: Mic and Send */}
          <div className="flex gap-1.5 pb-1 pr-1 shrink-0">
            {supportSpeechRecognition && (
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isLoading || isGenerating}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-0 cursor-pointer ${
                  isRecording
                    ? "bg-rose-500 text-white animate-pulse shadow-md"
                    : "bg-surface-alt text-on-surface hover:bg-surface-container-highest"
                }`}
                title={isRecording ? "Stop Recording" : "Start Voice Input"}
              >
                <MaterialIcon
                  name={isRecording ? "stop" : "mic"}
                  className="text-body-large"
                />
              </button>
            )}

            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading || isGenerating}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border-0 ${
                input.trim() && !isLoading && !isGenerating
                  ? "bg-primary text-on-primary hover:opacity-90 shadow-sm"
                  : "bg-surface-alt text-on-surface-variant opacity-50 cursor-not-allowed"
              }`}
            >
              <MaterialIcon name={isLoading || isGenerating ? "more_horiz" : "arrow_upward"} className="text-title-medium" />
            </button>
          </div>
        </div>
        {/* Footer info */}
        <div className="w-full flex items-center justify-between mt-1.5 px-4 select-none text-[10px]">
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
            <span className="font-normal text-on-surface-variant font-mono">
              {isHfConnected === null ? "Connecting..." : isHfConnected ? "Server: Connected" : "Mode: Offline"}
            </span>
          </div>

          <span className="text-[10px] text-on-surface-variant font-normal">
            Assistant can make mistakes.
          </span>
        </div>
      </div>
    );
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
    <div className="flex flex-col h-dvh w-full bg-background text-on-background font-sans select-none overflow-hidden relative">
      
      {/* Screen Container with Swipe-Style Tab Transitions */}
      <main className="flex-1 w-full overflow-hidden relative bg-background">
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
                
                {/* Pinned Top Header Bar */}
                <div className="h-16 shrink-0 border-b-2 border-outline-variant bg-surface flex items-center justify-between px-4 z-20">
                  {/* Menu icon on the left on its own */}
                  <div className="flex items-center">
                    <button
                      onClick={() => setDrawerOpen(true)}
                      className="w-11 h-11 rounded-full bg-surface border-2 border-outline-variant shadow-sm flex items-center justify-center text-on-surface hover:bg-surface-container transition-all cursor-pointer"
                      style={{ minWidth: "44px", minHeight: "44px" }}
                      title="Open Navigation Menu"
                    >
                      <MaterialIcon name="menu" className="text-title-medium" />
                    </button>
                  </div>

                  {/* Quick Selections pushed to the right */}
                  <div className="toggle-group items-center flex gap-1">
                    <button
                      onClick={() => handleTabChange("planner")}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 font-semibold text-xs transition-all cursor-pointer border-0 inactive hidden sm:inline-flex`}
                    >
                      <MaterialIcon name="event_note" className="text-body-medium text-primary" />
                      <span className="text-primary font-bold">Planner</span>
                    </button>
                    <div className="w-px h-4 bg-outline-variant/50 mx-1 hidden sm:block"></div>
                    <button
                      onClick={() => handleTabChange("cv")}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 font-semibold text-xs transition-all cursor-pointer border-0 inactive hidden sm:inline-flex`}
                    >
                      <MaterialIcon name="description" className="text-body-medium" />
                      <span>CV</span>
                    </button>
                    
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="w-10 h-10 rounded-full bg-surface border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container transition-all cursor-pointer shrink-0 ml-2"
                      title="Settings"
                    >
                      <MaterialIcon name="settings" className="text-title-medium" />
                    </button>
                  </div>
                </div>





                {/* Scrollable Conversation Block */}
                <div 
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto w-full px-4 pt-4 pb-4 scroll-smooth"
                  onScroll={handleScroll}
                >
                  {isInitialState ? (
                    <div className="flex flex-col text-left w-full py-6 px-4 min-h-[280px] justify-center">
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
                            <div className="mb-5">
                              <h1 className="text-[30px] font-bold tracking-tight text-on-background mb-0.5 leading-none font-display">
                                Hi there, <span className="bg-gradient-to-r from-[var(--color-accent)] to-[#C084FC] bg-clip-text text-transparent font-display">I'm Kamo's AI</span>
                              </h1>
                              <h2 className="text-[24px] font-bold tracking-tight text-[#4F46E5] mb-3 leading-tight font-display">
                                Welcome to my Professional Portfolio
                              </h2>
                              <p className="text-on-surface-variant text-body-medium font-normal leading-relaxed mb-5">
                                I am Kamo's custom GPT assistant. Explore Kamo's software engineering projects, technical skills, coursework, and achievements. Tap the quick links below to see his CV or live projects list!
                              </p>
                              <div className="flex flex-wrap gap-2.5 select-none">
                                <button
                                  onClick={() => handleTabChange("cv")}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary font-semibold text-body-medium hover:opacity-90 shadow-md border-0 transition-opacity cursor-pointer min-h-[44px]"
                                >
                                  <MaterialIcon name="description" className="text-body-medium" />
                                  <span>View CV</span>
                                </button>
                                <button
                                  onClick={() => handleTabChange("projects")}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container-high border-2 border-outline-variant text-on-surface hover:bg-surface-container-highest font-semibold text-body-medium transition-all cursor-pointer min-h-[44px]"
                                >
                                  <MaterialIcon name="code" className="text-body-medium" />
                                  <span>Explore Projects</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="options"
                            initial={{ opacity: 0, scale: 0.98, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col text-left w-full"
                          >
                            <div className="mb-2.5">
                              <p className="text-on-surface-variant text-[11px] font-normal uppercase tracking-wider">
                                Quick Suggestions
                              </p>
                            </div>

                            <div className="flex flex-col gap-2.5 w-full">
                              {PROMPT_SETS[promptSetIndex].slice(0, 3).map((prompt, idx) => (
                                <motion.button
                                  key={idx}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                                  onClick={() => handleSend(prompt.text)}
                                  className="suggestion-btn flex items-center gap-3 p-3 text-left min-h-[54px] cursor-pointer"
                                >
                                  <div className="shrink-0 w-7 h-7 rounded-xl bg-primary-container flex items-center justify-center">
                                    {renderPromptIcon(prompt.icon)}
                                  </div>
                                  <span className="text-[12.5px] text-on-background font-normal leading-tight line-clamp-2">
                                    {prompt.text}
                                  </span>
                                </motion.button>
                              ))}
                            </div>

                            <div className="mt-3.5 flex justify-start mb-6">
                              <button
                                onClick={() => setPromptSetIndex((prev) => (prev + 1) % PROMPT_SETS.length)}
                                className="flex items-center gap-1.5 text-label-medium text-on-surface-variant hover:text-on-background font-normal transition-colors bg-transparent border-0 cursor-pointer p-2.5 min-h-[44px]"
                              >
                                <MaterialIcon name="refresh" className="text-body-medium" />
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
                            id={`msg-${msg.id}`}
                            key={msg.id} 
                            className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                          >
                            {isUser ? (
                              <div className="flex flex-col items-end max-w-[85%]">
                                <div 
                                  className="text-on-surface px-5 py-3 rounded-3xl rounded-tr-sm bg-surface-container-high max-w-xl shadow-sm"
                                >
                                  <p className="text-body-medium whitespace-pre-wrap font-normal leading-relaxed break-words">
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
                                                className="max-w-full max-h-[130px] object-cover rounded-2xl border-2 border-black/10 shadow-sm" 
                                                referrerPolicy="no-referrer"
                                              />
                                            ) : (
                                              <div className="flex items-center gap-2 px-4 py-1.5 bg-surface/60 border-2 border-black/5 rounded-2xl select-none text-left">
                                                <MaterialIcon name="description" className="text-body-medium text-primary shrink-0" />
                                                <div className="flex flex-col min-w-0">
                                                  <span className="text-label-small font-normal text-on-surface truncate max-w-[120px]">{attachment.name}</span>
                                                  <span className="text-[9px] text-on-surface-variant font-mono leading-none mt-0.5">{(attachment.size / 1024).toFixed(1)} KB</span>
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
                                    className="mt-1 text-red-500 flex items-center gap-1 text-label-small font-normal bg-transparent border-0 min-h-[44px]"
                                  >
                                    <MaterialIcon name="error" className="text-body-medium text-red-500 mr-1" /> Retry
                                  </button>
                                )}
                              </div>
                            ) : (
                              <AIMessage
                                msg={msg}
                                isFirstInGroup={isFirst}
                                onStreamingComplete={(id) => {
                                  setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "sent" } : m));
                                }}
                                renderUIBlock={(uiBlock) => (
                                  <>
                                    <div className="flex flex-wrap gap-1.5 mt-2 mb-1 select-none">
                                      <button
                                        onClick={() => handleSend("Tell me about your software projects")}
                                        className="flex items-center gap-1 px-4 py-1 rounded-full text-label-small font-normal bg-surface-container hover:bg-surface-container-highest text-on-surface hover:text-primary border-2 border-outline-variant transition-all duration-150 cursor-pointer shadow-sm"
                                      >
                                        <span>📂 View Projects</span>
                                      </button>
                                      <button
                                        onClick={() => handleSend("What are your core technical skills?")}
                                        className="flex items-center gap-1 px-4 py-1 rounded-full text-label-small font-normal bg-surface-container hover:bg-surface-container-highest text-on-surface hover:text-primary border-2 border-outline-variant transition-all duration-150 cursor-pointer shadow-sm"
                                      >
                                        <span>🛠️ Check Skills</span>
                                      </button>
                                      <button
                                        onClick={() => handleSend("Can I see your CV / Resume?")}
                                        className="flex items-center gap-1 px-4 py-1 rounded-full text-label-small font-normal bg-surface-container hover:bg-surface-container-highest text-on-surface hover:text-primary border-2 border-outline-variant transition-all duration-150 cursor-pointer shadow-sm"
                                      >
                                        <span>📄 Download CV</span>
                                      </button>
                                    </div>
                                    {uiBlock === "projects" && <ProjectCards />}
                                    {uiBlock === "skills" && <SkillChips />}
                                    {uiBlock === "cv" && <DownloadCV onViewCv={() => handleTabChange("cv")} />}
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

                {/* Mobile Composer */}
                <div className="w-full pt-3 pb-4 px-4 shrink-0 bg-background z-10 border-t-2 border-outline-variant relative">
                  {/* Floating scroll down button */}
                  {!isAtBottom && (
                    <div className="absolute top-0 left-0 right-0 -translate-y-full flex justify-center pointer-events-none z-20 pb-3">
                      <button
                        onClick={() => scrollToBottom()}
                        className="pointer-events-auto flex items-center justify-center w-8 h-8 bg-surface border-2 border-outline-variant rounded-full shadow-md text-primary hover:bg-surface-container-high transition-all"
                      >
                        <MaterialIcon name="arrow_downward" className="text-body-small" />
                      </button>
                    </div>
                  )}
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



            {activeTab === "planner" && (
              <Suspense fallback={<FallbackLoader />}>
                <ActionPlanner 
                  onBackToChat={() => handleTabChange("chat")} 
                  onToggleDrawer={() => setDrawerOpen(true)}
                />
              </Suspense>
            )}

            {activeTab === "support" && (
              <Suspense fallback={<FallbackLoader />}>
                <SupportAssistant />
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

      <MenuDrawer
        currentTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab)}
        isOpen={drawerOpen}
        onToggle={() => setDrawerOpen(!drawerOpen)}
      />
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />
    </div>
  );
}
