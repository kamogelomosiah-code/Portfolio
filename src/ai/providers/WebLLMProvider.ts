import { AIProvider, ChatMessage, ChatOptions } from "../types";
import * as webllm from "@mlc-ai/web-llm";

export class WebLLMProvider implements AIProvider {
  id = "webllm";
  name = "WebLLM (Local)";
  private engine: webllm.MLCEngine | null = null;
  private currentModel: string | null = null;

  isAvailable(): boolean {
    return true; // Technically available in browser environments with WebGPU
  }

  async initialize(onProgress?: (status: string) => void, modelId: string = "Llama-3.2-1B-Instruct-q4f32_1-MLC"): Promise<void> {
    if (this.engine && this.currentModel === modelId) return;

    this.engine = new webllm.MLCEngine({
      appConfig: {
        model_list: webllm.prebuiltAppConfig.model_list,
        cacheBackend: "indexeddb"
      },
      initProgressCallback: (progress) => {
        if (onProgress) {
          const percent = Math.round((progress.progress || 0) * 100);
          onProgress(`Loading local AI: ${percent > 0 ? percent + '%' : progress.text || 'Preparing...'}`);
        }
      }
    });

    await this.engine.reload(modelId);
    this.currentModel = modelId;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    if (!this.engine) {
      throw new Error("WebLLM Provider not initialized.");
    }
    
    // We must ensure the correct model is loaded before chatting if options.model is different
    if (options?.model && options.model !== this.currentModel) {
       await this.initialize(options.onProgress, options.model);
    }

    const webllmMessages: webllm.ChatCompletionMessageParam[] = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    if (options?.stream && options.onChunk) {
      const asyncChunkGenerator = await this.engine.chat.completions.create({
        messages: webllmMessages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens,
        stream: true,
      });
      
      let fullResponse = "";
      for await (const chunk of asyncChunkGenerator) {
        const text = chunk.choices[0]?.delta?.content || "";
        fullResponse += text;
        options.onChunk(fullResponse);
      }
      return fullResponse;
    } else {
      const response = await this.engine.chat.completions.create({
        messages: webllmMessages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens,
        response_format: options.responseFormat === "json_object" ? { type: "json_object" } : undefined
      });
      return response.choices[0]?.message?.content || "";
    }
  }
}
