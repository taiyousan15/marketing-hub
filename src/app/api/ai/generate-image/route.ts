import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { IMAGE_MODELS } from "@/lib/ai-media/models";

const requestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  modelId: z.string(),
  aspectRatio: z.string().optional().default("1:1"),
  quality: z.enum(["standard", "hd"]).optional().default("standard"),
});

const FAL_ASPECT_RATIO_MAP: Record<string, string> = {
  "1:1": "square",
  "16:9": "landscape_16_9",
  "9:16": "portrait_9_16",
  "4:3": "landscape_4_3",
  "3:4": "portrait_3_4",
  "21:9": "landscape_21_9",
};

const OPENAI_SIZE_MAP: Record<string, string> = {
  "1:1": "1024x1024",
  "16:9": "1792x1024",
  "9:16": "1024x1792",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, modelId, aspectRatio, quality } = requestSchema.parse(body);

    const model = IMAGE_MODELS.find((m) => m.id === modelId);
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 400 });
    }

    if (model.provider === "fal") {
      const falApiKey = process.env.FAL_API_KEY;
      if (!falApiKey) {
        return NextResponse.json(
          { error: "FAL_API_KEY が設定されていません。.env に FAL_API_KEY を追加してください。" },
          { status: 503 }
        );
      }

      const response = await fetch(`https://fal.run/${model.apiId}`, {
        method: "POST",
        headers: {
          Authorization: `Key ${falApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          aspect_ratio: FAL_ASPECT_RATIO_MAP[aspectRatio] || "square",
          num_images: 1,
          output_format: "jpeg",
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`fal.ai エラー: ${response.status} - ${err}`);
      }

      const data = await response.json();
      const imageUrl = data.images?.[0]?.url;
      if (!imageUrl) throw new Error("レスポンスに画像URLが含まれていません");

      return NextResponse.json({ imageUrl, model: model.name });
    }

    if (model.provider === "openai") {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return NextResponse.json(
          { error: "OPENAI_API_KEY が設定されていません。.env に OPENAI_API_KEY を追加してください。" },
          { status: 503 }
        );
      }

      const size = OPENAI_SIZE_MAP[aspectRatio] || "1024x1024";
      const requestBody: Record<string, unknown> = {
        model: model.apiId,
        prompt,
        n: 1,
        size,
      };
      if (model.apiId === "dall-e-3") {
        requestBody.quality = quality === "hd" ? "hd" : "standard";
        requestBody.response_format = "url";
      }

      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`OpenAI エラー: ${err.error?.message || "Unknown error"}`);
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;
      if (!imageUrl) throw new Error("レスポンスに画像URLが含まれていません");

      return NextResponse.json({ imageUrl, model: model.name });
    }

    return NextResponse.json({ error: "未対応のプロバイダーです" }, { status: 400 });
  } catch (error) {
    console.error("Image generation error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
