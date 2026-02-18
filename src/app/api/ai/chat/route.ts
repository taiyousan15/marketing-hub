import { NextRequest, NextResponse } from "next/server";
import { getAIClient } from "@/lib/ai/provider";
import { z } from "zod";

const requestSchema = z.object({
  message: z.string().min(1),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
  config: z
    .object({
      mode: z.string().optional().default("support"),
      temperature: z.number().optional().default(0.7),
      maxTokens: z.number().optional().default(500),
    })
    .optional()
    .default({}),
});

const SYSTEM_PROMPT = `あなたはマーケティング自動化プラットフォーム「MarketingHub」のAIサポートアシスタントです。
顧客からの問い合わせに丁寧かつ迅速に回答してください。

対応方針:
- 明確で簡潔な回答を心がける
- 専門用語は避け、わかりやすい言葉を使う
- 解決できない問題は担当者へエスカレーションする

エスカレーションが必要な場合（クレーム、返金、法的問題など）は、
返答の先頭に [担当者へエスカレーション] を付けてください。`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory, config } = requestSchema.parse(body);

    const client = await getAIClient();

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...conversationHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const result = await client.complete(messages, {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    const shouldHandoff = result.content.includes("[担当者へエスカレーション]");

    return NextResponse.json({
      response: {
        content: result.content.replace("[担当者へエスカレーション]", "").trim(),
        shouldHandoff,
      },
    });
  } catch (error) {
    console.error("AI chat error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isConnectionError =
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("Connection failed") ||
      errorMessage.includes("API error");

    return NextResponse.json(
      {
        error: isConnectionError
          ? "AIサービスに接続できません。Ollamaが起動しているか確認してください。"
          : errorMessage,
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
