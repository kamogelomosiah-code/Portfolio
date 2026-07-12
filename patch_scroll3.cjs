const fs = require('fs');
let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

// Replace `if (isNearBottom && !isStreaming)` with `if (isNearBottom)`
content = content.replace(
  "if (isNearBottom && !isStreaming) {",
  "if (isNearBottom) {"
);

fs.writeFileSync('src/components/ChatInterface.tsx', content);
