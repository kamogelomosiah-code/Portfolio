const fs = require('fs');
const content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf8');

let newContent = content.replace(
  'const resText = await aiService.chat([\n        { role: "system", content: CHAT_PROMPT },\n        ...chatHistory,\n        { role: "user", content: text.trim() }\n      ]);',
  `const apiMessages = [\n        { role: "system", content: CHAT_PROMPT },\n        ...chatHistory,\n        { role: "user", content: text.trim() }\n      ];\n      const res = await fetch("/api/openrouter/chat", {\n        method: "POST",\n        headers: { "Content-Type": "application/json" },\n        body: JSON.stringify({\n          messages: apiMessages,\n          options: { model: selectedModel === "large" ? "meta-llama/llama-3.3-70b-instruct" : "meta-llama/llama-3.3-70b-instruct", temperature: 0.7 }\n        })\n      });\n      if (!res.ok) throw new Error("AI request failed");\n      const data = await res.json();\n      const resText = data.choices?.[0]?.message?.content || "";`
);

// We should also remove the aiService import, but we'll leave it for now if we can't easily find it. Let's just fix the crash first.
fs.writeFileSync('src/components/ChatInterface.tsx', newContent);
console.log("Patched ChatInterface.tsx");
