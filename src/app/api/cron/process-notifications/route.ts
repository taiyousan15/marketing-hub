import { NextRequest, NextResponse } from "next/server";
import { processScheduledNotifications } from "@/lib/auto-webinar/notifications";

/**
 * 通知処理Cronジョブ
 *
 * Vercel Cronで1分ごとに呼び出される
 * vercel.json または cron.json で設定:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/process-notifications",
 *       "schedule": "* * * * *"
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  // Cron認証（Vercel Cron Secretまたは内部呼び出し）
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // 本番環境では認証必須
  if (process.env.NODE_ENV === "production") {
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const startTime = Date.now();
    const processedCount = await processScheduledNotifications();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      processedCount,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST も許可（手動トリガー用）
export async function POST(request: NextRequest) {
  return GET(request);
}
