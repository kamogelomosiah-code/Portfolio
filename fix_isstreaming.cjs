const fs = require('fs');
let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

// Replace all multiple declarations with a single one
const toReplace = `        const isStreaming = messages.some(m => m.status === 'streaming' || m.status === 'loading');
        const isStreaming = messages.some(m => m.status === 'streaming');
        const isStreaming = messages.some(m => m.status === 'streaming');`;
        
const replacement = `        const isStreaming = messages.some(m => m.status === 'streaming' || m.status === 'loading');`;

content = content.replace(toReplace, replacement);
fs.writeFileSync('src/components/ChatInterface.tsx', content);
