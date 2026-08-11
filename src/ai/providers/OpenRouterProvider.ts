import { AIProvider, ChatMessage, ChatOptions } from "../types";

export class OpenRouterProvider implements AIProvider {
  id = "openrouter";
  name = "OpenRouter";

  isAvailable(): boolean {
    return true; // We assume the backend is configured with the API key
  }

  async initialize(onProgress?: (status: string) => void, modelId?: string): Promise<void> {
    if (onProgress) onProgress("Initializing OpenRouter...");
    // No local initialization needed for backend-proxied API
    return Promise.resolve();
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    const response = await fetch("/api/openrouter/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, options }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `OpenRouter request failed with status ${response.status}`);
    }

    if (options?.stream && options.onChunk) {
      if (!response.body) throw new Error("No response body for streaming");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        
        // Basic SSE parser
        const lines = chunk.split('\\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6));
              const textChunk = data.choices[0]?.delta?.content || "";
              fullText += textChunk;
              options.onChunk(fullText);
            } catch (e) {
              // Ignore parse errors on incomplete chunks
            }
          }
        }
      }
      return fullText;
    } else {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    }
  }
}
