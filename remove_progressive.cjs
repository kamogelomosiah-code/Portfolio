const fs = require('fs');
let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

// The block is from `// Progressive Token/Word streaming effect` to the end of the useEffect.
const blockStart = content.indexOf('// Progressive Token/Word streaming effect');
if (blockStart !== -1) {
  const blockEnd = content.indexOf('}, 15); // lightning fast word streaming');
  const fullBlockEnd = content.indexOf('}, [messages, streamedTexts, currentlyStreamingId]);', blockEnd);
  
  if (fullBlockEnd !== -1) {
    const toRemove = content.substring(blockStart, fullBlockEnd + '}, [messages, streamedTexts, currentlyStreamingId]);'.length);
    content = content.replace(toRemove, '');
  }
}

fs.writeFileSync('src/components/ChatInterface.tsx', content);
