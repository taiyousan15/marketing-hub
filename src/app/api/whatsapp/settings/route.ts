import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { z } from "zod";

const WhatsAppSettingsSchema = z.object({
  phoneNumberId: z.string().min(1),
  accessToken: z.string().min(1),
  businessAccountId: z.string().optional(),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  webhookToken: z.string().optional(),
  isActive: z.boolean().default(false),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.whatsAppSettings.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!settings) {
      return NextResponse.json({
        phoneNumberId: "",
        accessToken: null,
        businessAccountId: "",
        webhookUrl: "",
        webhookToken: "",
        isActive: false,
      });
    }

    return NextResponse.json({
      ...settings,
      accessToken: settings.accessToken ? "***" + settings.accessToken.slice(-4) : null,
    });
  } catch (error) {
    console.error("GET /api/whatsapp/settings error:", error);
    return NextResponse.json({ error: "Failed to get WhatsApp settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = WhatsAppSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const existing = await prisma.whatsAppSettings.findUnique({
      where: { tenantId: user.tenantId },
    });

    const accessToken =
      data.accessToken.startsWith("***") ? existing?.accessToken ?? "" : data.accessToken;

    const settings = await prisma.whatsAppSettings.upsert({
      where: { tenantId: user.tenantId },
      create: {
        tenantId: user.tenantId,
        phoneNumberId: data.phoneNumberId,
        accessToken,
        businessAccountId: data.businessAccountId ?? null,
        webhookUrl: data.webhookUrl ?? null,
        webhookToken: data.webhookToken ?? null,
        isActive: data.isActive,
      },
      update: {
        phoneNumberId: data.phoneNumberId,
        accessToken,
        businessAccountId: data.businessAccountId ?? null,
        webhookUrl: data.webhookUrl ?? null,
        webhookToken: data.webhookToken ?? null,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        accessToken: settings.accessToken ? "***" + settings.accessToken.slice(-4) : null,
      },
    });
  } catch (error) {
    console.error("PUT /api/whatsapp/settings error:", error);
    return NextResponse.json({ error: "Failed to update WhatsApp settings" }, { status: 500 });
  }
}
