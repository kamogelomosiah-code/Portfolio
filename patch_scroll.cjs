const fs = require('fs');
let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

// Add isAtBottom state
if (!content.includes('const [isAtBottom')) {
  content = content.replace('const [isScrolled, setIsScrolled] = useState(false);', 'const [isScrolled, setIsScrolled] = useState(false);\n  const [isAtBottom, setIsAtBottom] = useState(true);');
}

// Update handleScroll
const newHandleScroll = `  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setIsScrolled(scrollTop > 20);
    lastScrollY.current = scrollTop;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  };`;
content = content.replace(/const handleScroll = \(e: UIEvent<HTMLDivElement>\) => \{[\s\S]*?\};\n/, newHandleScroll + '\n');

// Add Floating buttons near the bottom
// We can find the place just before `{/* Custom Composer fixed at bottom`
const composerSection = `        {/* Custom Composer fixed at bottom - always displayed to be sticky bottom and always visible */}`;

const floatingButtons = `
        {/* Floating Scroll Controls */}
        <div className="absolute bottom-[100px] left-0 right-0 flex justify-center pointer-events-none z-20 gap-3">
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
                  onClick={() => scrollToBottom('smooth')}
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
  content = content.replace(composerSection, floatingButtons + '\n' + composerSection);
}

fs.writeFileSync('src/components/ChatInterface.tsx', content);
