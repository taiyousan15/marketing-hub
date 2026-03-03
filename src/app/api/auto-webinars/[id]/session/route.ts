import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const PatchSchema = z.object({
  sessionToken: z.string().optional(),
  currentPosition: z.number().min(0).optional(),
  offerClicked: z.string().optional(),
});

interface TimedOffer {
  id: string;
  appearAtSeconds: number;
  hideAtSeconds: number | null;
  title: string;
  description: string | null;
  buttonText: string;
  buttonUrl: string | null;
  actionType: string;
  popupPosition: string;
  countdownEnabled: boolean;
  countdownSeconds: number | null;
  limitedSeats: number | null;
  liffId: string | null;
  surveyUrl: string | null;
  announcementOnly: boolean;
  clickCount: number;
  conversionCount: number;
}

function parseOffers(raw: unknown): TimedOffer[] {
  if (!Array.isArray(raw)) return [];
  return raw as TimedOffer[];
}

interface SimChatMessage {
  id: string;
  appearAtSeconds: number;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  messageType: string;
  order: number;
}

function parseChatMessages(raw: unknown): SimChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw as SimChatMessage[];
}

/**
 * PATCH: 再生位置・オファークリックを更新し、現在の状態を返す
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { currentPosition, offerClicked } = parsed.data;

  const webinar = await prisma.automatedWebinar.findUnique({
    where: { id },
    select: {
      videoDuration: true,
      chatMessages: true,
      timedOffers: true,
    },
  });

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  let offers = parseOffers(webinar.timedOffers);

  // オファークリックを記録
  if (offerClicked) {
    const idx = offers.findIndex((o) => o.id === offerClicked);
    if (idx !== -1) {
      offers = offers.map((o, i) =>
        i === idx ? { ...o, clickCount: o.clickCount + 1 } : o
      );
      await prisma.automatedWebinar.update({
        where: { id },
        data: { timedOffers: offers as object[] },
      });
    }
  }

  const pos = currentPosition ?? 0;

  // 現在の再生位置で表示すべきオファーを返す
  const visibleOffers = offers.filter((offer) => {
    const appeared = pos >= offer.appearAtSeconds;
    const notHidden = !offer.hideAtSeconds || pos < offer.hideAtSeconds;
    return appeared && notHidden;
  });

  // シミュレートチャット: 現在位置までのメッセージ
  const chatMessages = parseChatMessages(webinar.chatMessages).filter(
    (m) => m.appearAtSeconds <= pos
  );

  const isEnded = pos >= webinar.videoDuration;

  return NextResponse.json({
    chat: { messages: chatMessages },
    offers: visibleOffers,
    playback: { isEnded },
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Not implemented", message: "Use PATCH to sync session" },
    { status: 501 }
  );
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Not implemented", message: "Use PATCH to sync session" },
    { status: 501 }
  );
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Not implemented", message: "Use PATCH to sync session" },
    { status: 501 }
  );
}
