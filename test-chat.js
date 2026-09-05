const { GoogleGenAI } = require("@google/genai");
const apiKey = process.env.GEMINI_API_KEY;
if(!apiKey) {
    console.log("No API Key");
} else {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{role: "user", parts: [{text: "Hello"}]}],
      config: { maxOutputTokens: 20 }
    }).then(r => console.log(r.text)).catch(e => console.error("ERR", e));
}
