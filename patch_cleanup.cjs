const fs = require('fs');
let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

// remove streamedTexts and currentlyStreamingId declarations
content = content.replace(/const \[streamedTexts, setStreamedTexts\] = useState<Record<string, string>>\(\{\}\);\n/, '');
content = content.replace(/const \[currentlyStreamingId, setCurrentlyStreamingId\] = useState<string \| null>\(null\);\n/, '');

// remove the progressive token/word streaming effect
content = content.replace(/\/\/ Progressive Token\/Word streaming effect[\s\S]*?\} else if \(!isStreaming\) \{\n\s*setCurrentlyStreamingId\(null\);\n\s*\}\n\s*\}\)\(\);\n\s*\}\n\s*\}, \[messages, currentlyStreamingId, streamedTexts\]\);\n/g, '');

// remove currentlyStreamingId from resizeObserver dependency
content = content.replace(/if \(isNearBottom && !currentlyStreamingId\) \{/g, 'if (isNearBottom) {');
content = content.replace(/\}, \[currentlyStreamingId\]\);/g, '}, []);');

// Replace `const isStreaming = currentlyStreamingId === msg.id;` with `const isStreaming = msg.status === "streaming";`
content = content.replace(/const isStreaming = currentlyStreamingId === msg\.id;/g, 'const isStreaming = msg.status === "streaming";');
content = content.replace(/const textToShow = isStreaming \? \(streamedTexts\[msg\.id\] \|\| ""\) : msg\.text;/g, 'const textToShow = msg.text;');

fs.writeFileSync('src/components/ChatInterface.tsx', content);
