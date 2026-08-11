export type MessageRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stream?: boolean;
  onProgress?: (status: string) => void;
  onChunk?: (chunk: string) => void;
  responseFormat?: "json_object" | "text";
}

export interface AIProvider {
  id: string;
  name: string;
  isAvailable(): boolean;
  initialize(onProgress?: (status: string) => void, modelId?: string): Promise<void>;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
}
