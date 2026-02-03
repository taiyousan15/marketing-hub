// src/app/api/whatsapp/settings/route.ts
// WhatsApp設定API

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const settings = await prisma.whatsAppSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      // デフォルト設定を返す
      return NextResponse.json({
        provider: "twilio",
        accountSid: null,
        authToken: null,
        whatsappNumber: null,
        enabled: false,
        sendingHoursStart: 9,
        sendingHoursEnd: 21,
        maxPerMinute: 60,
        maxPerDay: 1000,
      });
    }

    // 機密情報をマスク
    return NextResponse.json({
      ...settings,
      authToken: settings.authToken ? "********" : null,
      metaAccessToken: settings.metaAccessToken ? "********" : null,
    });
  } catch (error) {
    console.error("Failed to get WhatsApp settings:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId") || body.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // 既存設定を取得
    const existingSettings = await prisma.whatsAppSettings.findUnique({
      where: { tenantId },
    });

    // 更新データを準備
    const updateData: Record<string, unknown> = {
      provider: body.provider || "twilio",
      enabled: body.enabled ?? false,
      sendingHoursStart: body.sendingHoursStart ?? 9,
      sendingHoursEnd: body.sendingHoursEnd ?? 21,
      maxPerMinute: body.maxPerMinute ?? 60,
      maxPerDay: body.maxPerDay ?? 1000,
    };

    // Twilio設定
    if (body.accountSid !== undefined) {
      updateData.accountSid = body.accountSid || null;
    }
    if (body.authToken && body.authToken !== "********") {
      updateData.authToken = body.authToken;
    }
    if (body.whatsappNumber !== undefined) {
      // whatsapp: プレフィックスを自動追加
      const num = body.whatsappNumber;
      updateData.whatsappNumber = num
        ? num.startsWith("whatsapp:")
          ? num
          : `whatsapp:${num}`
        : null;
    }

    // Meta Cloud API設定（将来用）
    if (body.metaAccessToken && body.metaAccessToken !== "********") {
      updateData.metaAccessToken = body.metaAccessToken;
    }
    if (body.metaPhoneNumberId !== undefined) {
      updateData.metaPhoneNumberId = body.metaPhoneNumberId || null;
    }
    if (body.metaBusinessId !== undefined) {
      updateData.metaBusinessId = body.metaBusinessId || null;
    }

    // テンプレート設定
    if (body.welcomeTemplateId !== undefined) {
      updateData.welcomeTemplateId = body.welcomeTemplateId || null;
    }

    // Upsert
    const settings = await prisma.whatsAppSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        authToken: settings.authToken ? "********" : null,
        metaAccessToken: settings.metaAccessToken ? "********" : null,
      },
    });
  } catch (error) {
    console.error("Failed to update WhatsApp settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
