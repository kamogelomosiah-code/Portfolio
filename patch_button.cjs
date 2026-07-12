const fs = require('fs');
let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

const regex = /\{messages\.some\(m => m\.status === 'streaming'\) && \(/g;
content = content.replace(regex, `{messages.length > 0 && messages[messages.length - 1].role === 'agent' && (`);

// Also change the onClick to find the last agent message instead of the streaming message
content = content.replace(
  /const streamingMsg = messages\.find\(m => m\.status === 'streaming'\);/g,
  `const streamingMsg = [...messages].reverse().find(m => m.role === 'agent');`
);

fs.writeFileSync('src/components/ChatInterface.tsx', content);
