fetch("http://localhost:3000/api/gemini/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{role: "user", content: "hello"}] })
}).then(r => r.text()).then(console.log).catch(console.error);
