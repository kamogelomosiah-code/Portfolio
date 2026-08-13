const fs = require('fs');
const content = fs.readFileSync('src/components/MobileApp.tsx', 'utf8');

let newContent = content.replace(
  'const res = await fetch("/api/chat", {',
  'const apiMessages = [...history.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })), { role: "user", content: text.trim() }];\n      const res = await fetch("/api/openrouter/chat", {'
);

newContent = newContent.replace(
  'body: JSON.stringify({ \n          history, \n          message: text.trim(), \n          model: selectedModel === "large" ? "fusion" : "swift" \n        }),',
  'body: JSON.stringify({ \n          messages: apiMessages, \n          options: { model: selectedModel === "large" ? "meta-llama/llama-3.3-70b-instruct" : "anthropic/claude-3.5-sonnet", temperature: 0.7 } \n        }),'
);

newContent = newContent.replace(
  'let replyText = data.text || data.generated || "Sorry, I had trouble processing that.";',
  'let replyText = data.choices?.[0]?.message?.content || data.text || data.generated || "Sorry, I had trouble processing that.";'
);

newContent = newContent.replace(
  'const res = await fetch("/api/hf-health");',
  'const res = await fetch("/api/ping-model", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "anthropic/claude-3.5-sonnet" }) });'
);

fs.writeFileSync('src/components/MobileApp.tsx', newContent);
console.log("Patched MobileApp.tsx");
