import React, { useState, useRef, useEffect, UIEvent } from "react";
import { Send, Sparkles, Settings, Mic, Link as LinkIcon, User, Mail, GraduationCap, FileText, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectCards, SkillChips, DownloadCV } from "./RichComponents";
import { WatermelonIcon } from "./WatermelonIcon";
import { TimeOfDayWidget } from "./TimeOfDayWidget";

export type Message = {
  id: string;
  role: "user" | "agent";
  text: string;
  uiBlock?: "projects" | "skills" | "cv" | null;
};

export default function ChatInterface({ 
  onOpenSettings, 
  selectedModel = "deepseek-ai/DeepSeek-V4-Pro:novita",
  setSelectedModel,
  onToggleDrawer,
  messages,
  setMessages
}: { 
  onOpenSettings?: () => void, 
  selectedModel?: string,
  setSelectedModel?: (model: string) => void,
  onToggleDrawer?: () => void,
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
}) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastScrollY = useRef(0);

  // Auto-scroll when messages update
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading, isTranscribing]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > 20) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
    lastScrollY.current = currentScrollY;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
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
          alert("Transcription failed. Please check the connection and try again.");
        } finally {
          setIsTranscribing(false);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access denied or error:", error);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
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

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "agent",
        text: replyText,
        uiBlock
      }]);

    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "agent",
        text: "I seem to be offline right now. You can email me at kamogelomosiah@gmail.com in the meantime!"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const isInitialState = messages.length === 0;
  const isShrunk = isScrolled || !isInitialState;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[var(--bg-main)] w-full font-sans">
      {/* Top Header - Island on Scroll */}
      <div className={`absolute top-0 left-0 right-0 z-30 flex justify-center transition-all duration-200 pointer-events-none pt-[calc(env(safe-area-inset-top)+12px)] sm:pt-[calc(env(safe-area-inset-top)+20px)] ${isShrunk ? 'px-3 sm:px-4' : 'px-3 sm:px-5'}`}>
        <div className={`flex items-center justify-between w-full transition-all duration-200 pointer-events-auto ${isShrunk ? 'bg-[var(--bg-card)]/90 backdrop-blur-md rounded-full shadow-md border border-[var(--border-light)]/60 px-3 py-1.5 max-w-3xl' : 'h-[64px] px-2 sm:px-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-light)] shadow-sm max-w-full'}`}>
          <div className="flex items-center gap-2">
            <button onClick={onToggleDrawer} className="md:hidden flex items-center justify-center w-12 h-12 rounded-full hover:bg-black/5 transition-colors text-[var(--text-muted)] cursor-pointer border-0 bg-transparent">
              <Menu size={24} />
            </button>
            
            <div className={`relative flex items-center gap-3 ${isShrunk ? 'ml-1' : 'ml-1 md:ml-4'}`}>
               <motion.div layoutId="watermelon-avatar" className={`flex items-center justify-center transition-all duration-200 ${isShrunk ? 'w-6 h-6' : 'w-8 h-8'}`}>
                 <WatermelonIcon className="w-full h-full text-[var(--color-accent)]" />
               </motion.div>
               <div className="flex flex-col items-start justify-center">
                 <h1 className={`font-medium text-[var(--text-main)] tracking-normal font-display m-0 p-0 transition-all duration-200 ${isShrunk ? 'text-[15px]' : 'text-[18px] md:text-[20px]'}`}>Kamogelo's GPT</h1>
                 <div className={`flex items-center gap-1.5 text-[var(--text-muted)] transition-all duration-200 ${isShrunk ? 'hidden' : 'mt-0.5'}`}>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[12px] font-normal leading-none">Online Assistant</span>
                 </div>
               </div>
            </div>
          </div>
          
          <div className={`flex items-center gap-1 text-[var(--text-muted)] relative transition-all duration-200 ${isShrunk ? 'pr-0' : 'pr-1 md:pr-4'}`}>
            <button 
              onClick={() => onOpenSettings?.()}
              className={`flex items-center justify-center rounded-full hover:bg-black/5 transition-colors cursor-pointer border-0 bg-transparent ${isShrunk ? 'w-10 h-10' : 'w-12 h-12'}`}
              title="Configuration"
            >
              <Settings size={isShrunk ? 20 : 22} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto w-full flex flex-col relative pb-[240px] scroll-smooth pt-[calc(env(safe-area-inset-top)+100px)]`}
        onScroll={handleScroll}
      >
        <div className="w-full max-w-3xl mx-auto flex flex-col px-4 sm:px-6 pt-5 sm:pt-8 min-h-full">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col text-left w-full transition-all duration-200"
          >
            {isInitialState && (
              <>
                {/* Hero Section */}
                <div className="w-full flex justify-center mb-8 sm:mb-12 pt-4">
                  <div className="flex flex-col items-center justify-center text-center w-full max-w-2xl">
                    <TimeOfDayWidget />
                    <p className="text-[var(--text-muted)] text-[15px] sm:text-[16px] font-normal leading-relaxed mt-2 px-2">
                      I'm Kamogelo's automated assistant. Ask me anything about his background, skills, or download his CV directly from here.
                    </p>
                  </div>
                </div>

                {/* Quick Action Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mx-auto">
                   <a href="/Kamogelo_Mosia_Transcript.pdf" download className="flex flex-col items-start bg-[var(--bg-card)] border border-[var(--border-light)] shadow-sm p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full cursor-pointer no-underline group">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center mb-3 text-accent">
                         <GraduationCap size={18} />
                      </div>
                      <span className="font-medium text-[var(--text-main)] text-[15px] mb-1">Academic Transcript</span>
                      <span className="text-sm text-[var(--text-muted)]">View academic record</span>
                   </a>
                   
                   <a href="/Kamogelo_Mosia_CV.pdf" download className="flex flex-col items-start bg-[var(--bg-card)] border border-[var(--border-light)] shadow-sm p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full cursor-pointer no-underline group">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center mb-3 text-[var(--color-accent)]">
                         <FileText size={18} />
                      </div>
                      <span className="font-medium text-[var(--text-main)] text-[15px] mb-1">CV / Resume</span>
                      <span className="text-sm text-[var(--text-muted)]">Download formal CV</span>
                   </a>

                   <button onClick={() => handleSend("Can you tell me about yourself?")} className="flex flex-col items-start text-left bg-[var(--bg-card)] border border-[var(--border-light)] shadow-sm p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full cursor-pointer no-underline border-0">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-accent-light)] flex items-center justify-center mb-3 text-[var(--color-accent)]">
                         <User size={18} />
                      </div>
                      <span className="font-medium text-[var(--text-main)] text-[15px] mb-1">About Me</span>
                      <span className="text-sm text-[var(--text-muted)]">Background & skills</span>
                   </button>
                   
                   <button onClick={() => handleSend("How can I contact you?")} className="flex flex-col items-start text-left bg-[var(--bg-card)] border border-[var(--border-light)] shadow-sm p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full cursor-pointer no-underline border-0">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-accent-light)] flex items-center justify-center mb-3 text-[var(--color-accent)]">
                         <Mail size={18} />
                      </div>
                      <span className="font-medium text-[var(--text-main)] text-[15px] mb-1">Contact Details</span>
                      <span className="text-sm text-[var(--text-muted)]">Get in touch</span>
                   </button>
                </div>
              </>
            )}
            
            {messages.length > 0 && (
              <div className="flex flex-col gap-6 w-full relative">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "user" ? (
                      <div className="text-[var(--text-main)] px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl rounded-tr-sm max-w-[85%] sm:max-w-[75%] border shadow-sm" style={{ backgroundColor: "var(--color-accent-light)", borderColor: "var(--color-accent-light)" }}>
                        <p className="text-[15px] whitespace-pre-wrap font-normal leading-relaxed">{msg.text}</p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4 w-full max-w-full sm:max-w-4xl px-1 sm:px-4">
                        <div className="flex items-center justify-center rounded-full w-8 h-8 shrink-0 mt-1">
                           <WatermelonIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 flex flex-col items-start w-full">
                          <span className="font-medium text-[13px] text-[var(--text-muted)] mb-1">Kamogelo's GPT</span>
                          <div className="text-[var(--text-main)] bg-transparent pb-4 w-full text-left">
                            <p className="text-[16px] leading-[1.7] whitespace-pre-wrap font-normal w-full max-w-3xl">
                              {msg.text}
                            </p>
                            <div className="mt-4 flex flex-col gap-3 w-full max-w-3xl">
                              {msg.uiBlock === "projects" && <ProjectCards />}
                              {msg.uiBlock === "skills" && <SkillChips />}
                              {msg.uiBlock === "cv" && <DownloadCV />}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-start w-full justify-start mt-2">
                    <div className="flex items-start gap-4 w-full max-w-full sm:max-w-4xl px-1 sm:px-4">
                      <div className="flex items-center justify-center rounded-full w-8 h-8 shrink-0 mt-1">
                          <WatermelonIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 flex flex-col items-start w-full">
                        <span className="font-medium text-[13px] text-[var(--text-muted)] mb-1">Kamogelo's GPT</span>
                        <div className="py-2 flex items-center gap-3 w-fit">
                          <svg className="animate-spin h-5 w-5 text-[var(--color-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-[14px] font-normal text-[var(--text-muted)]">Just a sec...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={endOfMessagesRef} className="h-4" />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 pt-8 pb-4 sm:pb-6 px-4 sm:px-6 flex justify-center z-10 pointer-events-none bg-gradient-to-t from-bg-main via-bg-main via-70% to-transparent">
        <div className="w-full max-w-3xl relative pointer-events-auto flex flex-col items-center">
          
          {/* Recording Overlay */}
          <AnimatePresence>
            {isRecording && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute inset-x-0 bottom-full mb-4 z-20 bg-[var(--bg-card)] border border-[var(--color-accent)]/30 rounded-[28px] flex items-center justify-center p-6 cursor-pointer shadow-xl overflow-hidden touch-none select-none text-[var(--text-main)]"
                onPointerUp={stopRecording}
                onPointerLeave={stopRecording}
                onTouchEnd={stopRecording}
                onContextMenu={(e) => e.preventDefault()}
              >
                <div className="absolute inset-0 bg-[var(--bg-accent-light)]/50 animate-pulse"></div>
                <div className="flex flex-col items-center justify-center gap-3 z-10">
                  <div className="w-16 h-16 bg-[var(--color-accent)] rounded-full flex items-center justify-center animate-bounce shadow-md">
                    <Mic size={32} className="text-white" />
                  </div>
                  <span className="font-medium tracking-wide text-sm">Listening... Release to send</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search/Input Bar - Material 3 Pill Input */}
          <div className={`w-full bg-[var(--bg-card)] border ${isTranscribing ? 'border-[var(--color-accent)] shadow-[0_2px_12px_rgba(26,115,232,0.2)]' : 'border-gray-300 shadow-sm'} rounded-[28px] focus-within:shadow-[0_2px_8px_rgba(0,0,0,0.1)] focus-within:border-gray-400 transition-all flex flex-col pt-1 pb-1 pr-2 relative`}>
            {isTranscribing && (
              <div className="absolute inset-0 bg-[var(--bg-card)]/95 backdrop-blur-sm z-10 rounded-[28px] flex items-center justify-center gap-3">
                 <svg className="animate-spin h-5 w-5 text-[var(--color-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 <span className="font-medium text-[15px] text-[var(--color-accent)]">Transcribing audio...</span>
              </div>
            )}
            
            <div className="flex items-center pl-4 w-full min-h-[52px]">
               <textarea
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                       e.preventDefault();
                       handleSend(input);
                    }
                 }}
                 placeholder="Reply to Kamogelo..."
                 className="flex-1 bg-transparent text-[var(--text-main)] py-3 focus:outline-none resize-none placeholder:text-[var(--text-muted)] font-normal text-[16px] leading-[24px] max-h-[160px] self-center"
                 disabled={isLoading || isTranscribing}
                 rows={1}
               />
               
               <div className="flex items-center gap-1 shrink-0 ml-2 self-end pb-[6px]">
                  <button 
                     onClick={() => setModelSelectorOpen(true)}
                     className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-light)] text-[var(--text-muted)] hover:bg-gray-100 font-medium text-[12px] transition-colors cursor-pointer mr-1"
                     title="Select AI Model"
                  >
                     <Sparkles size={14} className="text-[var(--color-accent)]" />
                     <span className="truncate max-w-[100px]">
                       {selectedModel.includes("DeepSeek") ? "DeepSeek V4" :
                        selectedModel.includes("gpt-oss") ? "GPT OSS 120B" : "Llama 3.1"}
                     </span>
                  </button>
                  <button
                     onPointerDown={(e) => { e.preventDefault(); startRecording(); }}
                     onContextMenu={(e) => e.preventDefault()}
                     className="flex items-center justify-center w-10 h-10 rounded-full text-[var(--text-muted)] hover:bg-gray-100 transition-colors cursor-pointer select-none touch-none border-0 bg-transparent"
                     title="Hold to Speak"
                  >
                     <Mic size={22} className="pointer-events-none" />
                  </button>
                  <button
                     onClick={() => handleSend(input)}
                     disabled={!input.trim() || isLoading || isTranscribing}
                     className="flex items-center justify-center w-10 h-10 rounded-full disabled:text-gray-300 disabled:bg-transparent bg-[var(--color-accent)] text-white hover:bg-blue-700 transition-colors cursor-pointer select-none touch-none border-0 ml-1 shadow-sm"
                     title="Send message"
                  >
                     <Send size={18} className="pointer-events-none -ml-0.5" />
                  </button>
               </div>
            </div>
          </div>
          
          <div className="text-center mt-3 w-full flex flex-col items-center">
             <span className="text-[12px] text-[var(--text-muted)] font-normal">
                Models can make mistakes. Please check important info.
             </span>
             <button 
                onClick={() => setModelSelectorOpen(true)}
                className="mt-1 sm:hidden flex items-center gap-1 text-[var(--color-accent)] font-medium text-[12px] border-0 bg-transparent cursor-pointer"
             >
                <Sparkles size={12} /> 
                {selectedModel.includes("DeepSeek") ? "DeepSeek V4" :
                 selectedModel.includes("gpt-oss") ? "GPT OSS 120B" : "Llama 3.1"}
             </button>
          </div>
        </div>
      </div>

      {/* Model Selection Modal Popup */}
      <AnimatePresence>
        {modelSelectorOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModelSelectorOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.2 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[var(--bg-card)] rounded-3xl shadow-xl z-50 overflow-hidden flex flex-col p-6 text-[var(--text-main)] pointer-events-auto border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-[20px] text-[var(--text-main)] flex items-center gap-2 m-0 mt-1 mb-2">
                  <Sparkles size={20} className="text-[var(--color-accent)]" />
                  Select Model
                </h3>
              </div>
              <p className="text-[14px] text-[var(--text-muted)] mb-5">Choose the AI engine powering this chat session.</p>
              
              <div className="flex flex-col gap-2">
                {[
                  { id: "deepseek-ai/DeepSeek-V4-Pro:novita", name: "DeepSeek V4 Pro", desc: "Advanced reasoning & logic (Recommended)" },
                  { id: "meta-llama/Llama-3.1-8B-Instruct:novita", name: "Llama 3.1 8B Instruct", desc: "Fast conversational AI & dialogue" },
                  { id: "openai/gpt-oss-120b:groq", name: "GPT OSS 120B", desc: "High intelligence open source model" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel?.(m.id);
                      setModelSelectorOpen(false);
                    }}
                    className={`flex items-start text-left gap-3 p-4 rounded-xl border transition-all cursor-pointer bg-transparent w-full ${
                      selectedModel === m.id
                        ? "border-[var(--color-accent)] bg-[var(--bg-accent-light)]"
                        : "border-[var(--border-light)] hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col flex-1 min-w-0 font-sans">
                      <span className="text-[15px] font-medium text-[var(--text-main)] leading-snug">{m.name}</span>
                      <span className="text-[13px] text-[var(--text-muted)] font-normal truncate mt-0.5">{m.desc}</span>
                    </div>
                    {selectedModel === m.id && (
                      <div className="w-5 h-5 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white shrink-0 mt-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                 <button
                   onClick={() => setModelSelectorOpen(false)}
                   className="px-6 py-2.5 rounded-full bg-transparent text-[var(--color-accent)] hover:bg-[var(--bg-accent-light)] font-medium text-[15px] transition-colors cursor-pointer border-0"
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
