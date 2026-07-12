const fs = require('fs');
let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

// Put `!isStreaming` back into ResizeObserver auto-scroll so it doesn't auto-scroll while streaming
content = content.replace(
  "if (isNearBottom) {",
  "const isStreaming = messages.some(m => m.status === 'streaming');\n        if (isNearBottom && !isStreaming) {"
);

fs.writeFileSync('src/components/ChatInterface.tsx', content);
