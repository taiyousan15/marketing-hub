import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * ジャーニーを一時停止
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 存在確認
    const existing = await prisma.journey.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    // 既に一時停止の場合
    if (existing.status === "PAUSED") {
      return NextResponse.json(
        { error: "Journey is already paused" },
        { status: 400 }
      );
    }

    // ドラフトの場合は一時停止できない
    if (existing.status === "DRAFT") {
      return NextResponse.json(
        { error: "Cannot pause a draft journey" },
        { status: 400 }
      );
    }

    const journey = await prisma.journey.update({
      where: { id },
      data: { status: "PAUSED" },
      include: {
        nodes: true,
      },
    });

    // アクティブなコンタクトも一時停止
    await prisma.journeyContact.updateMany({
      where: {
        journeyId: id,
        status: "ACTIVE",
      },
      data: {
        status: "PAUSED",
      },
    });

    return NextResponse.json({ journey });
  } catch (error) {
    console.error("Failed to pause journey:", error);
    return NextResponse.json({ error: "Failed to pause journey" }, { status: 500 });
  }
}
