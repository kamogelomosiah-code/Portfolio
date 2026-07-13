const fs = require('fs');
let content = fs.readFileSync('src/components/MobileApp.tsx', 'utf-8');

const oldScrollHelper = `  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);`;

const newScrollHelper = `  // Scroll to bottom helper
  const scrollToBottom = (behavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "agent") {
      setTimeout(() => {
        const msgEl = document.getElementById(\`msg-\${lastMsg.id}\`);
        if (msgEl && scrollContainerRef.current) {
           scrollContainerRef.current.scrollTo({
             top: msgEl.offsetTop - 20,
             behavior: 'smooth'
           });
        }
      }, 50);
    } else {
      scrollToBottom('smooth');
    }
  }, [messages.length, isLoading]);`;

content = content.replace(oldScrollHelper, newScrollHelper);
fs.writeFileSync('src/components/MobileApp.tsx', content);
