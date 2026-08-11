import { AIProvider, ChatMessage, ChatOptions } from "./types";
import { OpenRouterProvider } from "./providers/OpenRouterProvider";
import { WebLLMProvider } from "./providers/WebLLMProvider";
import { AVAILABLE_MODELS } from "./models";

export class AIService {
  private static instance: AIService;
  private providers: Map<string, AIProvider> = new Map();
  private currentProviderId: string = "openrouter";
  private currentModelId: string = "anthropic/claude-3.5-sonnet"; // Default to a good model

  private constructor() {
    this.providers.set("openrouter", new OpenRouterProvider());
    this.providers.set("webllm", new WebLLMProvider());
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public setProviderAndModel(providerId: string, modelId: string) {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider ${providerId} not found.`);
    }
    this.currentProviderId = providerId;
    this.currentModelId = modelId;
  }
  
  public getProviderAndModel() {
    return { provider: this.currentProviderId, model: this.currentModelId };
  }

  private getProvider(): AIProvider {
    const provider = this.providers.get(this.currentProviderId);
    if (!provider) throw new Error("Current provider not initialized.");
    return provider;
  }

  public async initialize(onProgress?: (status: string) => void): Promise<void> {
    const provider = this.getProvider();
    await provider.initialize(onProgress);
  }

  public async chat(messages: ChatMessage[], options?: Omit<ChatOptions, 'model'>): Promise<string> {
    const provider = this.getProvider();
    
    // Auto initialize if needed (some providers like OpenRouter don't need it, but WebLLM might)
    if (provider.id === 'webllm') {
       await provider.initialize(options?.onProgress, this.currentModelId);
    }
    
    try {
      return await provider.chat(messages, {
        ...options,
        model: this.currentModelId
      });
    } catch (error: any) {
      console.error(`AIService Chat Error [${provider.id}]:`, error);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }
}

export const aiService = AIService.getInstance();
