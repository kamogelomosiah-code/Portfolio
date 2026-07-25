import React, { useState, useRef, useEffect, UIEvent } from "react";
import { 
  Send, Sparkles, Mic, Link as LinkIcon, User, Mail, 
  GraduationCap, FileText, Menu, MessageSquare, PlusCircle, X, 
  AlertCircle, ChevronRight, CornerDownLeft, Plus,
  List, Cpu, RotateCw, Paperclip, ChevronDown, Zap,
  Image as ImageIcon, Database, Layers, Code2, Brain, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectCards, SkillChips, DownloadCV } from "./RichComponents";
import { AppIcon } from "./AppIcon";
import { AIMessage } from "./chat/AIMessage";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MaterialIcon } from "./MaterialIcon";
import { initAuth, googleSignIn, logout, getAccessToken } from "../lib/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { router } from "../lib/modelRouter";

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
  status?: "sending" | "sent" | "error" | "loading" | "streaming";
  attachments?: Attachment[];
  meta?: {
    engine?: string;
    model?: string;
    status?: string;
  };
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
  selectedModel = "tiny",
  setSelectedModel,
  onToggleDrawer,
  messages,
  setMessages,
  onViewCv,
  onViewProjects,
  llmStatus,
  isLargeReady
}: { 
  selectedModel?: string,
  setSelectedModel?: (model: string) => void,
  onToggleDrawer?: () => void,
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  onViewCv?: () => void,
  onViewProjects?: () => void,
  llmStatus?: any,
  isLargeReady?: boolean
}) {
  const [input, setInput] = useState("");
  const [promptSetIndex, setPromptSetIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [introStage, setIntroStage] = useState<"initial" | "options">("initial");
  const [isHfConnected, setIsHfConnected] = useState<boolean | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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

  // Tap and hold voice recording state
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

    // Fallback to MediaRecorder + Hugging Face /api/transcribe
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

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastScrollY = useRef(0);

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

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    if (messages.length <= 1) {
      scrollToBottom('auto');
    }
  }, []);

  useEffect(() => {
    if (!scrollContentRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        const isStreaming = messages.some(m => m.status === 'streaming' || m.status === 'loading');
        if (isNearBottom && !isStreaming) {
          // Do not auto jump during generation per requirements
        }
      }
    });

    resizeObserver.observe(scrollContentRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 140;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
      textareaRef.current.scrollTop = 0;
    }
  }, [input]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setIsScrolled(scrollTop > 20);
    lastScrollY.current = scrollTop;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
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

      const token = await getAccessToken();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
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

  const isInitialState = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#08080c] w-full font-sans antialiased text-white">
      {/* Header */}
      <div className="h-[72px] px-6 sm:px-8 flex justify-between items-center shrink-0 shadow-sm bg-[#08080c] z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A90E2] to-[#00B4D8] flex items-center justify-center text-white font-bold text-lg shadow-md">
            K
          </div>
          <div>
            <div className="font-bold text-lg text-white leading-tight">Kamogelo</div>
            <div className={`text-xs font-medium flex items-center gap-1.5 ${isHfConnected === null ? "text-amber-400" : isHfConnected ? "text-emerald-400" : "text-rose-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor] ${isHfConnected === null ? "bg-amber-400" : isHfConnected ? "bg-emerald-400" : "bg-rose-400"}`} />
              {isHfConnected === null ? "Checking Server..." : isHfConnected ? "Server Connected" : "Offline Mode"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {onViewCv && (
            <button onClick={onViewCv} className="hidden sm:flex items-center gap-2 bg-[#4A90E2]/10 hover:bg-[#4A90E2]/20 text-[#4A90E2] px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-sm">
              <FileText size={16} />
              <span>Download CV</span>
            </button>
          )}
          <button 
            onClick={() => setShowSettingsModal(true)} 
            className="flex items-center gap-2 bg-[#13131c] hover:bg-[#1a1a28] text-gray-300 hover:text-white px-3.5 py-2 rounded-xl font-medium text-sm transition-all shadow-sm"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </div>
      
      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-end" onClick={() => setShowSettingsModal(false)}>
          <motion.div 
            initial={{ x: "100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="bg-[#12121a] h-full w-full max-w-sm shadow-2xl p-6 flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-xl font-bold text-white">Settings</h4>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-8">
              <h5 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Thinking Mode</h5>
              <button
                onClick={() => {
                  if (setSelectedModel && isLargeReady !== false) {
                    setSelectedModel(selectedModel === "large" ? "tiny" : "large");
                  }
                }}
                disabled={isLargeReady === false}
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium border flex items-center justify-between transition-colors ${selectedModel === "large" ? "bg-[#4A90E2]/10 text-[#4A90E2] border-[#4A90E2]/50" : "bg-black/30 text-gray-300 border-transparent hover:bg-black/50"} ${isLargeReady === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span>Enable Thinking {isLargeReady === false ? "(not ready)" : ""}</span>
                {selectedModel === "large" && <MaterialIcon name="check" className="text-[#4A90E2]" />}
              </button>
            </div>

            <div>
              <h5 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">AI Engine</h5>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setAiEngine("cloud")}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${aiEngine === "cloud" ? "bg-[#4A90E2]/10 text-[#4A90E2] border-[#4A90E2]/50" : "bg-black/30 text-gray-300 border-transparent hover:bg-black/50"}`}
                >
                  Cloud Core
                </button>
                <button
                  onClick={() => setAiEngine("local")}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${aiEngine === "local" ? "bg-[#4A90E2]/10 text-[#4A90E2] border-[#4A90E2]/50" : "bg-black/30 text-gray-300 border-transparent hover:bg-black/50"}`}
                >
                  Local WebAI
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Conversation Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0 bg-[#08080c] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#12121c] via-[#08080c] to-[#08080c]">

        {/* Scrollable chat body */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto w-full flex flex-col relative scroll-smooth z-10"
          onScroll={handleScroll}
        >
          <div ref={scrollContentRef} className="w-full max-w-[850px] mx-auto flex flex-col px-4 sm:px-6 pt-10 pb-12 min-h-full">
            
            {isInitialState ? (
              <div className="flex flex-col items-center justify-center text-center w-full max-w-2xl mx-auto flex-1 py-12">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key="greeting"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex flex-col items-center w-full"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4A90E2] to-[#00B4D8] flex items-center justify-center text-white mb-6 shadow-xl shadow-[#00B4D8]/20 rotate-3">
                      <Code2 size={40} />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                      Ask me about math or coding!
                    </h1>
                    <p className="text-gray-400 text-base font-medium max-w-md mx-auto mb-10 leading-relaxed">
                      I'm Kamogelo's AI assistant. I can help you explore his portfolio, solve math problems, or write code.
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col w-full relative space-y-6">
                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      id={`message-${msg.id}`}
                      key={msg.id} 
                      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {isUser ? (
                        <div className="flex flex-col max-w-[85%] sm:max-w-[75%] items-end">
                          <div className="flex items-center gap-2 mb-1.5 px-1">
                            <span className="text-[13px] font-medium text-gray-400">You</span>
                          </div>
                          <div className="px-5 py-3.5 rounded-2xl shadow-sm bg-[#4A90E2] text-white rounded-tr-sm">
                            <p className="text-[15px] whitespace-pre-wrap font-normal leading-relaxed break-words">
                              {msg.text}
                            </p>
                          </div>
                          {msg.status === "error" && (
                            <button onClick={() => handleSend(msg.text)} className="mt-2 text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 transition-colors">
                              <MaterialIcon name="error" className="text-[14px]" /> Failed to send. Retry
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col max-w-full sm:max-w-full items-start w-full">
                          <AIMessage
                            msg={msg}
                            isFirstInGroup={true}
                            onStreamingComplete={(id) => {
                              setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "sent" } : m));
                            }}
                            renderUIBlock={(uiBlock) => (
                              <>
                                {uiBlock === "projects" && <ProjectCards />}
                                {uiBlock === "skills" && <SkillChips />}
                                {uiBlock === "cv" && <DownloadCV onViewCv={onViewCv} />}
                              </>
                            )}
                          />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                {isGenerating && messages[messages.length - 1]?.role === "user" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full">
                    <div className="flex flex-col items-start max-w-[85%]">
                       <div className="flex items-center gap-2 mb-1.5 px-1">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#4A90E2] to-[#00B4D8] flex items-center justify-center text-[10px] font-bold text-white">K</div>
                          <span className="text-[13px] font-medium text-gray-400">Kamogelo</span>
                        </div>
                        <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-[#13131c] flex items-center gap-1.5 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-[#00B4D8] animate-bounce" style={{animationDelay: '0ms'}}></span>
                          <span className="w-2 h-2 rounded-full bg-[#00B4D8] animate-bounce" style={{animationDelay: '150ms'}}></span>
                          <span className="w-2 h-2 rounded-full bg-[#00B4D8] animate-bounce" style={{animationDelay: '300ms'}}></span>
                        </div>
                    </div>
                  </motion.div>
                )}
                <div ref={endOfMessagesRef} className="h-4" />
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Section (Suggestions + Composer) */}
        <div className="w-full shrink-0 z-20 bg-gradient-to-t from-[#08080c] via-[#08080c] to-transparent pt-4 pb-4 px-2 sm:px-4 flex flex-col items-center">
          
          <div className="w-full max-w-[900px] mx-auto flex flex-col">
            
            {/* Quick Suggestions */}
            <div className="w-full mb-3 flex items-center">
              <div className="flex-1 overflow-x-auto no-scrollbar pb-1 flex gap-2">
                {PROMPT_SETS[promptSetIndex].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt.text)}
                    className="shrink-0 flex items-center gap-2 px-3.5 py-2 bg-[#13131c] hover:bg-[#1a1a28] rounded-full transition-all cursor-pointer shadow-sm group"
                  >
                    <div className="text-[#00B4D8] group-hover:scale-110 transition-transform">
                      {renderPromptIcon(prompt.icon)}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap">{prompt.text}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPromptSetIndex((prev) => (prev + 1) % PROMPT_SETS.length)}
                className="ml-2 shrink-0 w-9 h-9 rounded-full bg-[#13131c] hover:bg-[#1a1a28] flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-sm"
                title="Refresh Suggestions"
              >
                <RotateCw size={16} />
              </button>
            </div>

            {/* Input Bar */}
            <div className="w-full bg-[#13131c] rounded-[28px] p-1.5 shadow-lg shadow-black/40 border border-transparent focus-within:border-[#4A90E2]/50 focus-within:shadow-[0_0_15px_rgba(74,144,226,0.15)] transition-all flex items-end relative">
              <button
                type="button"
                className="w-11 h-11 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors shrink-0 mb-0.5 ml-0.5"
                title="Add attachment"
              >
                <Paperclip size={20} />
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { 
                   if (e.key === "Enter" && !e.shiftKey) {
                       e.preventDefault();
                       if (input.trim() && !isLoading && !isGenerating) handleSend(input);
                   }
                }}
                placeholder="Ask me about math or coding..." 
                ref={textareaRef}
                className="flex-1 bg-transparent border-none outline-none text-[15px] sm:text-[16px] py-3.5 px-2 text-white resize-none max-h-[150px] placeholder:text-gray-500 mb-0.5"
                disabled={isLoading || isGenerating}
                rows={1}
              />

              <div className="flex items-center gap-1 shrink-0 mb-1 mr-1">
                <button
                  type="button"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={isGenerating}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  title="Hold to speak"
                >
                  <Mic size={20} />
                </button>
                <button
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isLoading || isGenerating}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                    input.trim() && !isLoading && !isGenerating
                      ? "bg-gradient-to-r from-[#4A90E2] to-[#00B4D8] text-white hover:opacity-90 active:scale-95"
                      : "bg-white/5 text-gray-500 cursor-not-allowed"
                  }`}
                  title="Send message"
                >
                  <Send size={18} className={input.trim() ? "ml-0.5" : ""} />
                </button>
              </div>
            </div>
            
            {/* New Chat & Disclaimer */}
            <div className="flex justify-between items-center w-full mt-3 px-2">
              <div className="text-[11px] text-gray-500 font-medium">
                Assistant can make mistakes. Please check important details.
              </div>
              {messages.length > 0 && (
                <button 
                  onClick={() => { setMessages([]); setInput(""); }}
                  className="text-[12px] font-medium text-[#4A90E2] hover:text-[#00B4D8] transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none"
                >
                  <PlusCircle size={14} /> New Chat
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
