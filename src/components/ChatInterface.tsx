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

  const renderComposer = (isFixed: boolean) => {
    return (
      <div className={`${isFixed ? 'w-full max-w-3xl' : 'w-full max-w-2xl mx-auto mt-4'} relative flex flex-col items-center pointer-events-auto`}>
        {/* Recording status banner */}
        <AnimatePresence>
          {(recordingStatus || interimSpeech) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="w-full bg-rose-500/10 border-2 border-rose-500/30 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-2xl mb-2 text-center text-body-small font-medium flex items-center justify-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>{interimSpeech ? interimSpeech : recordingStatus}</span>
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
              className="w-full bg-surface border-2 border-primary/20 shadow-xl p-4 mb-3 rounded-2xl relative z-30 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-primary font-semibold text-body-small sm:text-body-medium">
                  <MaterialIcon name="auto_awesome" className="text-title-medium animate-pulse" />
                  <span>Interactive Follow-up Questions</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveClarifications([])}
                  className="text-on-surface-variant hover:text-on-surface transition-colors p-1 border-0 bg-transparent cursor-pointer flex items-center justify-center rounded-2xl hover:bg-surface-container-highest"
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
                    className="w-full text-left px-4 py-2.5 text-body-small sm:text-[13.5px] font-normal text-on-background bg-surface-container-low hover:bg-primary-container hover:text-primary border-2 border-outline-variant hover:border-primary/30 transition-all rounded-2xl duration-150 active:scale-[0.99] cursor-pointer min-h-[44px]"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input box with smooth border-2 radius */}
        <div className="w-full bg-surface border-2 border-outline-variant shadow-sm rounded-3xl focus-within:shadow-[0_6px_20px_rgba(30,142,62,0.06)] focus-within:border-primary focus-within:ring-2 focus-within:ring-[var(--color-accent)]/10 transition-all flex flex-col p-4.5 pb-3.5 relative">
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
              className="flex-1 bg-transparent text-on-background py-2.5 px-3 focus:outline-none resize-none placeholder:text-on-surface-variant font-normal text-[15.5px] sm:text-[16.5px] leading-relaxed border-0"
              disabled={isLoading || isGenerating}
              rows={1}
            />
          </div>

          {/* Bottom Row: Actions & Send */}
          <div className="flex items-center justify-between mt-2.5 px-4 w-full gap-2 select-none">
            {/* Thinking Mode & Engine Selection Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-full text-label-medium font-medium transition-all duration-200 border-2 cursor-pointer shrink-0 min-h-[44px]"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "var(--outline-variant)",
                  color: "var(--text-muted)",
                  opacity: isGenerating ? 0.5 : 1,
                  pointerEvents: isGenerating ? 'none' : 'auto'
                }}
                disabled={isGenerating}
                title="Settings"
              >
                <MaterialIcon name="settings" className="text-title-large" />
                <span>Settings</span>
              </button>
            </div>

            {/* Settings Modal */}
            {showSettingsModal && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowSettingsModal(false)}>
                <div className="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                  <h4 className="text-lg font-bold text-on-surface mb-4">Settings</h4>
                  
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-on-surface-variant mb-2">Thinking Mode</h5>
                    
                    {llmStatus && (
                      <div className="mb-3 text-xs text-on-surface-variant flex flex-col gap-1">
                        <div>Tiny model: {llmStatus.tiny_model}</div>
                        <div>Large model: {llmStatus.large_model?.status}</div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        if (setSelectedModel && isLargeReady !== false) {
                          setSelectedModel(selectedModel === "large" ? "tiny" : "large");
                        }
                      }}
                      disabled={isLargeReady === false}
                      className={`w-full px-4 py-2 rounded-lg text-sm font-medium border-2 flex items-center justify-between transition-colors ${selectedModel === "large" ? "bg-primary text-on-primary border-primary" : "bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container"} ${isLargeReady === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span>Enable Thinking {isLargeReady === false ? "(not ready yet)" : ""}</span>
                      {selectedModel === "large" && <MaterialIcon name="check" className="text-on-primary" />}
                    </button>
                    <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                      Uses a specialized reasoning model to plan and think step-by-step before answering.
                    </p>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-on-surface-variant mb-2">AI Engine</h5>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        onClick={() => setAiEngine("cloud")}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${aiEngine === "cloud" ? "bg-primary text-on-primary border-primary" : "bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container"}`}
                      >
                        Cloud Core
                      </button>
                      <button
                        onClick={() => setAiEngine("local")}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${aiEngine === "local" ? "bg-primary text-on-primary border-primary" : "bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container"}`}
                      >
                        Local WebAI
                      </button>
                    </div>
                    <div className="text-xs text-on-surface-variant leading-relaxed space-y-1.5">
                      <p><strong>Cloud Core:</strong> Fast, high-performance API hosted remotely.</p>
                      <p><strong>Local WebAI:</strong> Runs locally in your browser. (Requires downloading models first)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Right side: Mic, Character count and Send */}
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] text-on-surface-variant font-mono hidden sm:inline select-none pr-1">
                {input.length}/1000
              </span>

              {/* Tap and Hold Microphone Button */}
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isGenerating}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer border-2 shrink-0 ${
                  isRecording
                    ? "bg-rose-500 text-white animate-pulse border-rose-600 shadow-md scale-105"
                    : isGenerating
                    ? "border-outline-variant bg-surface-container-low text-on-surface-variant cursor-not-allowed opacity-50"
                    : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
                style={{ minWidth: "44px", minHeight: "44px" }}
                title="Tap and hold to speak"
              >
                <MaterialIcon name="mic" className={`text-title-large ${isRecording ? "animate-bounce" : ""}`} />
              </button>

              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading || isGenerating}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer border-2 shrink-0 ${
                  input.trim() && !isLoading && !isGenerating
                    ? "border-transparent bg-primary dark:bg-white text-on-primary dark:bg-white dark:text-primary hover:opacity-90 active:scale-95 shadow-sm"
                    : "border-outline-variant bg-surface-container-low text-on-surface-variant cursor-not-allowed opacity-50"
                }`}
                style={{ minWidth: "44px", minHeight: "44px" }}
                title="Send message"
              >
                <MaterialIcon name="send" className="text-title-large" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <div className="text-center mt-2 w-full flex flex-col sm:flex-row items-center justify-between px-4 gap-1.5 sm:gap-0 select-none">
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
             <span className="text-label-small font-normal text-on-surface-variant font-mono">
               {isHfConnected === null ? "Checking server..." : isHfConnected ? "HuggingFace: Active" : "Offline Mode: Active"}
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

  return (
    <div className="flex-1 flex h-full overflow-hidden relative bg-background w-full font-sans antialiased">
      
      {/* Main Conversation Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">


        {/* Scrollable chat body */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto w-full flex flex-col relative scroll-smooth pt-4"
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
                        <div className="mb-6">
                          <h1 className="text-display-medium sm:text-[44px] font-bold tracking-tight text-on-background mb-1 leading-none font-display">
                            Hi there, <span className="bg-gradient-to-r from-[var(--color-accent)] to-[#C084FC] bg-clip-text text-transparent font-display">I'm Kamo's AI</span>
                          </h1>
                          <h2 className="text-display-medium sm:text-[34px] font-bold tracking-tight text-[#4F46E5] mb-4 leading-tight font-display">
                            Welcome to my Professional Portfolio
                          </h2>
                          <p className="text-on-surface-variant text-[15.5px] font-normal leading-relaxed mb-6">
                            I am Kamo's custom GPT assistant. Explore Kamo's software engineering projects, technical skills, coursework, and career achievements. Use the quick links below to jump straight to his CV or live projects list, or ask me anything to get started!
                          </p>
                          <div className="flex flex-wrap gap-3 select-none">
                            <button
                              onClick={onViewCv}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-semibold text-body-medium hover:opacity-90 shadow-md border-0 transition-opacity cursor-pointer min-h-[44px]"
                            >
                              <FileText size={16} />
                              <span>View Interactive CV</span>
                            </button>
                            <button
                              onClick={onViewProjects}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-high border-2 border-outline-variant text-on-surface hover:bg-surface-container-highest font-semibold text-body-medium transition-all cursor-pointer min-h-[44px]"
                            >
                              <Code2 size={16} />
                              <span>Explore Projects</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="options"
                        initial={{ opacity: 0, scale: 0.97, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="flex flex-col text-left w-full"
                      >
                        <div className="mb-3.5">
                          <p className="text-on-surface-variant text-label-medium font-normal uppercase tracking-wider">
                            Quick Suggestions
                          </p>
                        </div>

                        {/* Clean Quick Cards with smooth border-2 radius, pop-ins, clear font weights */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
                          {PROMPT_SETS[promptSetIndex].slice(0, 3).map((prompt, idx) => (
                            <motion.button
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: idx * 0.05 }}
                              onClick={() => handleSend(prompt.text)}
                              className="flex items-center gap-3.5 p-3.5 bg-surface border-2 border-outline-variant hover:bg-surface-container-highest transition-all duration-200 active:scale-[0.98] cursor-pointer text-left min-h-[64px] rounded-2xl shadow-sm"
                            >
                              <div className="shrink-0 w-8 h-8 rounded-xl bg-primary-container flex items-center justify-center">
                                {renderPromptIcon(prompt.icon)}
                              </div>
                              <span className="text-body-small text-on-background font-normal leading-tight line-clamp-2">
                                {prompt.text}
                              </span>
                            </motion.button>
                          ))}
                        </div>

                        <div className="mt-3.5 flex justify-start mb-8">
                          <button
                            onClick={() => setPromptSetIndex((prev) => (prev + 1) % PROMPT_SETS.length)}
                            className="flex items-center gap-1.5 text-[12.5px] text-on-surface-variant hover:text-on-background font-normal transition-colors bg-transparent border-0 cursor-pointer p-2.5 min-h-[44px]"
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

                    return (
                      <div 
                        id={`message-${msg.id}`}
                        key={msg.id} 
                        className={`flex w-full ${isUser ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-6" : "mt-2"}`}
                      >
                        {isUser ? (
                          <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%]">
                            <div 
                              className="text-on-background px-4.5 py-3 sm:px-5 sm:py-3.5 rounded-2xl rounded-tr-sm border-2 shadow-sm"
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
                                            className="max-w-full max-h-[160px] object-cover rounded-2xl border-2 border-black/10 shadow-sm" 
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <div className="flex items-center gap-2.5 px-4 py-2 bg-surface/60 border-2 border-black/5 rounded-2xl select-none text-left">
                                            <MaterialIcon name="description" className="text-title-medium text-primary shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                              <span className="text-label-medium font-normal text-on-surface truncate max-w-[160px]">{attachment.name}</span>
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
                                className="mt-1.5 text-red-500 hover:text-red-600 flex items-center gap-1.5 text-label-medium font-normal bg-transparent border-0 cursor-pointer min-h-[44px]"
                              >
                                <MaterialIcon name="error" className="text-body-medium text-red-500 mr-1" />
                                <span>Failed to send. Click to retry</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <AIMessage
                            msg={msg}
                            isFirstInGroup={isFirstInGroup}
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
                        )}
                      </div>
                    );
                  })}
                  <div ref={endOfMessagesRef} className="h-4" />
                </div>
              )}
            </div>
        </div>

        {/* Custom Composer fixed at bottom */}
        <div className="w-full shrink-0 pt-4 pb-3 sm:pb-4 px-4 sm:px-6 flex justify-center z-10 bg-background border-t-2 border-outline-variant relative">
          {/* Floating Scroll Controls */}
          <div className="absolute top-0 left-0 right-0 -translate-y-full flex justify-center pointer-events-none z-20 pb-3 gap-3">
            {(!isAtBottom || messages.some(m => m.status === 'streaming')) && (
              <div className="pointer-events-auto flex gap-2">
                {messages.length > 0 && messages[messages.length - 1].role === 'agent' && (
                  <button
                    onClick={() => {
                      const streamingMsg = [...messages].reverse().find(m => m.role === 'agent');
                      if (streamingMsg) {
                        const el = document.getElementById(`msg-${streamingMsg.id}`);
                        if (el && scrollContainerRef.current) {
                          scrollContainerRef.current.scrollTo({
                            top: el.offsetTop - 16,
                            behavior: 'smooth'
                          });
                        }
                      }
                    }}
                    className="flex items-center gap-1 bg-surface border-2 border-outline-variant rounded-full px-4 py-1.5 shadow-md text-primary hover:bg-surface-container-high transition-all text-label-medium font-normal"
                  >
                    <MaterialIcon name="arrow_upward" className="text-body-small" />
                    Response Start
                  </button>
                )}
                {!isAtBottom && (
                  <button
                    onClick={() => scrollToBottom('smooth')}
                    className="flex items-center justify-center w-8 h-8 bg-surface border-2 border-outline-variant rounded-full shadow-md text-primary hover:bg-surface-container-high transition-all"
                  >
                    <MaterialIcon name="arrow_downward" className="text-body-small" />
                  </button>
                )}
              </div>
            )}
          </div>

          {renderComposer(true)}
        </div>

      </div>
    </div>
  );
}
