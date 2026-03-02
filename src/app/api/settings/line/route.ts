import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = currentUser;

    // Fetch LINE account settings from LineAccount model
    const lineAccount = await prisma.lineAccount.findFirst({
      where: { tenantId },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webhookUrl = `${baseUrl}/api/webhooks/line?tenant=${tenantId}`;

    return NextResponse.json({
      channelId: lineAccount?.channelId || "",
      channelSecret: lineAccount?.channelSecret ? "••••••••" : "",
      accessToken: lineAccount?.accessToken ? "••••••••" : "",
      webhookUrl,
      isConnected: !!(
        lineAccount?.channelId &&
        lineAccount?.channelSecret &&
        lineAccount?.accessToken
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

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = currentUser;
    const body = await request.json();
    const { channelId, channelSecret, accessToken } = body;

    // Update data (only non-masked values)
    const updateData: Record<string, string> = {};

    if (channelId) {
      updateData.channelId = channelId;
    }

    if (channelSecret && !channelSecret.includes("•")) {
      updateData.channelSecret = channelSecret;
    }

    if (accessToken && !accessToken.includes("•")) {
      updateData.accessToken = accessToken;
    }

    // Find existing LINE account or create new one
    const existingAccount = await prisma.lineAccount.findFirst({
      where: { tenantId },
    });

    if (existingAccount) {
      await prisma.lineAccount.update({
        where: { id: existingAccount.id },
        data: updateData,
      });
    } else {
      await prisma.lineAccount.create({
        data: {
          tenantId,
          name: "Default LINE Account",
          channelId: channelId || "",
          channelSecret: channelSecret || "",
          accessToken: accessToken || "",
        },
      });
    }

    // Generate webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webhookUrl = `${baseUrl}/api/webhooks/line?tenant=${tenantId}`;

    return NextResponse.json({
      success: true,
      webhookUrl,
    });
  } catch (error) {
    console.error("Error saving LINE settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: "Not implemented", message: "LINE connection test feature is under development" },
    { status: 501 }
  );
}
