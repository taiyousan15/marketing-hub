import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * キャンペーン詳細取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        ...(tenantId && { tenantId }),
      },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
        segment: true,
        _count: {
          select: { contacts: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Failed to fetch campaign:", error);
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}

/**
 * キャンペーン更新
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    // 存在確認
    const existing = await prisma.campaign.findFirst({
      where: {
        id,
        ...(tenantId && { tenantId }),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const { name, type, status, segmentId, useOptimalSendTime, minScoreThreshold, settings } = body;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(status && { status }),
        ...(segmentId !== undefined && { segmentId: segmentId || null }),
        ...(useOptimalSendTime !== undefined && { useOptimalSendTime }),
        ...(minScoreThreshold !== undefined && { minScoreThreshold }),
        ...(settings && { settings }),
      },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Failed to update campaign:", error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

/**
 * キャンペーン削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    // 存在確認
    const existing = await prisma.campaign.findFirst({
      where: {
        id,
        ...(tenantId && { tenantId }),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // アクティブなキャンペーンは削除不可
    if (existing.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Cannot delete active campaign. Please pause it first." },
        { status: 400 }
      );
    }

    await prisma.campaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete campaign:", error);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
