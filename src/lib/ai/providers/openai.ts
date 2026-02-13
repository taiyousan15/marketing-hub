/**
 * OpenAI API クライアント
 * 切り替え用（後から使用可能）
 */

import { AIProviderClient, AIMessage, AICompletionOptions, AICompletionResult } from '../provider';

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_EMBED_MODEL = 'text-embedding-3-small';

export class OpenAIClient implements AIProviderClient {
  private apiKey: string;
  private model: string;
  private embedModel: string;

  constructor(options?: { apiKey?: string; model?: string; embedModel?: string }) {
    this.apiKey = options?.apiKey || process.env.OPENAI_API_KEY || '';
    this.model = options?.model || DEFAULT_MODEL;
    this.embedModel = options?.embedModel || DEFAULT_EMBED_MODEL;

    if (!this.apiKey) {
      console.warn('OPENAI_API_KEY is not set. OpenAI API will not work.');
    }
  }

  async complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || this.model,
        max_tokens: options?.maxTokens || 1024,
        temperature: options?.temperature ?? 0.7,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  async *completeStream(messages: AIMessage[], options?: AICompletionOptions): AsyncGenerator<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || this.model,
        max_tokens: options?.maxTokens || 1024,
        temperature: options?.temperature ?? 0.7,
        stream: true,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices[0]?.delta?.content) {
              yield data.choices[0].delta.content;
            }
          } catch {
            // パースエラーは無視
          }
        }
      }
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.embedModel,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI Embed error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.embedModel,
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI Embed error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data.map((d: { embedding: number[] }) => d.embedding);
  }
}
