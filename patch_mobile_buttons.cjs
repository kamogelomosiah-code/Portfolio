const fs = require('fs');

let content = fs.readFileSync('src/components/MobileApp.tsx', 'utf-8');

const floatingButtons = `
        {/* Floating Scroll Controls */}
        <div className="absolute bottom-[90px] left-0 right-0 flex justify-center pointer-events-none z-20 gap-3">
          {(!isAtBottom || messages.some(m => m.status === 'streaming')) && (
            <div className="pointer-events-auto flex gap-2">
              {messages.some(m => m.status === 'streaming') && (
                <button
                  onClick={() => {
                    const streamingMsg = messages.find(m => m.status === 'streaming');
                    if (streamingMsg) {
                      const el = document.getElementById(\`msg-\${streamingMsg.id}\`);
                      if (el && scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTo({
                          top: el.offsetTop - 20,
                          behavior: 'smooth'
                        });
                      }
                    }
                  }}
                  className="flex items-center gap-1 bg-surface border border-outline-variant rounded-full px-3 py-1.5 shadow-md text-primary hover:bg-surface-container-high transition-all text-label-medium font-semibold"
                >
                  <MaterialIcon name="arrow_upward" className="text-body-small" />
                  Response Start
                </button>
              )}
              {!isAtBottom && (
                <button
                  onClick={() => {
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollTo({
                        top: scrollContainerRef.current.scrollHeight,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className="flex items-center justify-center w-8 h-8 bg-surface border border-outline-variant rounded-full shadow-md text-primary hover:bg-surface-container-high transition-all"
                >
                  <MaterialIcon name="arrow_downward" className="text-body-small" />
                </button>
              )}
            </div>
          )}
        </div>
`;

if (!content.includes('Floating Scroll Controls')) {
  // Insert before the composer
  const composerStart = '{/* Custom Composer fixed at bottom */}';
  if (content.includes(composerStart)) {
    content = content.replace(composerStart, floatingButtons + '\n' + composerStart);
  } else {
    const backupComposer = '{/* Input Area */}';
    if (content.includes(backupComposer)) {
      content = content.replace(backupComposer, floatingButtons + '\n' + backupComposer);
    }
  }
}

fs.writeFileSync('src/components/MobileApp.tsx', content);
