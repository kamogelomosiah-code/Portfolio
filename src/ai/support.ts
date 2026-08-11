import { aiService, SUPPORT_PROMPT } from './index';

export async function askSupportAssistant(
  message: string, 
  chatHistory: { role: "system" | "user" | "assistant", content: string }[],
  onProgress?: (status: string) => void,
  onChunk?: (chunk: string) => void,
  useWebLookup: boolean = false
): Promise<string> {
  let finalMessage = message;

  // Hybrid web lookup
  if (useWebLookup) {
    if (onProgress) onProgress("Searching latest Anthropic documentation...");
    try {
      const res = await fetch('/api/support/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message })
      });
      const data = await res.json();
      if (data.results) {
        finalMessage = `User Query: ${message}\n\nLatest Web Context:\n${data.results}\n\nUse this context to inform your answer.`;
      }
    } catch (err) {
      console.error("Web lookup failed:", err);
    }
  }

  if (onProgress) onProgress("Generating response...");

  const messages = [
    { role: "system" as const, content: SUPPORT_PROMPT },
    ...chatHistory.map(m => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: finalMessage }
  ];

  return await aiService.chat(messages, {
    temperature: 0.3,
    stream: !!onChunk,
    onProgress,
    onChunk
  });
}
