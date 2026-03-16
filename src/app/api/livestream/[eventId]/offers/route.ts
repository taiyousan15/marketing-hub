import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

const offerSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  buttonText: z.string().max(100).default("今すぐ申し込む"),
  buttonUrl: z.string().max(2000).nullable().optional(),
  actionType: z
    .enum([
      "EXTERNAL_LINK",
      "LINE_FRIEND",
      "SURVEY",
      "ANNOUNCEMENT",
      "EMAIL_FORM",
      "STRIPE_CHECKOUT",
      "DOWNLOAD",
      "CUSTOM",
    ])
    .default("EXTERNAL_LINK"),
  appearAtSeconds: z.number().int().min(0),
  hideAtSeconds: z.number().int().min(0).nullable().optional(),
  popupPosition: z.enum(["BOTTOM_RIGHT", "BOTTOM_LEFT", "CENTER"]).default("BOTTOM_RIGHT"),
  countdownEnabled: z.boolean().default(false),
  countdownSeconds: z.number().int().min(0).nullable().optional(),
  limitedSeats: z.number().int().min(0).nullable().optional(),
  liffId: z.string().nullable().optional(),
  surveyUrl: z.string().max(2000).nullable().optional(),
});

const updateOffersSchema = z.object({
  offers: z.array(offerSchema),
});

/**
 * GET /api/livestream/[eventId]/offers
 * ライブ配信のオファー一覧を取得
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { eventId } = await params;

    const livestream = await prisma.liveStream.findFirst({
      where: {
        OR: [
          { eventId, tenantId: userInfo.tenantId },
          { id: eventId, tenantId: userInfo.tenantId },
        ],
      },
      select: { id: true, timedOffers: true },
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "ライブ配信が見つかりません" },
        { status: 404 }
      );
    }

    const offers = Array.isArray(livestream.timedOffers)
      ? livestream.timedOffers
      : [];

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("GET /api/livestream/[eventId]/offers error:", error);
    return NextResponse.json(
      { error: "オファーの取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/livestream/[eventId]/offers
 * オファー一覧を一括更新（全置換）
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { eventId } = await params;
    const body = await request.json();
    const parsed = updateOffersSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力内容が正しくありません", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const offersWithIds = parsed.data.offers.map((offer) => ({
      ...offer,
      id: offer.id ?? `offer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }));

    const livestream = await prisma.liveStream.findFirst({
      where: {
        OR: [
          { eventId, tenantId: userInfo.tenantId },
          { id: eventId, tenantId: userInfo.tenantId },
        ],
      },
      select: { id: true },
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "ライブ配信が見つかりません" },
        { status: 404 }
      );
    }

    await prisma.liveStream.update({
      where: { id: livestream.id },
      data: { timedOffers: offersWithIds },
    });

    return NextResponse.json({ offers: offersWithIds });
  } catch (error) {
    console.error("PUT /api/livestream/[eventId]/offers error:", error);
    return NextResponse.json(
      { error: "オファーの更新に失敗しました" },
      { status: 500 }
    );
  }
}
