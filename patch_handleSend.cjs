const fs = require('fs');
let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

// Remove the `setTimeout` that scrolls to the top of the agent message
const blockStart = content.indexOf('// Scroll to new agent message');
if (blockStart !== -1) {
  const blockEnd = content.indexOf('try {', blockStart);
  if (blockEnd !== -1) {
    const toRemove = content.substring(blockStart, blockEnd);
    content = content.replace(toRemove, '');
    fs.writeFileSync('src/components/ChatInterface.tsx', content);
    console.log("Removed scroll to top");
  }
}
