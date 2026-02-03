import { NextRequest, NextResponse } from "next/server";
import { generateSimulatedChat } from "@/lib/ai/local-llm";

/**
 * AIでシミュレートチャットを生成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      description,
      videoDuration,
      topic,
      count = 20,
      density = "medium",
      includeQuestions = true,
      includeTestimonials = true,
      model,
    } = body;

    if (!title || !videoDuration) {
      return NextResponse.json(
        { error: "title and videoDuration are required" },
        { status: 400 }
      );
    }

    const messages = await generateSimulatedChat(
      {
        title,
        description,
        videoDuration,
        topic,
      },
      {
        count,
        density,
        includeQuestions,
        includeTestimonials,
        model,
      }
    );

    return NextResponse.json({
      messages,
      count: messages.length,
      model: model || process.env.OLLAMA_MODEL || "qwen2.5:7b",
    });
  } catch (error) {
    console.error("Chat generation failed:", error);

    // Ollamaが起動していない場合のエラーメッセージ
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isConnectionError =
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("Connection failed");

    return NextResponse.json(
      {
        error: isConnectionError
          ? "ローカルLLMサーバー（Ollama）に接続できません"
          : errorMessage,
        setup: isConnectionError
          ? {
              install: "curl -fsSL https://ollama.com/install.sh | sh",
              pull: "ollama pull qwen2.5:7b",
              start: "ollama serve",
            }
          : undefined,
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
