const fs = require('fs');
let content = fs.readFileSync('src/components/chat/AIMessage.tsx', 'utf-8');
content = content.replace(
  'rounded-full bg-surface border border-outline-variant w-8 h-8 shadow-sm',
  'rounded-full bg-surface w-8 h-8 shadow-sm'
);
fs.writeFileSync('src/components/chat/AIMessage.tsx', content);
