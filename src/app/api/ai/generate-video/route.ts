import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { VIDEO_MODELS } from "@/lib/ai-media/models";

const requestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  modelId: z.string(),
  duration: z.number().int().min(3).max(15).optional().default(5),
  resolution: z.string().optional().default("720p"),
  imageUrl: z.string().url().optional(), // for image-to-video
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, modelId, duration, resolution, imageUrl } = requestSchema.parse(body);

    const model = VIDEO_MODELS.find((m) => m.id === modelId);
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 400 });
    }

    const falApiKey = process.env.FAL_API_KEY;
    if (!falApiKey) {
      return NextResponse.json(
        { error: "FAL_API_KEY が設定されていません。.env に FAL_API_KEY を追加してください。" },
        { status: 503 }
      );
    }

    // Switch to image-to-video API if imageUrl provided and model supports it
    const apiId =
      imageUrl && model.supportsImageToVideo
        ? model.apiId.replace("text-to-video", "image-to-video")
        : model.apiId;

    const clampedDuration = Math.min(duration, model.maxDuration);
    const requestBody: Record<string, unknown> = {
      prompt,
      duration: clampedDuration,
    };

    if (imageUrl) requestBody.image_url = imageUrl;

    // fal.ai uses async queue for long-running video generation
    const queueResponse = await fetch(`https://queue.fal.run/${apiId}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!queueResponse.ok) {
      const err = await queueResponse.text();
      throw new Error(`fal.ai キューエラー: ${queueResponse.status} - ${err}`);
    }

    const queueData = await queueResponse.json();
    const requestId = queueData.request_id;
    if (!requestId) throw new Error("キューリクエストIDが取得できませんでした");

    // Poll for result (max 5 minutes)
    const maxWaitMs = 5 * 60 * 1000;
    const pollIntervalMs = 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      const statusResponse = await fetch(
        `https://queue.fal.run/${apiId}/requests/${requestId}/status`,
        {
          headers: { Authorization: `Key ${falApiKey}` },
        }
      );

      if (!statusResponse.ok) continue;

      const statusData = await statusResponse.json();

      if (statusData.status === "COMPLETED") {
        const resultResponse = await fetch(
          `https://queue.fal.run/${apiId}/requests/${requestId}`,
          { headers: { Authorization: `Key ${falApiKey}` } }
        );

        if (!resultResponse.ok) {
          throw new Error("結果の取得に失敗しました");
        }

        const result = await resultResponse.json();
        const videoUrl = result.video?.url ?? result.videos?.[0]?.url;
        if (!videoUrl) throw new Error("レスポンスに動画URLが含まれていません");

        return NextResponse.json({
          videoUrl,
          model: model.name,
          duration: clampedDuration,
        });
      }

      if (statusData.status === "FAILED") {
        throw new Error(`生成に失敗しました: ${statusData.error || "Unknown error"}`);
      }
    }

    throw new Error("タイムアウト: 動画生成が5分以内に完了しませんでした");
  } catch (error) {
    console.error("Video generation error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
