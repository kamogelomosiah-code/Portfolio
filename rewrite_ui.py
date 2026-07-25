import re

with open('src/components/ChatInterface.tsx', 'r') as f:
    code = f.read()

# Find where renderComposer starts
idx = code.find('  const renderComposer = (isFixed: boolean) => {')
if idx == -1:
    print("Could not find renderComposer")
    exit(1)

# Keep everything before renderComposer
new_code = code[:idx]

new_ui = """  const isInitialState = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#1E1E2E] w-full font-sans antialiased text-white">
      {/* Header */}
      <div className="h-[72px] px-6 sm:px-8 flex justify-between items-center shrink-0 border-b border-white/5 shadow-sm bg-[#1a1a24] z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A90E2] to-[#00B4D8] flex items-center justify-center text-white font-bold text-lg shadow-md">
            K
          </div>
          <div>
            <div className="font-bold text-lg text-white leading-tight">Kamogelo</div>
            <div className="text-xs font-medium text-[#00B4D8] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] animate-pulse shadow-[0_0_8px_#00B4D8]" />
              Assistant Connected
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {onViewCv && (
            <button onClick={onViewCv} className="hidden sm:flex items-center gap-2 bg-[#4A90E2]/10 hover:bg-[#4A90E2]/20 text-[#4A90E2] px-4 py-2 rounded-xl font-medium text-sm transition-all border border-[#4A90E2]/20">
              <FileText size={16} />
              <span>Download CV</span>
            </button>
          )}
          <button onClick={() => setShowSettingsModal(true)} className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5">
            <MaterialIcon name="settings" className="text-[22px]" />
          </button>
        </div>
      </div>
      
      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-end" onClick={() => setShowSettingsModal(false)}>
          <motion.div 
            initial={{ x: "100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="bg-[#2a2a3c] h-full w-full max-w-sm shadow-2xl p-6 flex flex-col border-l border-white/10" 
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
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium border flex items-center justify-between transition-colors ${selectedModel === "large" ? "bg-[#4A90E2]/10 text-[#4A90E2] border-[#4A90E2]/30" : "bg-black/20 text-gray-300 border-white/5 hover:bg-black/40"} ${isLargeReady === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${aiEngine === "cloud" ? "bg-[#4A90E2]/10 text-[#4A90E2] border-[#4A90E2]/30" : "bg-black/20 text-gray-300 border-white/5 hover:bg-black/40"}`}
                >
                  Cloud Core
                </button>
                <button
                  onClick={() => setAiEngine("local")}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${aiEngine === "local" ? "bg-[#4A90E2]/10 text-[#4A90E2] border-[#4A90E2]/30" : "bg-black/20 text-gray-300 border-white/5 hover:bg-black/40"}`}
                >
                  Local WebAI
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Conversation Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0 bg-[#1E1E2E] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a2a3c] via-[#1E1E2E] to-[#1E1E2E]">

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
                      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-2 mb-1.5 px-1">
                          {!isUser && <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#4A90E2] to-[#00B4D8] flex items-center justify-center text-[10px] font-bold text-white">K</div>}
                          <span className="text-[13px] font-medium text-gray-400">{isUser ? "You" : "Kamogelo"}</span>
                          <span className="text-[11px] text-gray-500">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div 
                          className={`px-5 py-3.5 rounded-2xl shadow-sm ${isUser ? "bg-[#4A90E2] text-white rounded-tr-sm" : "bg-[#2a2a3c] text-gray-100 rounded-tl-sm border border-white/5"}`}
                        >
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
                        <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-[#2a2a3c] border border-white/5 flex items-center gap-1.5">
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
        <div className="w-full shrink-0 z-20 bg-gradient-to-t from-[#1E1E2E] via-[#1E1E2E] to-transparent pt-6 pb-6 px-4 sm:px-8 flex flex-col items-center">
          
          <div className="w-full max-w-[850px] mx-auto flex flex-col">
            
            {/* Quick Suggestions */}
            <div className="w-full mb-4 flex items-center">
              <div className="flex-1 overflow-x-auto no-scrollbar pb-2 -mb-2 flex gap-3">
                {PROMPT_SETS[promptSetIndex].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt.text)}
                    className="shrink-0 flex items-center gap-2.5 px-4 py-2.5 bg-[#2a2a3c] hover:bg-[#34344a] border border-white/5 rounded-xl transition-all cursor-pointer shadow-sm group"
                  >
                    <div className="text-[#00B4D8] group-hover:scale-110 transition-transform">
                      {renderPromptIcon(prompt.icon)}
                    </div>
                    <span className="text-sm font-medium text-gray-300 whitespace-nowrap">{prompt.text}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPromptSetIndex((prev) => (prev + 1) % PROMPT_SETS.length)}
                className="ml-3 shrink-0 w-10 h-10 rounded-full bg-[#2a2a3c] hover:bg-[#34344a] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-sm"
                title="Refresh Suggestions"
              >
                <RotateCw size={18} />
              </button>
            </div>

            {/* Input Bar */}
            <div className="w-full bg-[#2a2a3c] rounded-[24px] p-1.5 shadow-lg shadow-black/20 border border-white/10 focus-within:border-[#4A90E2]/50 focus-within:shadow-[0_0_15px_rgba(74,144,226,0.15)] transition-all flex items-end relative">
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
"""

with open('src/components/ChatInterface.tsx', 'w') as f:
    f.write(new_code + new_ui)
