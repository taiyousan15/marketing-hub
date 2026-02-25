import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import {
  CreateWebinarSchemaWithRefinement,
  formatValidationErrors,
} from "@/lib/auto-webinar/validations";

export async function GET(request: NextRequest) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { tenantId } = userInfo;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const webinars = await prisma.automatedWebinar.findMany({
      where: {
        tenantId,
        ...(status ? { status: status as never } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ webinars, total: webinars.length });
  } catch (error) {
    console.error("GET /api/auto-webinars error:", error);
    return NextResponse.json(
      { error: "自動ウェビナー一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { tenantId } = userInfo;

    const body = await request.json();
    const parsed = CreateWebinarSchemaWithRefinement.safeParse(body);

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
      replayEnabled,
    } = parsed.data;

    const webinar = await prisma.automatedWebinar.create({
      data: {
        tenantId,
        name: title,
        title,
        description: description ?? null,
        videoUrl,
        videoType: videoType ?? null,
        videoDuration,
        scheduleType: scheduleType ?? "JUST_IN_TIME",
        fakeAttendeesEnabled: fakeAttendeesEnabled ?? true,
        fakeAttendeesMin: fakeAttendeesMin ?? 50,
        fakeAttendeesMax: fakeAttendeesMax ?? 200,
        simulatedChatEnabled: simulatedChatEnabled ?? true,
        replayEnabled: replayEnabled ?? true,
      },
    });

    return NextResponse.json({ webinar }, { status: 201 });
  } catch (error) {
    console.error("POST /api/auto-webinars error:", error);
    return NextResponse.json(
      { error: "自動ウェビナーの作成に失敗しました" },
      { status: 500 }
    );
  }
}
