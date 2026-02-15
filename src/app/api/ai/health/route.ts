/**
 * AI ヘルスチェック API
 * GET /api/ai/health - プロバイダーの状態確認
 */

import { NextResponse } from 'next/server';
import { getProvider } from '@/lib/ai/provider';
import { OllamaClient } from '@/lib/ai/providers/ollama';

export async function GET() {
  const provider = getProvider();
  const status: Record<string, unknown> = {
    provider,
    timestamp: new Date().toISOString(),
  };

  if (provider === 'ollama') {
    try {
      const client = new OllamaClient();
      const isAvailable = await client.isAvailable();
      const models = isAvailable ? await client.listModels() : [];

      status.ollama = {
        available: isAvailable,
        models,
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        defaultModel: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
      };
    } catch (error) {
      status.ollama = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  if (provider === 'claude') {
    status.claude = {
      configured: !!process.env.ANTHROPIC_API_KEY,
    };
  }

  if (provider === 'openai') {
    status.openai = {
      configured: !!process.env.OPENAI_API_KEY,
    };
  }

  return NextResponse.json(status);
}
