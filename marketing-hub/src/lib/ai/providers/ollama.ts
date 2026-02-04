/**
 * Ollama (ローカルLLM) クライアント
 * コスト: ¥0 / 必要: Mac M1以上 または GPU搭載PC
 */

import { AIProviderClient, AIMessage, AICompletionOptions, AICompletionResult } from '../provider';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
const DEFAULT_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

export class OllamaClient implements AIProviderClient {
  private baseUrl: string;
  private model: string;
  private embedModel: string;

  constructor(options?: { baseUrl?: string; model?: string; embedModel?: string }) {
    this.baseUrl = options?.baseUrl || OLLAMA_BASE_URL;
    this.model = options?.model || DEFAULT_MODEL;
    this.embedModel = options?.embedModel || DEFAULT_EMBED_MODEL;
  }

  /**
   * チャット補完
   */
  async complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model || this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 1024,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama error: ${error}`);
    }

    const data = await response.json();

    return {
      content: data.message.content,
      model: data.model,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
    };
  }

  /**
   * ストリーミング補完
   */
  async *completeStream(messages: AIMessage[], options?: AICompletionOptions): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model || this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 1024,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama error: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            yield data.message.content;
          }
        } catch {
          // JSONパースエラーは無視
        }
      }
    }
  }

  /**
   * テキスト埋め込み（単一）
   */
  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.embedModel,
        prompt: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama embed error: ${error}`);
    }

    const data = await response.json();
    return data.embedding;
  }

  /**
   * テキスト埋め込み（バッチ）
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    // Ollamaはバッチをサポートしないので、並列実行
    const results = await Promise.all(texts.map(text => this.embed(text)));
    return results;
  }

  /**
   * モデル一覧を取得
   */
  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }
    const data = await response.json();
    return data.models.map((m: { name: string }) => m.name);
  }

  /**
   * Ollamaが起動しているか確認
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
