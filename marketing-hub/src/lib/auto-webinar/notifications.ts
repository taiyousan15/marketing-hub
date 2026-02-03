/**
 * オートウェビナー通知システム
 *
 * - ウェビナー開始前リマインダー（30分前、5分前、1分前）
 * - リプレイ公開通知
 * - リプレイ期限切れ警告
 */

import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/resend-client";
import { pushTextMessage, pushFlexMessage, multicastMessage } from "@/lib/line/client";
import {
  WebinarNotificationType,
  NotificationChannel,
  NotificationStatus,
} from "@prisma/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// 通知タイプごとのタイミング（分）
const NOTIFICATION_TIMING: Record<WebinarNotificationType, number> = {
  REMINDER_30MIN: 30,
  REMINDER_5MIN: 5,
  REMINDER_1MIN: 1,
  STARTING_NOW: 0,
  REPLAY_AVAILABLE: 0,
  REPLAY_EXPIRING: 0,
  CUSTOM: 0,
};

/**
 * 登録時に通知をスケジュール
 */
export async function scheduleNotificationsForRegistration(
  registrationId: string,
  webinarId: string,
  contactId: string,
  scheduledStartAt: Date
) {
  // 通知設定を取得
  const settings = await prisma.autoWebinarNotificationSettings.findUnique({
    where: { webinarId },
  });

  if (!settings?.isEnabled) {
    return;
  }

  const notifications: Array<{
    type: WebinarNotificationType;
    enabled: boolean;
    minutesBefore: number;
  }> = [
    { type: "REMINDER_30MIN", enabled: settings.reminder30MinEnabled, minutesBefore: 30 },
    { type: "REMINDER_5MIN", enabled: settings.reminder5MinEnabled, minutesBefore: 5 },
    { type: "REMINDER_1MIN", enabled: settings.reminder1MinEnabled, minutesBefore: 1 },
    { type: "STARTING_NOW", enabled: settings.startingNowEnabled, minutesBefore: 0 },
  ];

  const now = new Date();

  for (const notification of notifications) {
    if (!notification.enabled) continue;

    const scheduledAt = new Date(
      scheduledStartAt.getTime() - notification.minutesBefore * 60 * 1000
    );

    // 過去の時間はスキップ
    if (scheduledAt <= now) continue;

    await prisma.autoWebinarScheduledNotification.create({
      data: {
        webinarId,
        registrationId,
        contactId,
        notificationType: notification.type,
        scheduledAt,
        channel: settings.defaultChannel,
        status: NotificationStatus.SCHEDULED,
      },
    });
  }
}

/**
 * リプレイ公開時の通知をスケジュール
 */
export async function scheduleReplayNotification(
  registrationId: string,
  webinarId: string,
  contactId: string,
  replayExpiresAt?: Date
) {
  const settings = await prisma.autoWebinarNotificationSettings.findUnique({
    where: { webinarId },
  });

  if (!settings?.isEnabled) return;

  // リプレイ公開通知
  if (settings.replayAvailableEnabled) {
    await prisma.autoWebinarScheduledNotification.create({
      data: {
        webinarId,
        registrationId,
        contactId,
        notificationType: "REPLAY_AVAILABLE",
        scheduledAt: new Date(), // 即時
        channel: settings.defaultChannel,
        status: NotificationStatus.SCHEDULED,
      },
    });
  }

  // リプレイ期限切れ警告
  if (settings.replayExpiringEnabled && replayExpiresAt) {
    const warningTime = new Date(
      replayExpiresAt.getTime() - settings.replayExpiringHours * 60 * 60 * 1000
    );

    if (warningTime > new Date()) {
      await prisma.autoWebinarScheduledNotification.create({
        data: {
          webinarId,
          registrationId,
          contactId,
          notificationType: "REPLAY_EXPIRING",
          scheduledAt: warningTime,
          channel: settings.defaultChannel,
          status: NotificationStatus.SCHEDULED,
        },
      });
    }
  }
}

/**
 * スケジュール済み通知を処理（cronジョブから呼び出し）
 */
