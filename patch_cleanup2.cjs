const fs = require('fs');
let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

// The effect to remove starts at "// Progressive Token/Word streaming effect"
// and ends where the next thing is.
const effectStart = content.indexOf('  // Progressive Token/Word streaming effect');
if (effectStart !== -1) {
  // find the end of this useEffect. It ends with: `  }, [messages, currentlyStreamingId, streamedTexts]);`
  const effectEnd = content.indexOf('  }, [messages, currentlyStreamingId, streamedTexts]);', effectStart);
  if (effectEnd !== -1) {
    content = content.substring(0, effectStart) + content.substring(effectEnd + 55);
  }
}

// Modify resizeObserver to check for streaming state
content = content.replace(
  "if (isNearBottom) {",
  "const isStreaming = messages.some(m => m.status === 'streaming');\n        if (isNearBottom && !isStreaming) {"
);

fs.writeFileSync('src/components/ChatInterface.tsx', content);
