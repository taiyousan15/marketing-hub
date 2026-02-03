import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * ステップ一覧取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params;

    const steps = await prisma.campaignStep.findMany({
      where: { campaignId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ steps });
  } catch (error) {
    console.error("Failed to fetch steps:", error);
    return NextResponse.json({ error: "Failed to fetch steps" }, { status: 500 });
  }
}

/**
 * ステップ作成
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json();

    // キャンペーン存在確認
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        steps: {
          orderBy: { order: "desc" },
          take: 1,
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const { type, delayDays, delayHours, delayMinutes, sendTime, subject, content, conditions, trueBranchOrder, falseBranchOrder } = body;

    if (!type) {
      return NextResponse.json({ error: "Step type is required" }, { status: 400 });
    }

    // 次のorder番号を計算
    const nextOrder = (campaign.steps[0]?.order || 0) + 1;

    const step = await prisma.campaignStep.create({
      data: {
        campaignId,
        order: nextOrder,
        type,
        delayDays: delayDays || 0,
        delayHours: delayHours || 0,
        delayMinutes: delayMinutes || 0,
        sendTime: sendTime || null,
        subject: subject || null,
        content: content || {},
        conditions: conditions || null,
        trueBranchOrder: trueBranchOrder ?? null,
        falseBranchOrder: falseBranchOrder ?? null,
      },
    });

    return NextResponse.json({ step }, { status: 201 });
  } catch (error) {
    console.error("Failed to create step:", error);
    return NextResponse.json({ error: "Failed to create step" }, { status: 500 });
  }
}

/**
 * ステップ更新（バッチ更新対応）
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json();

    // 単一更新
    if (body.stepId) {
      const { stepId, ...updateData } = body;

      const step = await prisma.campaignStep.findFirst({
        where: { id: stepId, campaignId },
      });

      if (!step) {
        return NextResponse.json({ error: "Step not found" }, { status: 404 });
      }

      const updatedStep = await prisma.campaignStep.update({
        where: { id: stepId },
        data: {
          ...(updateData.type && { type: updateData.type }),
          ...(updateData.order !== undefined && { order: updateData.order }),
          ...(updateData.delayDays !== undefined && { delayDays: updateData.delayDays }),
          ...(updateData.delayHours !== undefined && { delayHours: updateData.delayHours }),
          ...(updateData.delayMinutes !== undefined && { delayMinutes: updateData.delayMinutes }),
          ...(updateData.sendTime !== undefined && { sendTime: updateData.sendTime }),
          ...(updateData.subject !== undefined && { subject: updateData.subject }),
          ...(updateData.content && { content: updateData.content }),
          ...(updateData.conditions !== undefined && { conditions: updateData.conditions }),
          ...(updateData.trueBranchOrder !== undefined && { trueBranchOrder: updateData.trueBranchOrder }),
          ...(updateData.falseBranchOrder !== undefined && { falseBranchOrder: updateData.falseBranchOrder }),
        },
      });

      return NextResponse.json({ step: updatedStep });
    }

    // バッチ更新（順序変更など）
    if (body.steps && Array.isArray(body.steps)) {
      const updates = body.steps.map((stepUpdate: { id: string; order: number }) =>
        prisma.campaignStep.update({
          where: { id: stepUpdate.id },
          data: { order: stepUpdate.order },
        })
      );

      await prisma.$transaction(updates);

      const steps = await prisma.campaignStep.findMany({
        where: { campaignId },
        orderBy: { order: "asc" },
      });

      return NextResponse.json({ steps });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update step(s):", error);
    return NextResponse.json({ error: "Failed to update step(s)" }, { status: 500 });
  }
}

/**
 * ステップ削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params;
    const stepId = request.nextUrl.searchParams.get("stepId");

    if (!stepId) {
      return NextResponse.json({ error: "Step ID required" }, { status: 400 });
    }

    const step = await prisma.campaignStep.findFirst({
      where: { id: stepId, campaignId },
    });

    if (!step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    await prisma.campaignStep.delete({
      where: { id: stepId },
    });

    // 残りのステップの順序を詰める
    await prisma.campaignStep.updateMany({
      where: {
        campaignId,
        order: { gt: step.order },
      },
      data: {
        order: { decrement: 1 },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete step:", error);
    return NextResponse.json({ error: "Failed to delete step" }, { status: 500 });
  }
}
