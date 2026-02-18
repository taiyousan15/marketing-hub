import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OcrClient } from "@/lib/ocr/client";

const requestSchema = z.object({
  imageBase64: z.string().min(1),
  mode: z.enum(["text", "table", "formula", "auto"]).default("auto"),
  language: z.enum(["ja", "en", "auto"]).optional().default("auto"),
  additionalPrompt: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = requestSchema.parse(body);

    const client = new OcrClient();
    const result = await client.extract(validated);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("OCR extraction error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "リクエストが不正です", details: error.issues },
        { status: 400 }
      );
    }

    const msg = error instanceof Error ? error.message : "Unknown error";

    if (msg.includes("接続") || msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
      return NextResponse.json(
        { error: "Ollama に接続できません。Ollama が起動しているか確認してください。" },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
