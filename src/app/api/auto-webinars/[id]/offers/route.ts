import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { nanoid } from "nanoid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const OfferSchema = z.object({
  appearAtSeconds: z.number().int().min(0),
  hideAtSeconds: z.number().int().min(0).optional().nullable(),
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  buttonText: z.string().max(50).default("今すぐ申し込む"),
  buttonUrl: z.string().url().optional().nullable(),
  actionType: z.enum([
    "EXTERNAL_LINK", "EMAIL_FORM", "LINE_FRIEND",
    "STRIPE_CHECKOUT", "DOWNLOAD", "SURVEY", "ANNOUNCEMENT", "CUSTOM",
  ]).default("EXTERNAL_LINK"),
  popupPosition: z.enum(["CENTER", "BOTTOM_RIGHT", "BOTTOM_LEFT"]).default("BOTTOM_RIGHT"),
  countdownEnabled: z.boolean().default(false),
  countdownSeconds: z.number().int().min(0).optional().nullable(),
  limitedSeats: z.number().int().min(1).optional().nullable(),
  liffId: z.string().optional().nullable(),
  surveyUrl: z.string().url().optional().nullable(),
  announcementOnly: z.boolean().default(false),
});

interface TimedOffer extends z.infer<typeof OfferSchema> {
  id: string;
  clickCount: number;
  conversionCount: number;
}

function parseOffers(raw: unknown): TimedOffer[] {
  if (!Array.isArray(raw)) return [];
  return raw as TimedOffer[];
}

/**
 * GET: タイムドオファー一覧取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const webinar = await prisma.automatedWebinar.findUnique({
    where: { id },
    select: { timedOffers: true },
  });

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  return NextResponse.json({ offers: parseOffers(webinar.timedOffers) });
}

/**
 * POST: タイムドオファー追加
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = OfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const webinar = await prisma.automatedWebinar.findUnique({
    where: { id },
    select: { timedOffers: true },
  });

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  const offers = parseOffers(webinar.timedOffers);
  const newOffer: TimedOffer = {
    id: nanoid(),
    clickCount: 0,
    conversionCount: 0,
    ...parsed.data,
  };

  const updated = [...offers, newOffer].sort(
    (a, b) => a.appearAtSeconds - b.appearAtSeconds
  );

  await prisma.automatedWebinar.update({
    where: { id },
    data: { timedOffers: updated as object[] },
  });

  return NextResponse.json({ offer: newOffer }, { status: 201 });
}

/**
 * PUT: タイムドオファー更新
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { offerId, ...rest } = body as { offerId?: string } & Record<string, unknown>;
  if (!offerId) {
    return NextResponse.json({ error: "offerId is required" }, { status: 400 });
  }

  const parsed = OfferSchema.partial().safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const webinar = await prisma.automatedWebinar.findUnique({
    where: { id },
    select: { timedOffers: true },
  });

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  const offers = parseOffers(webinar.timedOffers);
  const idx = offers.findIndex((o) => o.id === offerId);
  if (idx === -1) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  const updatedOffer = { ...offers[idx], ...parsed.data };
  const updated = offers.map((o, i) => (i === idx ? updatedOffer : o));

  await prisma.automatedWebinar.update({
    where: { id },
    data: { timedOffers: updated as object[] },
  });

  return NextResponse.json({ offer: updatedOffer });
}

/**
 * DELETE: タイムドオファー削除
 * ?offerId=xxx
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const offerId = request.nextUrl.searchParams.get("offerId");

  if (!offerId) {
    return NextResponse.json({ error: "offerId is required" }, { status: 400 });
  }

  const webinar = await prisma.automatedWebinar.findUnique({
    where: { id },
    select: { timedOffers: true },
  });

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  const offers = parseOffers(webinar.timedOffers);
  const updated = offers.filter((o) => o.id !== offerId);

  await prisma.automatedWebinar.update({
    where: { id },
    data: { timedOffers: updated as object[] },
  });

  return new NextResponse(null, { status: 204 });
}
