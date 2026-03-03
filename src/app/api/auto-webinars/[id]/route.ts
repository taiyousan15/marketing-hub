import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import {
  UpdateWebinarSchema,
  formatValidationErrors,
} from "@/lib/auto-webinar/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { tenantId } = userInfo;
    const { id } = await params;

    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: "自動ウェビナーが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ webinar });
  } catch (error) {
    console.error("GET /api/auto-webinars/[id] error:", error);
    return NextResponse.json(
      { error: "自動ウェビナーの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { tenantId } = userInfo;
    const { id } = await params;

    const existing = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "自動ウェビナーが見つかりません" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = UpdateWebinarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        formatValidationErrors(parsed.error),
        { status: 400 }
      );
    }

    const {
      title,
      description,
      videoUrl,
      videoType,
      videoDuration,
      scheduleType,
      fakeAttendeesEnabled,
      fakeAttendeesMin,
      fakeAttendeesMax,
      simulatedChatEnabled,
      userChatEnabled,
      aiBotEnabled,
      aiBotName,
      aiBotContext,
      replayEnabled,
    } = parsed.data;

    const webinar = await prisma.automatedWebinar.update({
      where: { id },
      data: {
        ...(title !== undefined ? { name: title, title } : {}),
        ...(description !== undefined ? { description: description ?? null } : {}),
        ...(videoUrl !== undefined ? { videoUrl } : {}),
        ...(videoType !== undefined ? { videoType: videoType ?? null } : {}),
        ...(videoDuration !== undefined ? { videoDuration } : {}),
        ...(scheduleType !== undefined ? { scheduleType } : {}),
        ...(fakeAttendeesEnabled !== undefined ? { fakeAttendeesEnabled } : {}),
        ...(fakeAttendeesMin !== undefined ? { fakeAttendeesMin } : {}),
        ...(fakeAttendeesMax !== undefined ? { fakeAttendeesMax } : {}),
        ...(simulatedChatEnabled !== undefined ? { simulatedChatEnabled } : {}),
        ...(userChatEnabled !== undefined ? { userChatEnabled } : {}),
        ...(aiBotEnabled !== undefined ? { aiBotEnabled } : {}),
        ...(aiBotName !== undefined ? { aiBotName } : {}),
        ...(aiBotContext !== undefined ? { aiBotContext: aiBotContext ?? null } : {}),
        ...(replayEnabled !== undefined ? { replayEnabled } : {}),
      },
    });

    return NextResponse.json({ webinar });
  } catch (error) {
    console.error("PUT /api/auto-webinars/[id] error:", error);
    return NextResponse.json(
      { error: "自動ウェビナーの更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { tenantId } = userInfo;
    const { id } = await params;

    const existing = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "自動ウェビナーが見つかりません" },
        { status: 404 }
      );
    }

    await prisma.automatedWebinar.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/auto-webinars/[id] error:", error);
    return NextResponse.json(
      { error: "自動ウェビナーの削除に失敗しました" },
      { status: 500 }
    );
  }
}
