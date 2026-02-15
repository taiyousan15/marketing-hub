// src/app/api/whatsapp/send/route.ts
// WhatsAppメッセージ送信API

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import {
  sendWhatsAppMessage,
  formatToWhatsApp,
} from "@/lib/whatsapp/twilio-whatsapp-client";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      to,
      body: messageBody,
      mediaUrl,
      contactId,
      tenantId,
      stepMailId,
      campaignId,
    } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (!to) {
      return NextResponse.json(
        { error: "Recipient phone number is required" },
        { status: 400 }
      );
    }

    if (!messageBody && !mediaUrl) {
      return NextResponse.json(
        { error: "Message body or media URL is required" },
        { status: 400 }
      );
    }

    // コンタクトIDがある場合、オプトインチェック
    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { whatsappOptIn: true },
      });

      if (contact && !contact.whatsappOptIn) {
        return NextResponse.json(
          { error: "Contact has opted out of WhatsApp messages" },
          { status: 400 }
        );
      }
    }

    // メッセージ送信
    const result = await sendWhatsAppMessage(tenantId, {
      to,
      body: messageBody,
      mediaUrl,
      contactId,
      stepMailId,
      campaignId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      messageSid: result.messageSid,
      status: result.status,
    });
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return NextResponse.json(
      { error: "Failed to send WhatsApp message" },
      { status: 500 }
    );
  }
}
