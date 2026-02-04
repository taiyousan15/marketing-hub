/**
 * AI Provider 抽象化レイヤー
 * ローカルLLM (Ollama) と Claude API を切り替え可能
 */

export type AIProvider = 'ollama' | 'claude' | 'openai';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AICompletionResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProviderClient {
  complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult>;
  completeStream(messages: AIMessage[], options?: AICompletionOptions): AsyncGenerator<string>;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

/**
 * 現在のプロバイダーを取得
 */
export function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER as AIProvider;
  return provider || 'ollama'; // デフォルトはローカル
}

/**
 * AIクライアントを取得
 */
export async function getAIClient(): Promise<AIProviderClient> {
  const provider = getProvider();

  switch (provider) {
    case 'ollama':
      const { OllamaClient } = await import('./providers/ollama');
      return new OllamaClient();

    case 'claude':
      const { ClaudeClient } = await import('./providers/claude');
      return new ClaudeClient();

    case 'openai':
      const { OpenAIClient } = await import('./providers/openai');
      return new OpenAIClient();

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
