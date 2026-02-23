/**
 * Gemini (Google AI) クライアント
 * @google/generative-ai SDK を使用
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AIProviderClient,
  AIMessage,
  AICompletionOptions,
  AICompletionResult,
} from '../provider';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const DEFAULT_EMBED_MODEL = 'text-embedding-004';

export class GeminiClient implements AIProviderClient {
  private genAI: GoogleGenerativeAI;
  private model: string;
  private embedModel: string;

  constructor(options?: { model?: string; embedModel?: string }) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.model = options?.model || DEFAULT_MODEL;
    this.embedModel = options?.embedModel || DEFAULT_EMBED_MODEL;
  }

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions,
  ): Promise<AICompletionResult> {
    const modelName = options?.model || this.model;
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const model = this.genAI.getGenerativeModel({
      model: modelName,
      ...(systemMessage
        ? { systemInstruction: systemMessage.content }
        : {}),
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 4096,
      },
    });

    const contents = chatMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const result = await model.generateContent({ contents });
    const response = result.response;
    const text = response.text();
    const usage = response.usageMetadata;

    return {
      content: text,
      model: modelName,
      usage: usage
        ? {
            promptTokens: usage.promptTokenCount ?? 0,
            completionTokens: usage.candidatesTokenCount ?? 0,
            totalTokens: usage.totalTokenCount ?? 0,
          }
        : undefined,
    };
  }

  async *completeStream(
    messages: AIMessage[],
    options?: AICompletionOptions,
  ): AsyncGenerator<string> {
    const modelName = options?.model || this.model;
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const model = this.genAI.getGenerativeModel({
      model: modelName,
      ...(systemMessage
        ? { systemInstruction: systemMessage.content }
        : {}),
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 4096,
      },
    });

    const contents = chatMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const result = await model.generateContentStream({ contents });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }

  async embed(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: this.embedModel });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results = await Promise.all(texts.map((text) => this.embed(text)));
    return results;
  }
}
