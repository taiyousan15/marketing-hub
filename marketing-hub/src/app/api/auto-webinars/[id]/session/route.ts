import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getPlaybackState, calculateCompletionPercent } from "@/lib/auto-webinar/playback";
import { calculateFakeAttendees } from "@/lib/auto-webinar/attendees";
import { getChatMessagesForTime } from "@/lib/auto-webinar/chat";
import { StartSessionSchema, UpdateSessionSchema, formatValidationErrors } from "@/lib/auto-webinar/validations";
import { withRateLimit, SESSION_RATE_LIMIT } from "@/lib/rate-limit";
import { randomBytes } from "crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * セッション開始
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // レート制限チェック
  const rateLimitResponse = withRateLimit(request, "session", SESSION_RATE_LIMIT);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // バリデーション
    const validationResult = StartSessionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        formatValidationErrors(validationResult.error),
        { status: 400 }
      );
    }

    const { contactId, registrationId, isReplay = false } = validationResult.data;

    // ウェビナー取得
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id, status: "ACTIVE" },
      include: {
        chatMessages: {
          orderBy: [{ appearAtSeconds: "asc" }, { order: "asc" }],
        },
        timedOffers: {
          orderBy: { appearAtSeconds: "asc" },
        },
      },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    // 登録情報を確認
    let registration = null;
    if (registrationId) {
      registration = await prisma.autoWebinarRegistration.findFirst({
        where: { id: registrationId },
      });
    } else if (contactId) {
      registration = await prisma.autoWebinarRegistration.findFirst({
        where: { webinarId: id, contactId },
      });
    }

    if (!registration && !isReplay) {
      return NextResponse.json(
        { error: "Registration required" },
        { status: 400 }
      );
    }

    // セッショントークン生成
    const sessionToken = randomBytes(32).toString("hex");
    const now = new Date();

    // セッション作成
    const session = await prisma.autoWebinarSession.create({
      data: {
        webinarId: id,
        contactId: contactId || null,
        registrationId: registrationId || null,
        sessionToken,
        isReplay,
        startedAt: now,
      },
    });

    // 登録ステータス更新
    if (registration) {
      await prisma.autoWebinarRegistration.update({
        where: { id: registration.id },
        data: {
          status: isReplay ? "WATCHED_REPLAY" : "ATTENDED",
          attendedAt: now,
        },
      });
    }

    // 再生状態を取得
    const playbackState = getPlaybackState(
      registration?.scheduledStartAt || now,
      webinar.videoDuration,
      now
    );

    // 初期チャットメッセージ
    const initialChatMessages = webinar.simulatedChatEnabled
      ? getChatMessagesForTime(
          webinar.chatMessages.map((m) => ({
            id: m.id,
            appearAtSeconds: m.appearAtSeconds,
            senderName: m.senderName,
            senderAvatar: m.senderAvatar,
            content: m.content,
            messageType: m.messageType,
            order: m.order,
          })),
          playbackState.currentPosition
        )
      : [];

    // 現在表示すべきオファー
    const visibleOffers = webinar.timedOffers.filter(
      (o) =>
        o.appearAtSeconds <= playbackState.currentPosition &&
        (o.hideAtSeconds === null || o.hideAtSeconds > playbackState.currentPosition)
    );

    // 参加者数
    const attendeeCount = webinar.fakeAttendeesEnabled
      ? calculateFakeAttendees(
          webinar.fakeAttendeesMin,
          webinar.fakeAttendeesMax,
          playbackState.currentPosition / webinar.videoDuration
        )
      : null;

    return NextResponse.json(
      {
        session: {
          id: session.id,
          sessionToken: session.sessionToken,
          isReplay: session.isReplay,
        },
        playback: playbackState,
        chat: {
          enabled: webinar.simulatedChatEnabled,
          messages: initialChatMessages,
        },
        offers: visibleOffers,
        attendees: {
          enabled: webinar.fakeAttendeesEnabled,
          count: attendeeCount,
        },
        webinar: {
          id: webinar.id,
          title: webinar.title,
          videoUrl: webinar.videoUrl,
          videoType: webinar.videoType,
          videoDuration: webinar.videoDuration,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to start session:", error);
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}

/**
 * セッション進捗更新
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // バリデーション
    const validationResult = UpdateSessionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        formatValidationErrors(validationResult.error),
        { status: 400 }
      );
    }

    const { sessionToken, currentPosition, offerClicked } = validationResult.data;

    // セッション取得
    const session = await prisma.autoWebinarSession.findUnique({
      where: { sessionToken },
      include: {
        webinar: {
          include: {
            chatMessages: {
              orderBy: [{ appearAtSeconds: "asc" }, { order: "asc" }],
            },
            timedOffers: {
              orderBy: { appearAtSeconds: "asc" },
            },
          },
        },
      },
    });

    if (!session || session.webinarId !== id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const webinar = session.webinar;

    // 進捗更新
    const updateData: Record<string, unknown> = {};

    if (currentPosition !== undefined) {
      updateData.maxWatchedSeconds = Math.max(
        session.maxWatchedSeconds,
        currentPosition
      );
      updateData.completionPercent = calculateCompletionPercent(
        updateData.maxWatchedSeconds as number,
        webinar.videoDuration
      );
    }

    if (offerClicked) {
      const existingClicks = (session.offersClicked as string[]) || [];
      if (!existingClicks.includes(offerClicked)) {
        updateData.offersClicked = [...existingClicks, offerClicked];

        // オファーのクリックカウントを更新
        await prisma.autoWebinarTimedOffer.update({
          where: { id: offerClicked },
          data: { clickCount: { increment: 1 } },
        });
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.autoWebinarSession.update({
        where: { id: session.id },
        data: updateData,
      });
    }

    // 現在の再生状態
    const now = new Date();
    const scheduledStart = session.isReplay
      ? session.startedAt
      : await getScheduledStartTime(session);

    const playbackState = getPlaybackState(
      scheduledStart || now,
      webinar.videoDuration,
      now
    );

    // 新しいチャットメッセージ
    const chatMessages = webinar.simulatedChatEnabled
      ? getChatMessagesForTime(
          webinar.chatMessages.map((m) => ({
            id: m.id,
            appearAtSeconds: m.appearAtSeconds,
            senderName: m.senderName,
            senderAvatar: m.senderAvatar,
            content: m.content,
            messageType: m.messageType,
            order: m.order,
          })),
          playbackState.currentPosition
        )
      : [];

    // 現在表示すべきオファー
    const visibleOffers = webinar.timedOffers.filter(
      (o) =>
        o.appearAtSeconds <= playbackState.currentPosition &&
        (o.hideAtSeconds === null || o.hideAtSeconds > playbackState.currentPosition)
    );

    // 参加者数
    const attendeeCount = webinar.fakeAttendeesEnabled
      ? calculateFakeAttendees(
          webinar.fakeAttendeesMin,
          webinar.fakeAttendeesMax,
          playbackState.currentPosition / webinar.videoDuration
        )
      : null;

    return NextResponse.json({
      playback: playbackState,
      chat: {
        enabled: webinar.simulatedChatEnabled,
        messages: chatMessages,
      },
      offers: visibleOffers,
      attendees: {
        enabled: webinar.fakeAttendeesEnabled,
        count: attendeeCount,
      },
      progress: {
        maxWatchedSeconds: (updateData.maxWatchedSeconds as number) || session.maxWatchedSeconds,
        completionPercent: (updateData.completionPercent as number) || session.completionPercent,
      },
    });
  } catch (error) {
    console.error("Failed to update session:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

/**
 * 登録のスケジュール開始時刻を取得
 */
async function getScheduledStartTime(
  session: { registrationId: string | null }
): Promise<Date | null> {
  if (!session.registrationId) return null;

  const registration = await prisma.autoWebinarRegistration.findUnique({
    where: { id: session.registrationId },
    select: { scheduledStartAt: true },
  });

  return registration?.scheduledStartAt || null;
}
