const fs = require('fs');
let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

content = content.replace(
  "const isStreaming = messages.some(m => m.status === 'streaming');",
  "const isStreaming = messages.some(m => m.status === 'streaming' || m.status === 'loading');"
);

fs.writeFileSync('src/components/ChatInterface.tsx', content);
