import { NextRequest, NextResponse } from "next/server";
import { generateOfferCopy } from "@/lib/ai/local-llm";

/**
 * AIでオファーコピーを生成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      productName,
      productDescription,
      targetAudience,
      price,
      originalPrice,
      deadline,
      style = "benefit",
      variations = 3,
      model,
    } = body;

    if (!productName) {
      return NextResponse.json(
        { error: "productName is required" },
        { status: 400 }
      );
    }

    const offers = await generateOfferCopy(
      {
        productName,
        productDescription,
        targetAudience,
        price,
        originalPrice,
        deadline,
      },
      {
        style,
        variations,
        model,
      }
    );

    return NextResponse.json({
      offers,
      count: offers.length,
      style,
      model: model || process.env.OLLAMA_MODEL || "qwen2.5:7b",
    });
  } catch (error) {
    console.error("Offer generation failed:", error);

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
