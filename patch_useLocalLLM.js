const fs = require('fs');
const content = fs.readFileSync('src/hooks/useLocalLLM.ts', 'utf8');
let newContent = content.replace(
  'const res = await fetch("/api/hf-health");',
  'const res = await fetch("/api/ping-model", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "google/gemini-2.5-flash" }) });'
);
newContent = newContent.replace(
  'const res = await fetch("/api/chat", {',
  'const messages = [...(history || []).map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text || m.content })), { role: "user", content: text }];\n    const res = await fetch("/api/openrouter/chat", {'
);
newContent = newContent.replace(
  'body: JSON.stringify({ \n        message: text, \n        model: model === "large" ? "fusion" : "swift" \n      }),',
  'body: JSON.stringify({ \n        messages,\n        options: { model: model === "large" ? "anthropic/claude-3-opus" : "google/gemini-2.5-flash" }\n      }),'
);
fs.writeFileSync('src/hooks/useLocalLLM.ts', newContent);
console.log("Patched useLocalLLM.ts");
