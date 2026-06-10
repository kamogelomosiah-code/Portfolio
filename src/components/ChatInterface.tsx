import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Settings, Share, Edit, MoreVertical, Mic } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
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
      // Build history for backend (excluding UI block tags)
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
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#F9F9F9] w-full">
      {/* Top Header */}
      <div className="w-full h-20 flex items-center justify-between px-4 sm:px-6 bg-[#F9F9F9] z-10 shrink-0 border-b border-gray-200/60 transition-all">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-lg text-black tracking-tight m-0 p-0 whitespace-nowrap">Kamogelo's GPT</h1>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[11px] font-semibold text-green-700 uppercase tracking-widest">Agents Online</span>
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
          <div className="sm:hidden flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 border border-green-100 mr-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center w-10 h-10 border border-transparent bg-transparent hover:bg-black/5 text-black transition-colors cursor-pointer m-0"
            style={{ borderRadius: '100%' }}
          >
            <MoreVertical size={20} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40 cursor-pointer" onClick={() => setMenuOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-[40px] mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 flex flex-col py-1 overflow-hidden"
                >
                  <button 
                    onClick={() => { setMenuOpen(false); onOpenSettings?.(); }} 
                    className="flex justify-between items-center px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-50 cursor-pointer border-0 bg-transparent text-left w-full"
                  >
                    Configuration <Settings size={14} />
                  </button>
                  <button 
                    onClick={() => setMenuOpen(false)}
                    className="flex justify-between items-center px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-50 cursor-pointer border-0 bg-transparent text-left w-full"
                  >
                    Share <Share size={14} />
                  </button>
                  <div className="h-px bg-gray-100 my-1 mx-2" />
                  <button 
                    onClick={() => { setMenuOpen(false); setMessages([]); }}
                    className="flex justify-between items-center px-4 py-2.5 text-sm font-medium text-white bg-black hover:bg-gray-800 cursor-pointer m-1 mt-0 rounded-lg border-0 text-left"
                  >
                    New Chat <Edit size={14} />
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full md:w-auto flex flex-col items-center px-4 sm:px-8 bg-white md:rounded-tl-2xl md:shadow-sm md:border md:border-gray-100 md:mx-4 md:mt-2 mx-0 mt-0 border-0 rounded-none shadow-none relative pb-6 scroll-smooth">
        <div className="w-full max-w-4xl flex flex-col pt-6 md:pt-10 min-h-full">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col items-start justify-center px-1 sm:px-0 mt-4 text-left w-full transition-all duration-500 ${isInitialState ? 'min-h-[70vh]' : 'mb-10'}`}
          >
            <div className="flex items-center justify-center rounded-3xl w-16 h-16 shadow-md mb-6 relative bg-white border border-gray-100 overflow-hidden shrink-0">
              <img src={appIcon} alt="App Icon" className="w-full h-full object-cover p-1" />
            </div>
            <h1 className="text-3xl sm:text-4xl mt-3 font-bold mb-4 tracking-tight text-black flex items-center justify-start gap-3">
              Hi, there <span className="inline-block hover:animate-pulse">👋</span>
            </h1>
            <p className="text-gray-600 text-[15px] sm:text-lg mb-8 font-medium max-w-2xl leading-relaxed">
              I'm Kamogelo's automated assistant. This tool allows recruiters to quickly access my files when I'm not available—designed to make your life easier. Choose a quick link below or ask me anything!
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4 w-full">
              <a href="/Kamogelo_Mosia_Transcript.pdf" download className="flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-5 py-3.5 bg-white border border-gray-200 hover:border-accent hover:text-accent shadow-sm rounded-xl text-black font-semibold text-sm sm:text-base transition-all hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                Academic Transcript
              </a>
              <a href="/Kamogelo_Mosia_ID.pdf" download className="flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-5 py-3.5 bg-white border border-gray-200 hover:border-accent hover:text-accent shadow-sm rounded-xl text-black font-semibold text-sm sm:text-base transition-all hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0"><rect width="18" height="14" x="3" y="5" rx="2" ry="2"/><path d="M7 15h4M15 15h2M7 11h2M15 11h2"/></svg>
                National ID Card
              </a>
            </div>
          </motion.div>

          {messages.length > 0 && (
            <div className="flex flex-col gap-6 md:gap-8 pb-8 flex-1 w-full relative">
              <div className="h-px bg-gray-100 w-full mb-2"></div>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "user" ? (
                    <div className="bg-gray-100 text-black px-5 py-3 md:px-6 md:py-4 rounded-xl max-w-[90%] sm:max-w-[75%] border border-gray-200">
                      <p className="text-sm md:text-base whitespace-pre-wrap font-medium">{msg.text}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col w-full max-w-[95%] sm:max-w-[85%]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center justify-center rounded-lg w-6 h-6 bg-white overflow-hidden shrink-0 border border-gray-100 p-0.5">
                           <img src={appIcon} alt="App Icon" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-semibold text-sm text-black">Kamogelo's GPT</span>
                      </div>
                      <div className="px-2 py-1 text-black">
                        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium text-gray-800">
                          {msg.text}
                        </p>
                        {msg.uiBlock === "projects" && <ProjectCards />}
                        {msg.uiBlock === "skills" && <SkillChips />}
                        {msg.uiBlock === "cv" && <DownloadCV />}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex w-full justify-start mt-2">
                  <div className="flex flex-col max-w-[95%] sm:max-w-[85%]">
                    <div className="flex items-center gap-2 mb-1">
                       <div className="flex items-center justify-center rounded-lg w-6 h-6 bg-white overflow-hidden shrink-0 border border-gray-100 p-0.5">
                           <img src={appIcon} alt="App Icon" className="w-full h-full object-cover" />
                       </div>
                       <span className="font-semibold text-sm text-black">Kamogelo's GPT</span>
                    </div>
                    <div className="px-4 py-3 bg-white border border-gray-100 rounded-xl flex items-center gap-3 max-w-max shadow-sm mt-1">
                      <svg className="animate-spin h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm font-medium text-gray-500">Generating...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div ref={endOfMessagesRef} className="h-40 sm:h-48 shrink-0 w-full" />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 pt-3 pb-6 xs:pb-8 px-4 xs:px-6 sm:px-8 flex justify-center z-10 pointer-events-none">
        <div className="w-full max-w-3xl relative pointer-events-auto">
          {/* Recording Overlay */}
          <AnimatePresence>
            {isRecording && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-20 bg-black text-white rounded-3xl flex items-center justify-center cursor-pointer shadow-xl overflow-hidden touch-none select-none"
                onPointerUp={stopRecording}
                onPointerLeave={stopRecording}
                onTouchEnd={stopRecording}
                onContextMenu={(e) => e.preventDefault()}
              >
                <div className="absolute inset-0 bg-red-500/20 animate-pulse"></div>
                <div className="flex flex-col items-center justify-center gap-2 z-10">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-red-500/50">
                    <Mic size={24} className="text-white" />
                  </div>
                  <span className="font-bold tracking-widest text-sm uppercase">Listening... Release to transcribe</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`w-full bg-white border ${isTranscribing ? 'border-accent shadow-accent/20' : 'border-gray-200'} rounded-3xl flex flex-col p-2 px-3 sm:px-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all max-h-[160px] relative`}>
            {isTranscribing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-3xl flex items-center justify-center gap-2">
                 <svg className="animate-spin h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 <span className="font-semibold text-sm text-accent">Transcribing audio...</span>
              </div>
            )}
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                 if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                 }
              }}
              placeholder="Ask me anything... (Hold Mic to speak)"
              className="w-full bg-transparent text-black py-2 px-1.5 focus:outline-none resize-none placeholder:text-gray-400 font-medium text-sm sm:text-base h-12"
              disabled={isLoading || isTranscribing}
              rows={1}
            />
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-transparent w-full">
               <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                 <button 
                    onClick={() => setModelSelectorOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100 font-semibold text-xs sm:text-xs transition-colors shadow-sm cursor-pointer shrink-0 max-w-[170px] xs:max-w-none truncate pointer-events-auto"
                    title="Select AI Model"
                 >
                    <Sparkles size={12} className="text-accent" />
                    <span className="truncate">
                      {selectedModel.includes("DeepSeek") ? "DeepSeek V4 Pro" : 
                       selectedModel.includes("Llama") ? "Llama 3.1 8B" : "GPT OSS 120B"}
                    </span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0"><path d="m6 9 6 6 6-6"/></svg>
                 </button>
               </div>
               <div className="flex items-center gap-1.5 shrink-0 pl-1">
                 <button
                    onPointerDown={(e) => { e.preventDefault(); startRecording(); }}
                    onContextMenu={(e) => e.preventDefault()}
                    className="flex items-center justify-center p-2.5 sm:p-3 md:p-3.5 rounded-xl bg-gray-100/80 text-gray-700 hover:bg-gray-200 hover:text-black transition-colors cursor-pointer select-none touch-none"
                    title="Hold to Speak"
                 >
                    <Mic size={20} className="sm:w-5 sm:h-5 w-4 h-4 ml-0.5 pointer-events-none" />
                 </button>
                 <button
                    onClick={() => handleSend(input)}
                    disabled={!input.trim() || isLoading || isTranscribing}
                    className="flex items-center justify-center p-2.5 sm:p-3 md:p-3.5 rounded-xl bg-black text-white hover:bg-accent disabled:bg-gray-200 disabled:text-gray-400 transition-colors shadow-md cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 select-none touch-none"
                    title="Send"
                 >
                    <Send size={20} className="sm:w-5 sm:h-5 w-4 h-4 ml-0.5 pointer-events-none" />
                 </button>
               </div>
            </div>
          </div>
          <div className="text-center mt-3">
             <span className="text-[11px] text-gray-400 font-medium">Kamogelo's GPT may display inaccurate info, so please double check the response. <a href="#" className="underline text-gray-500 hover:text-black transition-colors">Your Privacy & Kamogelo's GPT</a></span>
          </div>
        </div>
      </div>

      {/* Model Selection Modal Popup */}
      <AnimatePresence>
        {modelSelectorOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModelSelectorOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col p-6 text-black pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" />
                  Select Intelligence Engine
                </h3>
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  { id: "deepseek-ai/DeepSeek-V4-Pro:novita", name: "DeepSeek V4 Pro", desc: "Advanced reasoning & logic assistant" },
                  { id: "meta-llama/Llama-3.1-8B-Instruct:novita", name: "Llama 3.1 8B Instruct", desc: "High-speed conversational model" },
                  { id: "openai/gpt-oss-120b:groq", name: "GPT OSS 120B", desc: "High-performance open-weights engine" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel?.(m.id);
                      setModelSelectorOpen(false);
                    }}
                    className={`flex items-start text-left gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedModel === m.id
                        ? "border-accent bg-blue-50/20 ring-1 ring-accent"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                    }`}
                  >
                    <div className="flex flex-col flex-1 min-w-0 font-sans">
                      <span className="text-sm font-semibold text-black">{m.name}</span>
                      <span className="text-xs text-gray-400 font-medium truncate mt-0.5">{m.desc}</span>
                    </div>
                    {selectedModel === m.id && (
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white shrink-0 mt-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setModelSelectorOpen(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-black text-white hover:bg-gray-800 font-semibold text-sm transition-colors cursor-pointer"
              >
                Done
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
