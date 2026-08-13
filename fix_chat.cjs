const fs = require('fs');

let chat = fs.readFileSync('src/components/ChatInterface.tsx', 'utf8');

// The file is corrupted between line 621 and 624.
// Let's replace the whole bottom section from the end of the textarea down to the end of the file.

const brokenPartStart = chat.indexOf('{/* Bottom Row: Actions & Send */}');

const newBottomPart = `
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
                  <div key={msg.id} className={\`flex w-full \${isUser ? "justify-end" : "justify-start"}\`}>
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
`;

const cleaned = chat.substring(0, brokenPartStart) + newBottomPart;
fs.writeFileSync('src/components/ChatInterface.tsx', cleaned);
console.log("ChatInterface fixed");
