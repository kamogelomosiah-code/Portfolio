import { pipeline, env } from '@xenova/transformers';

// Configure environment for browser environment
env.allowLocalModels = true;

export interface ModelConfig {
  model: string;
  task: string;
  description: string;
  fallback: string;
}

export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  math: {
    model: 'Xenova/gpt2',                 // Test with a simpler model
    task: 'text-generation',
    description: 'Math and calculations',
    fallback: 'reasoning',
  },
  speaking: {
    model: 'Xenova/gpt2',           // Standardized
    task: 'text-generation',
    description: 'Natural conversation',
    fallback: 'reasoning',
  },
  planning: {
    model: 'Xenova/gpt2',                // Change to a text-generation model
    task: 'text-generation',
    description: 'Task planning and structure',
    fallback: 'reasoning',
  },
  reasoning: {
    model: 'Xenova/gpt2',           // Standardized
    task: 'text-generation',
    description: 'General reasoning',
    fallback: '',                     // No fallback to avoid cycle
  },
};

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'failed' | 'fallback' | 'fallback-loaded' | 'unavailable';

export class ModelRouter {
  public models: Record<string, any> = {};
  public modelStatus: Record<string, ModelStatus> = {
    math: 'idle',
    speaking: 'idle',
    planning: 'idle',
    reasoning: 'idle',
  };
  public modelProgress: Record<string, number> = {
    math: 0,
    speaking: 0,
    planning: 0,
    reasoning: 0,
  };
  public initialized = false;
  public loadingInProcess = false;
  public fallbackChain = ['math', 'speaking', 'planning', 'reasoning'];
  
  // Custom listeners
  private statusListeners: Set<(status: Record<string, ModelStatus>, progress: Record<string, number>) => void> = new Set();

  constructor() {}

  subscribe(listener: (status: Record<string, ModelStatus>, progress: Record<string, number>) => void) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private notify() {
    this.statusListeners.forEach(listener => listener({ ...this.modelStatus }, { ...this.modelProgress }));
  }

  public loadingPromise: Promise<void> | null = null;

  // Load all models
  async loadModels() {
    if (this.initialized) return;
    this.initialized = true;
    for (const key in this.modelStatus) {
      this.modelStatus[key] = 'ready';
      this.modelProgress[key] = 100;
    }
    this.notify();
    console.log('✅ Models initialized (simulated)');
  }

  // Load a fallback model for a failed one
  async loadFallback(modelKey: string) {
    // Skip fallback loading as models are simulated as ready
  }

  // Task routing – pick the best model for the user input
  routeTask(userInput: string): string {
    const input = userInput.toLowerCase();

    if (/\d|\+|\-|\*|\/|calculate|math|equation|sum|total/.test(input)) {
      return 'math';
    }
    if (/hi|hello|how are you|tell me|explain|conversation|talk|speak/.test(input)) {
      return 'speaking';
    }
    if (/plan|organize|steps|first|then|next|schedule|goal|project/.test(input)) {
      return 'planning';
    }
    return 'reasoning'; // default
  }

  // Generate a response – with automatic fallback
  async generateResponse(userInput: string, thinkingMode = false) {
    if (!this.initialized) {
      await this.loadModels();
    }

    const primaryModel = this.routeTask(userInput);
    let model = this.models[primaryModel];
    let usedModel = primaryModel;

    // If primary model is unavailable, try fallback chain
    if (!model || this.modelStatus[primaryModel] === 'unavailable') {
      for (const fallback of this.fallbackChain) {
        if (this.models[fallback] && this.modelStatus[fallback] !== 'unavailable') {
          model = this.models[fallback];
          usedModel = fallback;
          console.log(`🔄 Using ${fallback} as fallback for ${primaryModel}`);
          break;
        }
      }
    }

    // If still no model, use any available model
    if (!model) {
      const available = Object.keys(this.models).find(
        (k) => this.modelStatus[k] !== 'unavailable' && this.modelStatus[k] !== 'idle'
      );
      if (available) {
        model = this.models[available];
        usedModel = available;
      } else {
        throw new Error('No models are available.');
      }
    }

    // Thinking mode: bounce across multiple models
    if (thinkingMode) {
      return await this.thinkingMode(userInput, primaryModel);
    }

    // Standard generation
    console.log(`🧠 Using ${usedModel} for: "${userInput}"`);
    const result = await model(userInput, {
      max_new_tokens: 100,
      temperature: 0.7,
    });

    return {
      response: result[0]?.generated_text || result,
      model: usedModel,
      status: this.modelStatus[usedModel],
    };
  }

  // Thinking mode – get consensus from up to 3 models
  async thinkingMode(userInput: string, primaryModel: string) {
    console.log('🧠 THINKING MODE: Bouncing across models...');

    const availableModels = Object.keys(this.models).filter(
      (k) => this.modelStatus[k] !== 'unavailable' && this.models[k]
    );

    if (availableModels.length < 2) {
      console.warn('⚠️ Not enough models for thinking mode, using primary');
      return this.generateResponse(userInput, false);
    }

    // Get responses from up to 3 models
    const responses = await Promise.all(
      availableModels.slice(0, 3).map(async (key) => {
        try {
          const result = await this.models[key](userInput, {
            max_new_tokens: 80,
            temperature: 0.5,
          });
          return {
            model: key,
            text: result[0]?.generated_text || result,
          };
        } catch (e: any) {
          return { model: key, text: '[error]', error: e.message };
        }
      })
    );

    // Filter out errors and combine
    const valid = responses.filter((r) => r.text !== '[error]');
    const combined = valid
      .map((r) => `[${r.model}]: ${r.text}`)
      .join('\n\n');

    // Use primary model to synthesise a final answer
    const synthesisPrompt = `Synthesise these responses into one coherent answer:\n${combined}`;
    const finalResult = await this.models[primaryModel](synthesisPrompt, {
      max_new_tokens: 150,
      temperature: 0.4,
    });

    return {
      response: finalResult[0]?.generated_text || combined,
      model: primaryModel,
      thinking: true,
      consensus: responses,
      status: this.modelStatus,
    };
  }

  // Status checker
  getStatus() {
    return {
      models: this.modelStatus,
      progress: this.modelProgress,
      available: Object.values(this.modelStatus).filter(
        (s) => s === 'ready' || s === 'fallback' || s === 'fallback-loaded'
      ).length,
      total: Object.keys(this.modelStatus).length,
    };
  }
}

export const router = new ModelRouter();

export async function handleUserInput(text: string, thinking = false) {
  try {
    const result = await router.generateResponse(text, thinking);
    console.log('📤 Response:', result);
    return result;
  } catch (err: any) {
    console.error('❌ Error:', err);
    return { error: err.message };
  }
}
