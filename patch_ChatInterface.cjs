const fs = require('fs');
const content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf8');

let newContent = content.replace(
  'const res = await fetch("/api/hf-health");',
  'const res = await fetch("/api/ping-model", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "google/gemini-2.5-flash" }) });'
);

// health check uses connected property which ping model also uses success
newContent = newContent.replace(
  'if (data.connected) {',
  'if (data.success || data.connected) {'
);

fs.writeFileSync('src/components/ChatInterface.tsx', newContent);
console.log("Patched ChatInterface.tsx");
