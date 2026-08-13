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
        const res = await fetch("/api/ping-model", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "meta-llama/llama-3.3-70b-instruct" }) });
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
        role: m.role === "user" ? "user" : "assistant",
        text: m.text
      }));

      const chatHistory = history.map(m => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.text
      }));

      const apiMessages = [
        ...chatHistory,
        { role: "user", content: text.trim() }
      ];
      const res = await fetch("/api/openrouter/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          options: { model: selectedModel === "large" ? "meta-llama/llama-3.3-70b-instruct" : "meta-llama/llama-3.3-70b-instruct", temperature: 0.7 }
        })
      });
      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      const resText = data.choices?.[0]?.message?.content || "";
      
      let replyText = resText || "Sorry, I had trouble processing that.";
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
          <div className="flex items-start justify-between gap-3 w-full min-h-[46px] min-w-0">
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
              className="flex-1 min-w-0 bg-transparent text-on-background py-2.5 px-3 focus:outline-none resize-none placeholder:text-on-surface-variant font-normal text-[15.5px] sm:text-[16.5px] leading-relaxed border-0"
              disabled={isLoading || isGenerating}
              rows={1}
            />
          </div>

          
          {/* Bottom Row: Actions & Send */}
          <div className="flex items-center justify-between mt-2.5 w-full gap-2 select-none">
            <div className="flex gap-2"></div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading || isGenerating}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-on-primary shadow-sm hover:shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MaterialIcon name="send" className="text-body-medium ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full relative bg-background">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-outline-variant bg-surface/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleDrawer}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors border-0 bg-transparent cursor-pointer"
          >
            <MaterialIcon name="menu" className="text-title-large" />
          </button>
          <div className="w-10 h-10 shrink-0">
            <AppIcon />
          </div>
          <div className="flex flex-col">
            <h1 className="text-title-medium font-bold text-on-surface leading-tight">CodeMind AI</h1>
            <div className="flex items-center gap-1.5 text-label-small text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Ready
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto w-full relative" ref={scrollContainerRef}>
        <div className="flex flex-col gap-5 p-4 sm:p-6 w-full max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-20 h-20 mb-6 relative">
                <div className="absolute inset-0 bg-primary/20 rounded-3xl rotate-6 animate-pulse"></div>
                <div className="absolute inset-0 bg-secondary/20 rounded-3xl -rotate-6 animate-pulse delay-75"></div>
                <div className="relative bg-surface border-2 border-outline-variant rounded-2xl w-full h-full flex items-center justify-center shadow-lg">
                  <MaterialIcon name="smart_toy" className="text-4xl text-primary" />
                </div>
              </div>
              <h2 className="text-headline-medium font-bold text-on-surface mb-3 tracking-tight">How can I help you?</h2>
              <p className="text-body-large text-on-surface-variant max-w-md mx-auto mb-8 font-normal leading-relaxed">
                I'm Kamo's dedicated AI assistant. I can explain his projects, detail his technical skills, or help you solve coding and math problems.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const isFirstInGroup = index === 0 || messages[index - 1].role !== msg.role;
                return (
                  <div key={msg.id} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                    {isUser ? (
                      <div className="flex flex-col items-end max-w-[85%]">
                        <div className="text-on-surface px-5 py-3 rounded-3xl rounded-tr-sm bg-surface-container-high max-w-xl shadow-sm">
                          <p className="text-body-medium whitespace-pre-wrap font-normal leading-relaxed break-words">
                            {msg.text}
                          </p>
                        </div>
                        {msg.status === "error" && (
                          <button
                            onClick={() => handleSend(msg.text)}
                            className="mt-1 text-red-500 flex items-center gap-1 text-label-small font-normal bg-transparent border-0 cursor-pointer min-h-[44px]"
                          >
                            <MaterialIcon name="error" className="text-body-medium text-red-500 mr-1" /> Retry
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
        {renderComposer(true)}
      </div>
    </div>
  );
}
