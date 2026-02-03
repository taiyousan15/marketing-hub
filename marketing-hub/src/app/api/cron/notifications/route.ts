import { NextRequest, NextResponse } from "next/server";
import { processScheduledNotifications } from "@/lib/auto-webinar/notifications";

/**
 * スケジュール済み通知を処理するCronエンドポイント
 *
 * Vercel Cron、Cloudflare Workers、または外部スケジューラーから呼び出す
 * 例: cron式 "* * * * *" で毎分実行
 *
 * セキュリティ: CRON_SECRETによる認証が必要
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // スケジュール済み通知を処理
    const processedCount = await processScheduledNotifications();

    return NextResponse.json({
      success: true,
      processed: processedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron notification processing failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Vercel Cron設定用
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 最大60秒
