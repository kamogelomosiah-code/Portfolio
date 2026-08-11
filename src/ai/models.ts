export interface AIModel {
  id: string;
  name: string;
  provider: "openrouter" | "webllm";
  description?: string;
}

export const AVAILABLE_MODELS: AIModel[] = [
  // WebLLM Local
  { id: "Llama-3.2-1B-Instruct-q4f32_1-MLC", name: "Llama 3.2 1B", provider: "webllm", description: "Local fast model" },
  
  // OpenRouter Models
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "openrouter" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", provider: "openrouter" },
  { id: "google/gemini-pro-1.5", name: "Gemini 1.5 Pro", provider: "openrouter" },
  { id: "google/gemini-flash-1.5", name: "Gemini 1.5 Flash", provider: "openrouter" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "openrouter" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "openrouter" },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B", provider: "openrouter" },
  { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B", provider: "openrouter" },
  { id: "deepseek/deepseek-coder", name: "DeepSeek Coder", provider: "openrouter" }
];