export async function processScheduledNotifications() {
  const now = new Date();

  // 送信予定時刻が過ぎている未送信の通知を取得
  const pendingNotifications = await prisma.autoWebinarScheduledNotification.findMany({
    where: {
      status: NotificationStatus.SCHEDULED,
      scheduledAt: { lte: now },
    },
    include: {
      webinar: {
        include: {
          notificationSettings: true,
        },
      },
    },
    take: 100, // バッチサイズ
  });

  for (const notification of pendingNotifications) {
    try {
      await sendNotification(notification);

      await prisma.autoWebinarScheduledNotification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Failed to send notification ${notification.id}:`, error);

      await prisma.autoWebinarScheduledNotification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  return pendingNotifications.length;
}

/**
 * 個別の通知を送信
 */
async function sendNotification(notification: any) {
  const { webinar, contactId, notificationType, channel } = notification;
  const settings = webinar.notificationSettings;

  // コンタクト情報を取得
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: {
      email: true,
      name: true,
      lineUserId: true,
    },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  // 登録情報を取得
  const registration = await prisma.autoWebinarRegistration.findFirst({
    where: {
      webinarId: webinar.id,
      contactId,
    },
  });

  // メッセージを生成
  const { subject, body } = generateNotificationContent(
    notificationType,
    webinar,
    contact,
    registration,
    settings
  );

  let emailMessageId: string | undefined;
  let lineMessageId: string | undefined;

  // メール送信
  if (
    (channel === NotificationChannel.EMAIL || channel === NotificationChannel.BOTH) &&
    contact.email
  ) {
    const result = await sendEmail({
      to: contact.email,
      subject,
      html: generateEmailHtml(subject, body, webinar, registration),
    });

    if (result.success) {
      emailMessageId = result.id;
    }
  }

  // LINE送信
  if (
    (channel === NotificationChannel.LINE || channel === NotificationChannel.BOTH) &&
    contact.lineUserId
  ) {
    try {
      const flexMessage = generateLineFlexMessage(
        notificationType,
        webinar,
        contact,
        registration
      );
      await pushFlexMessage(contact.lineUserId, subject, flexMessage);
      lineMessageId = `line-${Date.now()}`;
    } catch (error) {
      console.error("LINE send error:", error);
    }
  }

  // ログを記録
  await prisma.autoWebinarNotificationLog.create({
    data: {
      webinarId: webinar.id,
      registrationId: notification.registrationId,
      contactId,
      notificationType,
      channel,
      subject,
      body,
      success: !!(emailMessageId || lineMessageId),
      emailMessageId,
      lineMessageId,
    },
  });
}

/**
 * 通知コンテンツを生成
 */
function generateNotificationContent(
  type: WebinarNotificationType,
  webinar: any,
  contact: any,
  registration: any,
  settings: any
): { subject: string; body: string } {
  const name = contact.name || "様";
  const webinarTitle = webinar.title;
  const startTime = registration?.scheduledStartAt
    ? format(new Date(registration.scheduledStartAt), "M月d日(E) HH:mm", { locale: ja })
    : "";

  const watchUrl = `${process.env.NEXT_PUBLIC_APP_URL}/webinar/${webinar.id}/watch`;
  const replayUrl = registration?.replayAccessToken
    ? `${process.env.NEXT_PUBLIC_APP_URL}/webinar/replay/${registration.replayAccessToken}`
    : watchUrl;

  switch (type) {
    case "REMINDER_30MIN":
      return {
        subject: settings?.reminder30MinSubject || `【30分後開始】${webinarTitle}`,
        body:
          settings?.reminder30MinBody ||
          `${name}さん、まもなく「${webinarTitle}」が始まります！\n\n開始時刻: ${startTime}\n\n視聴ページ: ${watchUrl}\n\n開始5分前にはスタンバイしてお待ちください。`,
      };

    case "REMINDER_5MIN":
      return {
        subject: settings?.reminder5MinSubject || `【5分後開始】${webinarTitle}`,
        body:
          settings?.reminder5MinBody ||
          `${name}さん、「${webinarTitle}」の開始まであと5分です！\n\n今すぐ視聴ページにアクセスしてください: ${watchUrl}`,
      };

    case "REMINDER_1MIN":
      return {
        subject: `【まもなく開始】${webinarTitle}`,
        body: `${name}さん、「${webinarTitle}」がまもなく始まります！\n\n視聴ページ: ${watchUrl}`,
      };

    case "STARTING_NOW":
      return {
        subject: settings?.startingNowSubject || `【開始しました】${webinarTitle}`,
        body:
          settings?.startingNowBody ||
          `${name}さん、「${webinarTitle}」が始まりました！\n\n今すぐ参加: ${watchUrl}`,
      };

    case "REPLAY_AVAILABLE":
      return {
        subject: settings?.replaySubject || `【リプレイ公開】${webinarTitle}`,
        body:
          settings?.replayBody ||
          `${name}さん、「${webinarTitle}」のリプレイが視聴可能になりました！\n\n今すぐ視聴: ${replayUrl}`,
      };

    case "REPLAY_EXPIRING":
      const expiryTime = registration?.replayExpiresAt
        ? format(new Date(registration.replayExpiresAt), "M月d日(E) HH:mm", { locale: ja })
        : "間もなく";
      return {
        subject: `【期限間近】${webinarTitle}のリプレイ`,
        body: `${name}さん、「${webinarTitle}」のリプレイ視聴期限が近づいています。\n\n期限: ${expiryTime}\n\n今すぐ視聴: ${replayUrl}`,
      };

    default:
      return {
        subject: webinarTitle,
        body: `${name}さん、ウェビナーのお知らせです。`,
      };
  }
}

/**
 * メールHTMLを生成
 */
function generateEmailHtml(
  subject: string,
  body: string,
  webinar: any,
  registration: any
): string {
  const watchUrl = `${process.env.NEXT_PUBLIC_APP_URL}/webinar/${webinar.id}/watch`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.8; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 20px;">${subject}</h1>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
    ${body.split("\n").map((line) => `<p style="margin: 10px 0;">${line}</p>`).join("")}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${watchUrl}"
         style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        ウェビナーに参加する
      </a>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <p>${webinar.title}</p>
  </div>
</body>
</html>
  `;
}

/**
 * LINE Flex Messageを生成
 */
function generateLineFlexMessage(
  type: WebinarNotificationType,
  webinar: any,
  contact: any,
  registration: any
): any {
  const watchUrl = `${process.env.NEXT_PUBLIC_APP_URL}/webinar/${webinar.id}/watch`;
  const startTime = registration?.scheduledStartAt
    ? format(new Date(registration.scheduledStartAt), "M月d日(E) HH:mm", { locale: ja })
    : "";

  const typeLabels: Record<string, string> = {
    REMINDER_30MIN: "30分前",
    REMINDER_5MIN: "5分前",
    REMINDER_1MIN: "1分前",
    STARTING_NOW: "開始",
    REPLAY_AVAILABLE: "リプレイ",
    REPLAY_EXPIRING: "期限間近",
  };

  const colors: Record<string, string> = {
    REMINDER_30MIN: "#667eea",
    REMINDER_5MIN: "#f59e0b",
    REMINDER_1MIN: "#ef4444",
    STARTING_NOW: "#10b981",
    REPLAY_AVAILABLE: "#8b5cf6",
    REPLAY_EXPIRING: "#ef4444",
  };

  return {
    type: "bubble",
    hero: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: typeLabels[type] || "お知らせ",
          weight: "bold",
          size: "sm",
          color: "#ffffff",
        },
        {
          type: "text",
          text: webinar.title,
          weight: "bold",
          size: "lg",
          color: "#ffffff",
          wrap: true,
        },
      ],
      backgroundColor: colors[type] || "#667eea",
      paddingAll: "20px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        ...(startTime
          ? [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "開始時刻", size: "sm", color: "#999999", flex: 1 },
                  { type: "text", text: startTime, size: "sm", weight: "bold", flex: 2 },
                ],
                margin: "md",
              },
            ]
          : []),
      ],
      paddingAll: "20px",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "ウェビナーに参加",
            uri: watchUrl,
          },
          style: "primary",
          color: colors[type] || "#667eea",
        },
      ],
      paddingAll: "20px",
    },
  };
}

/**
 * 通知設定のデフォルト値を作成
 */
export async function createDefaultNotificationSettings(webinarId: string) {
  return prisma.autoWebinarNotificationSettings.upsert({
    where: { webinarId },
    create: {
      webinarId,
      isEnabled: true,
      reminder30MinEnabled: true,
      reminder5MinEnabled: true,
      reminder1MinEnabled: false,
      startingNowEnabled: true,
      replayAvailableEnabled: true,
      replayExpiringEnabled: true,
      replayExpiringHours: 24,
      defaultChannel: "BOTH",
    },
    update: {},
  });
}

/**
 * 登録キャンセル時に通知をキャンセル
 */
export async function cancelScheduledNotifications(registrationId: string) {
  await prisma.autoWebinarScheduledNotification.updateMany({
    where: {
      registrationId,
      status: NotificationStatus.SCHEDULED,
    },
    data: {
      status: NotificationStatus.CANCELLED,
    },
  });
}
