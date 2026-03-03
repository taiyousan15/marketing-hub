import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const postSchema = z.object({
  senderName: z.string().min(1).max(50),
  content: z.string().min(1).max(500),
  appearAtSeconds: z.number().int().min(0),
  messageType: z.enum(["COMMENT", "QUESTION", "REACTION", "TESTIMONIAL"]).default("COMMENT"),
});

/**
 * GET: 視聴者コメントを取得
 * ?since=<ISO datetime> で差分取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const sinceParam = request.nextUrl.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : undefined;

  try {
    const messages = await prisma.viewerChatMessage.findMany({
      where: {
        autoWebinarId: id,
        ...(since ? { createdAt: { gt: since } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    return NextResponse.json({
      messages,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[chat GET] error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

/**
 * POST: 視聴者コメントを投稿
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // ウェビナーの存在確認
  const webinar = await prisma.automatedWebinar.findUnique({
    where: { id },
    select: { id: true, simulatedChatEnabled: true },
  });

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  try {
    const message = await prisma.viewerChatMessage.create({
      data: {
        autoWebinarId: id,
        senderName: parsed.data.senderName,
        content: parsed.data.content,
        appearAtSeconds: parsed.data.appearAtSeconds,
        messageType: parsed.data.messageType,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[chat POST] error:", error);
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }
}
