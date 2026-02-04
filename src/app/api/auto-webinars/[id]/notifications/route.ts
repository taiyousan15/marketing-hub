import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { NotificationChannel } from "@prisma/client";
import { createDefaultNotificationSettings } from "@/lib/auto-webinar/notifications";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 通知設定を取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // ウェビナーの存在確認（テナント検証付き）
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
      select: { id: true, title: true },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    // 通知設定を取得（なければデフォルト作成）
    let settings = await prisma.autoWebinarNotificationSettings.findUnique({
      where: { webinarId: id },
    });

    if (!settings) {
      settings = await createDefaultNotificationSettings(id);
    }

    // 送信統計を取得
    const stats = await prisma.autoWebinarNotificationLog.groupBy({
      by: ["notificationType", "success"],
      where: { webinarId: id },
      _count: true,
    });

    // スケジュール済み通知の件数
    const scheduled = await prisma.autoWebinarScheduledNotification.count({
      where: {
        webinarId: id,
        status: "SCHEDULED",
      },
    });

    return NextResponse.json({
      settings,
      stats: {
        scheduled,
        byType: stats,
      },
    });
  } catch (error) {
    console.error("Failed to get notification settings:", error);
    return NextResponse.json(
      { error: "Failed to get notification settings" },
      { status: 500 }
    );
  }
}

/**
 * 通知設定を更新
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const {
      isEnabled,
      reminder30MinEnabled,
      reminder5MinEnabled,
      reminder1MinEnabled,
      startingNowEnabled,
      replayAvailableEnabled,
      replayExpiringEnabled,
      replayExpiringHours,
      defaultChannel,
      reminder30MinSubject,
      reminder30MinBody,
      reminder5MinSubject,
      reminder5MinBody,
      startingNowSubject,
      startingNowBody,
      replaySubject,
      replayBody,
    } = body;

    // ウェビナーの存在確認（テナント検証付き）
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    // 通知設定を更新または作成
    const settings = await prisma.autoWebinarNotificationSettings.upsert({
      where: { webinarId: id },
      create: {
        webinarId: id,
        isEnabled: isEnabled ?? true,
        reminder30MinEnabled: reminder30MinEnabled ?? true,
        reminder5MinEnabled: reminder5MinEnabled ?? true,
        reminder1MinEnabled: reminder1MinEnabled ?? false,
        startingNowEnabled: startingNowEnabled ?? true,
        replayAvailableEnabled: replayAvailableEnabled ?? true,
        replayExpiringEnabled: replayExpiringEnabled ?? true,
        replayExpiringHours: replayExpiringHours ?? 24,
        defaultChannel: defaultChannel || NotificationChannel.BOTH,
        reminder30MinSubject,
        reminder30MinBody,
        reminder5MinSubject,
        reminder5MinBody,
        startingNowSubject,
        startingNowBody,
        replaySubject,
        replayBody,
      },
      update: {
        isEnabled,
        reminder30MinEnabled,
        reminder5MinEnabled,
        reminder1MinEnabled,
        startingNowEnabled,
        replayAvailableEnabled,
        replayExpiringEnabled,
        replayExpiringHours,
        defaultChannel,
        reminder30MinSubject,
        reminder30MinBody,
        reminder5MinSubject,
        reminder5MinBody,
        startingNowSubject,
        startingNowBody,
        replaySubject,
        replayBody,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to update notification settings:", error);
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
}

/**
 * テスト通知を送信
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const { notificationType, contactId, channel } = body;

    // ウェビナーの存在確認（テナント検証付き）
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
      include: {
        notificationSettings: true,
      },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    // コンタクト情報を取得
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // テスト通知を即時スケジュール
    const notification = await prisma.autoWebinarScheduledNotification.create({
      data: {
        webinarId: id,
        registrationId: "test",
        contactId,
        notificationType,
        scheduledAt: new Date(),
        channel: channel || NotificationChannel.BOTH,
        status: "SCHEDULED",
      },
    });

    return NextResponse.json({
      message: "Test notification scheduled",
      notificationId: notification.id,
    });
  } catch (error) {
    console.error("Failed to send test notification:", error);
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    );
  }
}
