/**
 * LINE設定API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { Client } from "@line/bot-sdk";

// LINE設定を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // テナント設定を取得
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        lineChannelId: true,
        lineChannelSecret: true,
        lineAccessToken: true,
        lineWebhookUrl: true,
        settings: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // アクセストークンはマスクして返す
    return NextResponse.json({
      channelId: tenant.lineChannelId || "",
      channelSecret: tenant.lineChannelSecret ? "••••••••" : "",
      accessToken: tenant.lineAccessToken ? "••••••••" : "",
      webhookUrl: tenant.lineWebhookUrl || "",
      isConnected: !!(
        tenant.lineChannelId &&
        tenant.lineChannelSecret &&
        tenant.lineAccessToken
      ),
    });
  } catch (error) {
    console.error("Error getting LINE settings:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

// LINE設定を保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, channelId, channelSecret, accessToken } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // 既存の設定を取得
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existingTenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // 更新データを構築（マスクされていない値のみ更新）
    const updateData: Record<string, string> = {};

    if (channelId) {
      updateData.lineChannelId = channelId;
    }

    if (channelSecret && !channelSecret.includes("•")) {
      updateData.lineChannelSecret = channelSecret;
    }

    if (accessToken && !accessToken.includes("•")) {
      updateData.lineAccessToken = accessToken;
    }

    // Webhook URLを生成
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    updateData.lineWebhookUrl = `${baseUrl}/api/webhooks/line?tenant=${tenantId}`;

    // 設定を更新
    await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      webhookUrl: updateData.lineWebhookUrl,
    });
  } catch (error) {
    console.error("Error saving LINE settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

// LINE接続テスト
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, channelId, channelSecret, accessToken } = body;

    if (!channelId || !channelSecret || !accessToken) {
      return NextResponse.json(
        { error: "All credentials are required" },
        { status: 400 }
      );
    }

    // マスクされた値の場合は既存の設定を使用
    let finalAccessToken = accessToken;
    let finalChannelSecret = channelSecret;

    if (accessToken.includes("•") || channelSecret.includes("•")) {
      if (!tenantId) {
        return NextResponse.json(
          { error: "tenantId required for masked credentials" },
          { status: 400 }
        );
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          lineChannelSecret: true,
          lineAccessToken: true,
        },
      });

      if (!tenant) {
        return NextResponse.json(
          { error: "Tenant not found" },
          { status: 404 }
        );
      }

      if (accessToken.includes("•")) {
        finalAccessToken = tenant.lineAccessToken;
      }
      if (channelSecret.includes("•")) {
        finalChannelSecret = tenant.lineChannelSecret;
      }
    }

    if (!finalAccessToken || !finalChannelSecret) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 }
      );
    }

    // LINE APIで接続テスト
    const client = new Client({
      channelAccessToken: finalAccessToken,
      channelSecret: finalChannelSecret,
    });

    try {
      // Bot情報を取得してテスト
      const botInfo = await client.getBotInfo();

      return NextResponse.json({
        success: true,
        botInfo: {
          userId: botInfo.userId,
          basicId: botInfo.basicId,
          displayName: botInfo.displayName,
          pictureUrl: botInfo.pictureUrl,
        },
      });
    } catch (lineError) {
      console.error("LINE API error:", lineError);
      return NextResponse.json(
        {
          success: false,
          error: "LINE API connection failed. Please check your credentials.",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error testing LINE connection:", error);
    return NextResponse.json(
      { error: "Failed to test connection" },
      { status: 500 }
    );
  }
}
