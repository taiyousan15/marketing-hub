import { NextRequest, NextResponse } from "next/server";
import { generateText, summarizeWebinarContent, generateQuestionAnswer } from "@/lib/ai/local-llm";

/**
 * 汎用AI生成エンドポイント
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { type, ...params } = body;

    switch (type) {
      case "text": {
        const { prompt, systemPrompt, model, temperature } = params;
        if (!prompt) {
          return NextResponse.json({ error: "prompt is required" }, { status: 400 });
        }
        const result = await generateText(prompt, { systemPrompt, model, temperature });
        return NextResponse.json({ result });
      }

      case "summarize": {
        const { transcript, style, maxLength, model } = params;
        if (!transcript) {
          return NextResponse.json({ error: "transcript is required" }, { status: 400 });
        }
        const result = await summarizeWebinarContent(transcript, { style, maxLength, model });
        return NextResponse.json({ result });
      }

      case "answer": {
        const { question, webinarTitle, webinarTopic, speakerName, additionalContext, model } = params;
        if (!question || !webinarTitle) {
          return NextResponse.json(
            { error: "question and webinarTitle are required" },
            { status: 400 }
          );
        }
        const result = await generateQuestionAnswer(
          question,
          { webinarTitle, webinarTopic, speakerName, additionalContext },
          { model }
        );
        return NextResponse.json({ result });
      }

      default:
        return NextResponse.json(
          {
            error: "Invalid type. Use: text, summarize, answer",
            examples: {
              text: { type: "text", prompt: "..." },
              summarize: { type: "summarize", transcript: "..." },
              answer: { type: "answer", question: "...", webinarTitle: "..." },
            },
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("AI generation failed:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isConnectionError =
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("Connection failed");

    return NextResponse.json(
      {
        error: isConnectionError
          ? "ローカルLLMサーバー（Ollama）に接続できません"
          : errorMessage,
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
