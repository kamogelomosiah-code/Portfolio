import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Settings, Mic, Link as LinkIcon, User, Mail, GraduationCap, FileText, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectCards, SkillChips, DownloadCV } from "./RichComponents";
import appIcon from "../assets/app_icon.png";

type Message = {
  id: string;
  role: "user" | "agent";
  text: string;
  uiBlock?: "projects" | "skills" | "cv" | null;
};

export default function ChatInterface({ 
  onOpenSettings, 
  selectedModel = "deepseek-ai/DeepSeek-V4-Pro:novita",
  setSelectedModel,
  onToggleDrawer
}: { 
  onOpenSettings?: () => void, 
  selectedModel?: string,
  setSelectedModel?: (model: string) => void,
  onToggleDrawer?: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isTranscribing]);

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#F8F9FA] w-full font-sans">
      {/* Top Header - Material 3 Top App Bar */}
      <div className="w-full h-[64px] flex items-center justify-between px-2 sm:px-4 bg-white z-20 shrink-0 text-[#202124] shadow-sm border-b border-gray-200 transition-all">
        <div className="flex items-center gap-2">
          <button onClick={onToggleDrawer} className="md:hidden flex items-center justify-center w-12 h-12 rounded-full hover:bg-black/5 transition-colors text-[#5F6368] cursor-pointer border-0">
            <Menu size={24} />
          </button>
          
          <div className="relative flex items-center gap-3 ml-1 md:ml-4">
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-gray-200">
               <img src={appIcon} alt="App Icon" className="w-full h-full object-contain rounded-full" />
             </div>
             <div className="flex flex-col items-start justify-center">
               <h1 className="font-medium text-[18px] md:text-[20px] m-0 p-0 text-[#202124] tracking-normal font-display">Kamogelo's GPT</h1>
               <div className="flex items-center gap-1.5 mt-0.5 text-[#5F6368]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[12px] font-normal leading-none">Online Assistant</span>
               </div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-[#5F6368] pr-1 md:pr-4 relative">
          <button 
            onClick={() => onOpenSettings?.()}
            className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-black/5 transition-colors cursor-pointer border-0"
            title="Configuration"
          >
            <Settings size={22} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col relative pb-[140px] scroll-smooth">
        <div className="w-full max-w-3xl mx-auto flex flex-col px-4 sm:px-6 pt-5 sm:pt-8 min-h-full">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col text-left w-full transition-all duration-500"
          >
            {isInitialState && (
              <>
                {/* Hero Section */}
                <div className="w-full flex justify-center mb-8 sm:mb-12 pt-4 sm:pt-8">
                  <div className="flex flex-col items-center justify-center text-center max-w-xl">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200 mb-6">
                      <img src={appIcon} alt="App Icon" className="w-[85%] h-[85%] object-contain" />
                    </div>
                    <h1 className="text-[28px] sm:text-[36px] font-bold tracking-normal text-[#202124] mb-4 font-display">
                      How can I help you today?
                    </h1>
                    <p className="text-[#5F6368] text-[15px] sm:text-[16px] font-normal leading-relaxed">
                      I'm Kamogelo's automated assistant. Ask me anything about their background, skills, or download their CV directly from here.
                    </p>
                  </div>
                </div>

                {/* Quick Action Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mx-auto">
                   <a href="/Kamogelo_Mosia_Transcript.pdf" download className="flex flex-col items-start bg-white border border-gray-200 shadow-sm p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full cursor-pointer no-underline group">
                      <div className="w-8 h-8 rounded-full bg-[#E8F0FE] flex items-center justify-center mb-3 text-[#1A73E8]">
                         <GraduationCap size={18} />
                      </div>
                      <span className="font-medium text-[#202124] text-[15px] mb-1">Academic Transcript</span>
                      <span className="text-sm text-[#5F6368]">View academic record</span>
                   </a>
                   
                   <a href="/Kamogelo_Mosia_CV.pdf" download className="flex flex-col items-start bg-white border border-gray-200 shadow-sm p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full cursor-pointer no-underline group">
                      <div className="w-8 h-8 rounded-full bg-[#E8F0FE] flex items-center justify-center mb-3 text-[#1A73E8]">
                         <FileText size={18} />
                      </div>
                      <span className="font-medium text-[#202124] text-[15px] mb-1">CV / Resume</span>
                      <span className="text-sm text-[#5F6368]">Download formal CV</span>
                   </a>

                   <button onClick={() => handleSend("Can you tell me about yourself?")} className="flex flex-col items-start text-left bg-white border border-gray-200 shadow-sm p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full cursor-pointer no-underline border-0">
                      <div className="w-8 h-8 rounded-full bg-[#E8F0FE] flex items-center justify-center mb-3 text-[#1A73E8]">
                         <User size={18} />
                      </div>
                      <span className="font-medium text-[#202124] text-[15px] mb-1">About Me</span>
                      <span className="text-sm text-[#5F6368]">Background & skills</span>
                   </button>
                   
                   <button onClick={() => handleSend("How can I contact you?")} className="flex flex-col items-start text-left bg-white border border-gray-200 shadow-sm p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full cursor-pointer no-underline border-0">
                      <div className="w-8 h-8 rounded-full bg-[#E8F0FE] flex items-center justify-center mb-3 text-[#1A73E8]">
                         <Mail size={18} />
                      </div>
                      <span className="font-medium text-[#202124] text-[15px] mb-1">Contact Details</span>
                      <span className="text-sm text-[#5F6368]">Get in touch</span>
                   </button>
                </div>
              </>
            )}
            
            {messages.length > 0 && (
              <div className="flex flex-col gap-6 w-full relative">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "user" ? (
                      <div className="bg-[#E8F0FE] text-[#202124] px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl rounded-tr-sm max-w-[85%] sm:max-w-[75%] border border-[#D2E3FC] shadow-sm">
                        <p className="text-[15px] whitespace-pre-wrap font-normal leading-relaxed">{msg.text}</p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4 w-full max-w-[95%] sm:max-w-[85%]">
                        <div className="flex items-center justify-center rounded-full w-8 h-8 bg-white shrink-0 border border-gray-200 shadow-sm mt-1">
                           <img src={appIcon} alt="App Icon" className="w-[70%] h-[70%] object-contain" />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <span className="font-medium text-[13px] text-[#5F6368] mb-1 pl-1">Kamogelo's GPT</span>
                          <div className="text-[#202124] bg-white rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm p-4 sm:p-5">
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-normal">
                              {msg.text}
                            </p>
                            <div className="mt-4 flex flex-col gap-3">
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
                    <div className="flex items-start gap-4 max-w-[95%] sm:max-w-[85%]">
                      <div className="flex items-center justify-center rounded-full w-8 h-8 bg-white shrink-0 border border-gray-200 shadow-sm mt-1">
                          <img src={appIcon} alt="App Icon" className="w-[70%] h-[70%] object-contain" />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <span className="font-medium text-[13px] text-[#5F6368] mb-1 pl-1">Kamogelo's GPT</span>
                        <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-tl-sm flex items-center gap-3 w-fit shadow-sm">
                          <svg className="animate-spin h-5 w-5 text-[#1A73E8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-[14px] font-normal text-[#5F6368]">Just a sec...</span>
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
      <div className="absolute bottom-0 left-0 right-0 pt-8 pb-4 sm:pb-6 px-4 sm:px-6 flex justify-center z-10 pointer-events-none bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA] via-70% to-transparent">
        <div className="w-full max-w-3xl relative pointer-events-auto flex flex-col items-center">
          
          {/* Recording Overlay */}
          <AnimatePresence>
            {isRecording && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute inset-x-0 bottom-full mb-4 z-20 bg-white border border-[#1A73E8]/30 rounded-[28px] flex items-center justify-center p-6 cursor-pointer shadow-xl overflow-hidden touch-none select-none text-[#202124]"
                onPointerUp={stopRecording}
                onPointerLeave={stopRecording}
                onTouchEnd={stopRecording}
                onContextMenu={(e) => e.preventDefault()}
              >
                <div className="absolute inset-0 bg-[#E8F0FE]/50 animate-pulse"></div>
                <div className="flex flex-col items-center justify-center gap-3 z-10">
                  <div className="w-16 h-16 bg-[#1A73E8] rounded-full flex items-center justify-center animate-bounce shadow-md">
                    <Mic size={32} className="text-white" />
                  </div>
                  <span className="font-medium tracking-wide text-sm">Listening... Release to send</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search/Input Bar - Material 3 Pill Input */}
          <div className={`w-full bg-white border ${isTranscribing ? 'border-[#1A73E8] shadow-[0_2px_12px_rgba(26,115,232,0.2)]' : 'border-gray-300 shadow-sm'} rounded-[28px] focus-within:shadow-[0_2px_8px_rgba(0,0,0,0.1)] focus-within:border-gray-400 transition-all flex flex-col pt-1 pb-1 pr-2 relative`}>
            {isTranscribing && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 rounded-[28px] flex items-center justify-center gap-3">
                 <svg className="animate-spin h-5 w-5 text-[#1A73E8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 <span className="font-medium text-[15px] text-[#1A73E8]">Transcribing audio...</span>
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
                 className="flex-1 bg-transparent text-[#202124] py-3 focus:outline-none resize-none placeholder:text-[#5F6368] font-normal text-[16px] leading-[24px] max-h-[160px] self-center"
                 disabled={isLoading || isTranscribing}
                 rows={1}
               />
               
               <div className="flex items-center gap-1 shrink-0 ml-2 self-end pb-[6px]">
                  <button 
                     onClick={() => setModelSelectorOpen(true)}
                     className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-[#5F6368] hover:bg-gray-100 font-medium text-[12px] transition-colors cursor-pointer mr-1"
                     title="Select AI Model"
                  >
                     <Sparkles size={14} className="text-[#1A73E8]" />
                     <span className="truncate max-w-[100px]">
                       {selectedModel.includes("DeepSeek") ? "DeepSeek V4" : "Llama 3.1"}
                     </span>
                  </button>
                  <button
                     onPointerDown={(e) => { e.preventDefault(); startRecording(); }}
                     onContextMenu={(e) => e.preventDefault()}
                     className="flex items-center justify-center w-10 h-10 rounded-full text-[#5F6368] hover:bg-gray-100 transition-colors cursor-pointer select-none touch-none border-0 bg-transparent"
                     title="Hold to Speak"
                  >
                     <Mic size={22} className="pointer-events-none" />
                  </button>
                  <button
                     onClick={() => handleSend(input)}
                     disabled={!input.trim() || isLoading || isTranscribing}
                     className="flex items-center justify-center w-10 h-10 rounded-full disabled:text-gray-300 disabled:bg-transparent bg-[#1A73E8] text-white hover:bg-blue-700 transition-colors cursor-pointer select-none touch-none border-0 ml-1 shadow-sm"
                     title="Send message"
                  >
                     <Send size={18} className="pointer-events-none -ml-0.5" />
                  </button>
               </div>
            </div>
          </div>
          
          <div className="text-center mt-3 w-full flex flex-col items-center">
             <span className="text-[12px] text-[#5F6368] font-normal">
                Models can make mistakes. Please check important info.
             </span>
             <button 
                onClick={() => setModelSelectorOpen(true)}
                className="mt-1 sm:hidden flex items-center gap-1 text-[#1A73E8] font-medium text-[12px] border-0 bg-transparent cursor-pointer"
             >
                <Sparkles size={12} /> {selectedModel.includes("DeepSeek") ? "DeepSeek V4" : "Llama 3.1"}
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-3xl shadow-xl z-50 overflow-hidden flex flex-col p-6 text-[#202124] pointer-events-auto border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-[20px] text-[#202124] flex items-center gap-2 m-0 mt-1 mb-2">
                  <Sparkles size={20} className="text-[#1A73E8]" />
                  Select Model
                </h3>
              </div>
              <p className="text-[14px] text-[#5F6368] mb-5">Choose the AI engine powering this chat session.</p>
              
              <div className="flex flex-col gap-2">
                {[
                  { id: "deepseek-ai/DeepSeek-V4-Pro:novita", name: "DeepSeek V4 Pro", desc: "Advanced reasoning & logic" },
                  { id: "meta-llama/Llama-3.1-8B-Instruct:novita", name: "Llama 3.1 8B Instruct", desc: "Fast conversational AI" },
                  { id: "openai/gpt-oss-120b:groq", name: "GPT OSS 120B", desc: "High-performance answers" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel?.(m.id);
                      setModelSelectorOpen(false);
                    }}
                    className={`flex items-start text-left gap-3 p-4 rounded-xl border transition-all cursor-pointer bg-transparent w-full ${
                      selectedModel === m.id
                        ? "border-[#1A73E8] bg-[#E8F0FE]"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col flex-1 min-w-0 font-sans">
                      <span className="text-[15px] font-medium text-[#202124] leading-snug">{m.name}</span>
                      <span className="text-[13px] text-[#5F6368] font-normal truncate mt-0.5">{m.desc}</span>
                    </div>
                    {selectedModel === m.id && (
                      <div className="w-5 h-5 rounded-full bg-[#1A73E8] flex items-center justify-center text-white shrink-0 mt-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                 <button
                   onClick={() => setModelSelectorOpen(false)}
                   className="px-6 py-2.5 rounded-full bg-transparent text-[#1A73E8] hover:bg-[#E8F0FE] font-medium text-[15px] transition-colors cursor-pointer border-0"
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
