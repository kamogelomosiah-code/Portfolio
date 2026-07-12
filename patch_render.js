const fs = require('fs');
let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

// First add imports
if (!content.includes('AIMessage')) {
  content = content.replace('import MarkdownRenderer from "./MarkdownRenderer";', 'import MarkdownRenderer from "./MarkdownRenderer";\nimport { AIMessage } from "./chat/AIMessage";');
}

// Now replace the AI rendering block
// It starts from `/* 5 & 6. Assistant: Plain text on bg, avatar on left, shown once per group */`
// to the end of the map block `}`
// Actually, it's safer to use regex to replace everything inside the agent block.
// Wait, the current render looks like:
/*
                        ) : (
                          <div className="flex items-start gap-4 w-full max-w-full px-1">
                          ...
                          </div>
                        )}
*/

content = content.replace(/\/\* 5 & 6\. Assistant:[\s\S]*?(?=\n\s*\)\s*:\s*\(\s*\n|\n\s*\}\)\s*;\n|\n\s*\}\s*\)\s*;\s*\n)/, " ");
// Hmm, replacing with regex can be brittle. Let's just find the exact block.
