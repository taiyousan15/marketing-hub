import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

/**
 * 単一ステップ取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { id, stepId } = await params;
    const userInfo = await getCurrentUser();

    if (!userInfo?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ファネルの所有権確認
    const funnel = await prisma.funnel.findUnique({
      where: {
        id,
        tenantId: userInfo.tenantId,
      },
    });

    if (!funnel) {
      return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
    }

    const step = await prisma.funnelStep.findUnique({
      where: {
        id: stepId,
        funnelId: id,
      },
      include: {
        page: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    return NextResponse.json({ step });
  } catch (error) {
    console.error("Failed to fetch step:", error);
    return NextResponse.json(
      { error: "Failed to fetch step" },
      { status: 500 }
    );
  }
}

/**
 * ステップ更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { id, stepId } = await params;
    const userInfo = await getCurrentUser();

    if (!userInfo?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // ファネルの所有権確認
    const funnel = await prisma.funnel.findUnique({
      where: {
        id,
        tenantId: userInfo.tenantId,
      },
    });

    if (!funnel) {
      return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
    }

    // ステップの存在確認
    const existingStep = await prisma.funnelStep.findUnique({
      where: {
        id: stepId,
        funnelId: id,
      },
    });

    if (!existingStep) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    // 更新データを構築
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.pageId !== undefined) updateData.pageId = body.pageId;
    if (body.conditions !== undefined) updateData.conditions = body.conditions;
    if (body.variants !== undefined) updateData.variants = body.variants;

    const step = await prisma.funnelStep.update({
      where: { id: stepId },
      data: updateData,
      include: {
        page: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      step,
    });
  } catch (error) {
    console.error("Failed to update step:", error);
    return NextResponse.json(
      { error: "Failed to update step" },
      { status: 500 }
    );
  }
}

/**
 * ステップ削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { id, stepId } = await params;
    const userInfo = await getCurrentUser();

    if (!userInfo?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ファネルの所有権確認
    const funnel = await prisma.funnel.findUnique({
      where: {
        id,
        tenantId: userInfo.tenantId,
      },
    });

    if (!funnel) {
      return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
    }

    // ステップの存在確認
    const step = await prisma.funnelStep.findUnique({
      where: {
        id: stepId,
        funnelId: id,
      },
    });

    if (!step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    // ステップを削除
    await prisma.funnelStep.delete({
      where: { id: stepId },
    });

    // 残りのステップの順序を再調整
    const remainingSteps = await prisma.funnelStep.findMany({
      where: { funnelId: id },
      orderBy: { order: "asc" },
    });

    await prisma.$transaction(
      remainingSteps.map((s, index) =>
        prisma.funnelStep.update({
          where: { id: s.id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Failed to delete step:", error);
    return NextResponse.json(
      { error: "Failed to delete step" },
      { status: 500 }
    );
  }
}
