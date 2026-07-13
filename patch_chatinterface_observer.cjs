const fs = require('fs');
let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

const oldObserver = `  // Resize observer to scroll when bubble height increases dynamically
  useEffect(() => {
    if (!scrollContentRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        const isStreaming = messages.some(m => m.status === 'streaming' || m.status === 'loading');
        if (isNearBottom && !isStreaming) {
          scrollToBottom('smooth');
        }
      }
    });

    resizeObserver.observe(scrollContentRef.current);
    return () => resizeObserver.disconnect();
  }, []);`;

content = content.replace(oldObserver, '');
fs.writeFileSync('src/components/ChatInterface.tsx', content);
