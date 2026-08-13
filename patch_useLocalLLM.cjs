const fs = require('fs');
const content = fs.readFileSync('src/hooks/useLocalLLM.ts', 'utf8');

let newContent = content.replace(
  'const res = await fetch("/api/hf-health");',
  'const res = await fetch("/api/ping-model", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "google/gemini-2.5-flash" }) });'
);

newContent = newContent.replace(
  'const generate = useCallback(async (text: string, { model = "tiny" } = {}) => {',
  'const generate = useCallback(async (text: string, { model = "tiny", history = [] }: { model?: string, history?: any[] } = {}) => {'
);

newContent = newContent.replace(
  'const res = await fetch("/api/chat", {',
  'const messages = [...(history || []).map((m: any) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text || m.content })), { role: "user", content: text }];\n    const res = await fetch("/api/openrouter/chat", {'
);

newContent = newContent.replace(
  'body: JSON.stringify({ \n        message: text, \n        model: model === "large" ? "fusion" : "swift" \n      }),',
  'body: JSON.stringify({ \n        messages,\n        options: { model: model === "large" ? "meta-llama/llama-3.3-70b-instruct" : "meta-llama/llama-3.3-70b-instruct" }\n      }),'
);

// We need to return choices[0].message.content for open router response
newContent = newContent.replace(
  'return { generated: data.text };',
  'return { generated: data.choices?.[0]?.message?.content || "" };'
);

// health check uses connected property which ping model also uses success
newContent = newContent.replace(
  'if (data.connected) {',
  'if (data.success || data.connected) {'
);

fs.writeFileSync('src/hooks/useLocalLLM.ts', newContent);
console.log("Patched useLocalLLM.ts");
