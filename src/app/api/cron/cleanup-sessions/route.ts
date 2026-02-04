import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// セッションの有効期限（24時間）
const SESSION_TTL_HOURS = 24;

// 古いログの保持期間（30日）
const LOG_RETENTION_DAYS = 30;

/**
 * セッションクリーンアップCronジョブ
 *
 * 毎日3時に実行:
 * - 24時間以上経過したセッションを削除
 * - 30日以上経過した通知ログをアーカイブ/削除
 * - 期限切れの登録をNO_SHOWに更新
 */
export async function GET(request: NextRequest) {
  // Cron認証
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production") {
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const startTime = Date.now();
    const now = new Date();

    // 1. 古いセッションを削除
    const sessionCutoff = new Date(now.getTime() - SESSION_TTL_HOURS * 60 * 60 * 1000);
    const deletedSessions = await prisma.autoWebinarSession.deleteMany({
      where: {
        startedAt: { lt: sessionCutoff },
        // 未完了のセッションのみ削除（完了したものは統計用に保持）
        endedAt: null,
      },
    });

    // 2. 古い通知ログを削除
    const logCutoff = new Date(now.getTime() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const deletedLogs = await prisma.autoWebinarNotificationLog.deleteMany({
      where: {
        sentAt: { lt: logCutoff },
      },
    });

    // 3. NO_SHOW判定（開始時刻から2時間経過して未視聴の登録）
    const noShowCutoff = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const noShowUpdated = await prisma.autoWebinarRegistration.updateMany({
      where: {
        status: "REGISTERED",
        scheduledStartAt: { lt: noShowCutoff },
        attendedAt: null,
      },
      data: {
        status: "NO_SHOW",
      },
    });

    // 4. 送信済み/キャンセル済みの古いスケジュール通知を削除
    const notificationCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7日
    const deletedNotifications = await prisma.autoWebinarScheduledNotification.deleteMany({
      where: {
        OR: [
          { status: "SENT", sentAt: { lt: notificationCutoff } },
          { status: "FAILED", failedAt: { lt: notificationCutoff } },
          { status: "CANCELLED", scheduledAt: { lt: notificationCutoff } },
        ],
      },
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      results: {
        deletedSessions: deletedSessions.count,
        deletedLogs: deletedLogs.count,
        noShowUpdated: noShowUpdated.count,
        deletedNotifications: deletedNotifications.count,
      },
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cleanup cron job error:", error);
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

export async function POST(request: NextRequest) {
  return GET(request);
}
