import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

type Params = { id: string };

/**
 * ファネルステップ一覧取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: funnelId } = await params;

    const steps = await prisma.funnelStep.findMany({
      where: { funnelId },
      orderBy: { order: "asc" },
      include: {
        page: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ steps });
  } catch (error) {
    console.error("Failed to fetch steps:", error);
    return NextResponse.json(
      { error: "Failed to fetch steps" },
      { status: 500 }
    );
  }
}

/**
 * ファネルステップ作成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: funnelId } = await params;
    const body = await request.json();

    // 最大orderを取得
    const maxOrder = await prisma.funnelStep.aggregate({
      where: { funnelId },
      _max: { order: true },
    });

    const step = await prisma.funnelStep.create({
      data: {
        funnelId,
        name: body.name,
        type: body.type,
        order: body.order ?? (maxOrder._max.order ?? -1) + 1,
        pageId: body.pageId,
        conditions: body.conditions,
        variants: body.variants,
      },
      include: {
        page: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ step }, { status: 201 });
  } catch (error) {
    console.error("Failed to create step:", error);
    return NextResponse.json(
      { error: "Failed to create step" },
      { status: 500 }
    );
  }
}

/**
 * ファネルステップ並び替え
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: funnelId } = await params;
    const body = await request.json();
    const { stepIds } = body as { stepIds: string[] };

    // トランザクションで一括更新
    await prisma.$transaction(
      stepIds.map((stepId, index) =>
        prisma.funnelStep.update({
          where: { id: stepId },
          data: { order: index },
        })
      )
    );

    const steps = await prisma.funnelStep.findMany({
      where: { funnelId },
      orderBy: { order: "asc" },
      include: {
        page: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ steps });
  } catch (error) {
    console.error("Failed to reorder steps:", error);
    return NextResponse.json(
      { error: "Failed to reorder steps" },
      { status: 500 }
    );
  }
}
