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
        isActive: false,
        phoneNumberId: null,
        accessToken: null,
        businessAccountId: null,
        webhookUrl: null,
        webhookToken: null,
      });
    }

    // 機密情報をマスク
    return NextResponse.json({
      ...settings,
      accessToken: settings.accessToken ? "********" : null,
      webhookToken: settings.webhookToken ? "********" : null,
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
    const updateData: Record<string, unknown> = {};

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }
    if (body.phoneNumberId !== undefined) {
      updateData.phoneNumberId = body.phoneNumberId || null;
    }
    if (body.businessAccountId !== undefined) {
      updateData.businessAccountId = body.businessAccountId || null;
    }
    if (body.accessToken && body.accessToken !== "********") {
      updateData.accessToken = body.accessToken;
    }
    if (body.webhookUrl !== undefined) {
      updateData.webhookUrl = body.webhookUrl || null;
    }
    if (body.webhookToken && body.webhookToken !== "********") {
      updateData.webhookToken = body.webhookToken;
    }

    // Upsert
    const settings = await prisma.whatsAppSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        phoneNumberId: body.phoneNumberId || "",
        accessToken: body.accessToken || "",
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        accessToken: settings.accessToken ? "********" : null,
        webhookToken: settings.webhookToken ? "********" : null,
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
