/**
 * AI ヘルスチェック API
 * GET /api/ai/health - プロバイダーの状態確認
 */

import { NextResponse } from 'next/server';
import { getProvider, getAIClient } from '@/lib/ai/provider';

export async function GET() {
  const provider = getProvider();
  const status: Record<string, unknown> = {
    provider,
    timestamp: new Date().toISOString(),
  };

  switch (provider) {
    case 'ollama': {
      try {
        const { OllamaClient } = await import('@/lib/ai/providers/ollama');
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
      break;
    }

    case 'claude': {
      const configured = !!process.env.ANTHROPIC_API_KEY;
      let available = false;

      if (configured) {
        try {
          const client = await getAIClient();
          await client.complete(
            [{ role: 'user', content: 'ping' }],
            { maxTokens: 5 }
          );
          available = true;
        } catch (error) {
          status.claudeError = error instanceof Error ? error.message : 'Unknown error';
        }
      }

      status.claude = { configured, available };
      break;
    }

    case 'openai': {
      status.openai = {
        configured: !!process.env.OPENAI_API_KEY,
      };
      break;
    }
  }

  return NextResponse.json(status);
}
