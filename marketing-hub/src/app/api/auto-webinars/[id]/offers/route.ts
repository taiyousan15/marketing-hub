import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * タイムドオファー一覧取得
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

    const offers = await prisma.autoWebinarTimedOffer.findMany({
      where: { webinarId: id },
      orderBy: { appearAtSeconds: "asc" },
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("Failed to fetch timed offers:", error);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}

/**
 * タイムドオファー作成
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
      hideAtSeconds,
      title,
      description,
      buttonText = "今すぐ申し込む",
      buttonUrl,
      countdownEnabled = false,
      countdownSeconds,
      limitedSeats,
    } = body;

    if (appearAtSeconds === undefined || !title || !buttonUrl) {
      return NextResponse.json(
        { error: "appearAtSeconds, title, and buttonUrl are required" },
        { status: 400 }
      );
    }

    const offer = await prisma.autoWebinarTimedOffer.create({
      data: {
        webinarId: id,
        appearAtSeconds,
        hideAtSeconds: hideAtSeconds ?? null,
        title,
        description: description || null,
        buttonText,
        buttonUrl,
        countdownEnabled,
        countdownSeconds: countdownSeconds ?? null,
        limitedSeats: limitedSeats ?? null,
      },
    });

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error("Failed to create timed offer:", error);
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}

/**
 * タイムドオファー更新/削除
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const { offerId, ...updateData } = body;

    if (!offerId) {
      return NextResponse.json({ error: "offerId is required" }, { status: 400 });
    }

    // オファーの存在確認（ウェビナーの所有権も確認）
    const existing = await prisma.autoWebinarTimedOffer.findFirst({
      where: {
        id: offerId,
        webinar: { id, tenantId },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    const offer = await prisma.autoWebinarTimedOffer.update({
      where: { id: offerId },
      data: {
        ...(updateData.appearAtSeconds !== undefined && { appearAtSeconds: updateData.appearAtSeconds }),
        ...(updateData.hideAtSeconds !== undefined && { hideAtSeconds: updateData.hideAtSeconds }),
        ...(updateData.title !== undefined && { title: updateData.title }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.buttonText !== undefined && { buttonText: updateData.buttonText }),
        ...(updateData.buttonUrl !== undefined && { buttonUrl: updateData.buttonUrl }),
        ...(updateData.countdownEnabled !== undefined && { countdownEnabled: updateData.countdownEnabled }),
        ...(updateData.countdownSeconds !== undefined && { countdownSeconds: updateData.countdownSeconds }),
        ...(updateData.limitedSeats !== undefined && { limitedSeats: updateData.limitedSeats }),
      },
    });

    return NextResponse.json({ offer });
  } catch (error) {
    console.error("Failed to update timed offer:", error);
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}

/**
 * タイムドオファー削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");
    const offerId = request.nextUrl.searchParams.get("offerId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    if (!offerId) {
      return NextResponse.json({ error: "offerId is required" }, { status: 400 });
    }

    // オファーの存在確認
    const existing = await prisma.autoWebinarTimedOffer.findFirst({
      where: {
        id: offerId,
        webinar: { id, tenantId },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    await prisma.autoWebinarTimedOffer.delete({
      where: { id: offerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete timed offer:", error);
    return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 });
  }
}
