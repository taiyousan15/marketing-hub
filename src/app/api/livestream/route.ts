import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { generateRoomName } from "@/lib/livestream/livekit";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  platform: z.string().default("livekit"),
  chatEnabled: z.boolean().default(true),
  recordingEnabled: z.boolean().default(false),
});

const listQuerySchema = z.object({
  status: z
    .enum(["SCHEDULED", "LIVE", "COMPLETED", "CANCELED"])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { tenantId } = userInfo;

    const { searchParams } = new URL(request.url);
    const parsed = listQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "クエリパラメータが不正です", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, limit, offset } = parsed.data;

    const where = {
      tenantId,
      ...(status ? { status } : {}),
    };

    const [livestreams, total] = await Promise.all([
      prisma.liveStream.findMany({
        where,
        include: { event: true },
        orderBy: { startAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.liveStream.count({ where }),
    ]);

    return NextResponse.json({ livestreams, total, limit, offset });
  } catch (error) {
    console.error("GET /api/livestream error:", error);
    return NextResponse.json(
      { error: "ライブ配信一覧の取得に失敗しました" },
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
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力内容が正しくありません", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      startAt,
      endAt,
      platform,
      chatEnabled,
      recordingEnabled,
    } = parsed.data;

    const roomName = generateRoomName(`standalone-${Date.now()}`);

    const livestream = await prisma.liveStream.create({
      data: {
        tenantId,
        name,
        description: description ?? null,
        roomName,
        platform,
        chatEnabled,
        recordingEnabled,
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : null,
        status: "SCHEDULED",
      },
      include: { event: true },
    });

    return NextResponse.json({ livestream }, { status: 201 });
  } catch (error) {
    console.error("POST /api/livestream error:", error);
    return NextResponse.json(
      { error: "ライブ配信の作成に失敗しました" },
      { status: 500 }
    );
  }
}
