import { NextResponse } from "next/server";
import { checkOllamaHealth } from "@/lib/ai/local-llm";

/**
 * ローカルLLM（Ollama）のヘルスチェック
 */
export async function GET() {
  try {
    const health = await checkOllamaHealth();

    if (!health.available) {
      return NextResponse.json(
        {
          status: "unavailable",
          error: health.error,
          setup: {
            install: "curl -fsSL https://ollama.com/install.sh | sh",
            pull: "ollama pull qwen2.5:7b",
            start: "ollama serve",
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "available",
      models: health.models,
      recommended: ["qwen2.5:7b", "qwen2.5:14b", "gemma2:9b"],
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
