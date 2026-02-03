import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import type { WebinarRewardType, WebinarRewardDeliveryType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 特典一覧取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ウェビナーの存在確認
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const rewards = await prisma.autoWebinarReward.findMany({
      where: { webinarId: id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: { claims: true },
        },
      },
    });

    return NextResponse.json({ rewards });
  } catch (error) {
    console.error("Failed to fetch rewards:", error);
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}

/**
 * 特典作成
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
      name,
      description,
      rewardType,
      watchTimeSeconds,
      triggerKeywords,
      appearAtSeconds,
      inputDeadlineSeconds,
      inputFields,
      deliveryType,
      downloadUrl,
      couponCode,
      emailTemplateId,
      lineMessage,
      unlockContentId,
      tagId,
      popupTitle,
      popupDescription,
      popupButtonText,
      popupPosition,
      maxClaims,
      order,
    } = body;

    const reward = await prisma.autoWebinarReward.create({
      data: {
        webinarId: id,
        name,
        description,
        rewardType: rewardType as WebinarRewardType,
        watchTimeSeconds,
        triggerKeywords: triggerKeywords || null,
        appearAtSeconds,
        inputDeadlineSeconds,
        inputFields: inputFields || null,
        deliveryType: deliveryType as WebinarRewardDeliveryType,
        downloadUrl,
        couponCode,
        emailTemplateId,
        lineMessage,
        unlockContentId,
        tagId,
        popupTitle,
        popupDescription,
        popupButtonText: popupButtonText || "特典を受け取る",
        popupPosition: popupPosition || "center",
        maxClaims,
        order: order || 0,
      },
    });

    return NextResponse.json({ reward }, { status: 201 });
  } catch (error) {
    console.error("Failed to create reward:", error);
    return NextResponse.json({ error: "Failed to create reward" }, { status: 500 });
  }
}

/**
 * 特典更新
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

    const { rewardId, ...updateData } = body;

    if (!rewardId) {
      return NextResponse.json({ error: "Reward ID required" }, { status: 400 });
    }

    // ウェビナーの存在確認
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const reward = await prisma.autoWebinarReward.update({
      where: { id: rewardId },
      data: updateData,
    });

    return NextResponse.json({ reward });
  } catch (error) {
    console.error("Failed to update reward:", error);
    return NextResponse.json({ error: "Failed to update reward" }, { status: 500 });
  }
}

/**
 * 特典削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const rewardId = searchParams.get("rewardId");
    const tenantId = userInfo?.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!rewardId) {
      return NextResponse.json({ error: "Reward ID required" }, { status: 400 });
    }

    // ウェビナーの存在確認
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    await prisma.autoWebinarReward.delete({
      where: { id: rewardId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete reward:", error);
    return NextResponse.json({ error: "Failed to delete reward" }, { status: 500 });
  }
}
