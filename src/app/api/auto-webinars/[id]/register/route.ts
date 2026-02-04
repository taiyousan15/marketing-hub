import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  calculateScheduledStartAt,
  calculateReplayExpiresAt,
  type RecurringSchedule,
} from "@/lib/auto-webinar/scheduling";
import { scheduleNotificationsForRegistration } from "@/lib/auto-webinar/notifications";
import { RegisterWebinarSchema, formatValidationErrors } from "@/lib/auto-webinar/validations";
import { withRateLimit, REGISTRATION_RATE_LIMIT } from "@/lib/rate-limit";
import { randomBytes } from "crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * ウェビナー登録（公開API）
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // レート制限チェック
  const rateLimitResponse = withRateLimit(request, "register", REGISTRATION_RATE_LIMIT);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // バリデーション
    const validationResult = RegisterWebinarSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        formatValidationErrors(validationResult.error),
        { status: 400 }
      );
    }

    const { contactId, selectedTime, email, phone, name, contactMethod } = validationResult.data;

    // ウェビナー取得
    const webinar = await prisma.automatedWebinar.findFirst({
      where: {
        id,
        status: "ACTIVE",
      },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    // コンタクトIDがない場合はメールまたは電話番号で検索または作成
    let resolvedContactId = contactId;

    if (!resolvedContactId && (email || phone)) {
      // メールまたは電話番号でコンタクトを検索
      const existingContact = await prisma.contact.findFirst({
        where: {
          tenantId: webinar.tenantId,
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
      });

      if (existingContact) {
        resolvedContactId = existingContact.id;

        // 電話番号が新しく提供された場合は更新
        if (phone && !existingContact.phone) {
          await prisma.contact.update({
            where: { id: existingContact.id },
            data: {
              phone,
              smsOptIn: true,
              smsOptInAt: new Date(),
            },
          });
        }
      } else {
        // 新規コンタクト作成
        const newContact = await prisma.contact.create({
          data: {
            tenantId: webinar.tenantId,
            email: email || null,
            phone: phone || null,
            name: name || null,
            source: "webinar",
            sourceDetail: { webinarId: id, contactMethod },
            // SMSオプトイン設定
            ...(phone && {
              smsOptIn: true,
              smsOptInAt: new Date(),
              phoneVerified: false,
            }),
            // メールオプトイン設定
            ...(email && {
              emailOptIn: true,
              emailOptInAt: new Date(),
            }),
          },
        });
        resolvedContactId = newContact.id;
      }
    }

    if (!resolvedContactId) {
      return NextResponse.json(
        { error: "contactId, email, or phone is required" },
        { status: 400 }
      );
    }

    // 既存の登録をチェック
    const existingRegistration = await prisma.autoWebinarRegistration.findUnique({
      where: {
        webinarId_contactId: {
          webinarId: id,
          contactId: resolvedContactId,
        },
      },
    });

    if (existingRegistration) {
      // 既存の登録がある場合はそれを返す
      return NextResponse.json({
        registration: existingRegistration,
        isExisting: true,
      });
    }

    const now = new Date();

    // スケジュール開始時刻を計算
    const scheduledStartAt = calculateScheduledStartAt(
      webinar.scheduleType,
      now,
      {
        justInTimeDelayMinutes: webinar.justInTimeDelayMinutes,
        recurringSchedule: webinar.recurringSchedule as RecurringSchedule | null,
        specificDates: webinar.specificDates as string[] | null,
        selectedTime: selectedTime ? new Date(selectedTime) : undefined,
      }
    );

    // リプレイ有効期限を計算
    const videoEndTime = new Date(
      scheduledStartAt.getTime() + webinar.videoDuration * 1000
    );
    const replayExpiresAt = webinar.replayEnabled
      ? calculateReplayExpiresAt(videoEndTime, webinar.replayExpiresAfterHours)
      : null;

    // リプレイアクセストークン生成
    const replayAccessToken = webinar.replayEnabled
      ? randomBytes(32).toString("hex")
      : null;

    // 登録作成
    const registration = await prisma.autoWebinarRegistration.create({
      data: {
        webinarId: id,
        contactId: resolvedContactId,
        scheduledStartAt,
        replayAccessToken,
        replayExpiresAt,
        status: "REGISTERED",
      },
    });

    // 通知をスケジュール（非同期で実行、エラーは無視）
    scheduleNotificationsForRegistration(
      registration.id,
      id,
      resolvedContactId,
      scheduledStartAt
    ).catch((err) => {
      console.error("Failed to schedule notifications:", err);
    });

    return NextResponse.json(
      {
        registration,
        isExisting: false,
        webinar: {
          id: webinar.id,
          title: webinar.title,
          videoDuration: webinar.videoDuration,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to register:", error);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}

/**
 * 登録情報取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const contactId = request.nextUrl.searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json({ error: "contactId is required" }, { status: 400 });
    }

    const registration = await prisma.autoWebinarRegistration.findUnique({
      where: {
        webinarId_contactId: {
          webinarId: id,
          contactId,
        },
      },
      include: {
        webinar: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            videoDuration: true,
            replayEnabled: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({ registration });
  } catch (error) {
    console.error("Failed to get registration:", error);
    return NextResponse.json({ error: "Failed to get registration" }, { status: 500 });
  }
}
