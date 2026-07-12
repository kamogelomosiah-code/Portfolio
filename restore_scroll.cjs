const fs = require('fs');
let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

// Restore !isStreaming
content = content.replace(
  "if (isNearBottom) {",
  "const isStreaming = messages.some(m => m.status === 'streaming');\n        if (isNearBottom && !isStreaming) {"
);

// Restore setTimeout in handleSend
// Let's find where to insert it: after `setActiveClarifications([]);`
const insertPoint = content.indexOf('setActiveClarifications([]);') + 'setActiveClarifications([]);'.length;
if (insertPoint !== -1 + 'setActiveClarifications([]);'.length) {
  const toInsert = `
    // Scroll to new agent message
    setTimeout(() => {
      const el = document.getElementById(\`msg-\${agentMsgId}\`);
      if (el && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: el.offsetTop - 20,
          behavior: 'smooth'
        });
      }
    }, 50);
`;
  content = content.substring(0, insertPoint) + toInsert + content.substring(insertPoint);
}

fs.writeFileSync('src/components/ChatInterface.tsx', content);
