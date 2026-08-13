const fs = require('fs');
let chat = fs.readFileSync('src/components/ChatInterface.tsx', 'utf8');

chat = chat.replace(/import \{ aiService, CHAT_PROMPT \} from "\.\.\/ai";/, '');
chat = chat.replace(/\{ role: "system", content: CHAT_PROMPT \},\n\s*/, '');

fs.writeFileSync('src/components/ChatInterface.tsx', chat);
console.log("Removed CHAT_PROMPT from ChatInterface.tsx");
