import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import type { SimChatMessageType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * チャットメッセージ一覧取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // ウェビナーの存在確認
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const messages = await prisma.autoWebinarChatMessage.findMany({
      where: { webinarId: id },
      orderBy: [{ appearAtSeconds: "asc" }, { order: "asc" }],
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

/**
 * チャットメッセージ追加
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // ウェビナーの存在確認
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const {
      appearAtSeconds,
      senderName,
      senderAvatar,
      content,
      messageType = "COMMENT",
      order = 0,
    } = body;

    if (appearAtSeconds === undefined || !senderName || !content) {
      return NextResponse.json(
        { error: "appearAtSeconds, senderName, and content are required" },
        { status: 400 }
      );
    }

    const message = await prisma.autoWebinarChatMessage.create({
      data: {
        webinarId: id,
        appearAtSeconds,
        senderName,
        senderAvatar: senderAvatar || null,
        content,
        messageType: messageType as SimChatMessageType,
        order,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Failed to create chat message:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}

/**
 * チャットメッセージ削除（全削除）
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // ウェビナーの存在確認
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    // 特定メッセージIDの削除
    const messageId = request.nextUrl.searchParams.get("messageId");
    if (messageId) {
      await prisma.autoWebinarChatMessage.delete({
        where: { id: messageId },
      });
    } else {
      // 全削除
      await prisma.autoWebinarChatMessage.deleteMany({
        where: { webinarId: id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete chat messages:", error);
    return NextResponse.json({ error: "Failed to delete messages" }, { status: 500 });
  }
}
