import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * ジャーニー詳細取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const journey = await prisma.journey.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        nodes: {
          orderBy: { order: "asc" },
        },
        contacts: {
          take: 100,
          orderBy: { enrolledAt: "desc" },
        },
      },
    });

    if (!journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    // 統計情報を計算
    const [enrolled, completed, active] = await Promise.all([
      prisma.journeyContact.count({
        where: { journeyId: journey.id },
      }),
      prisma.journeyContact.count({
        where: { journeyId: journey.id, status: "COMPLETED" },
      }),
      prisma.journeyContact.count({
        where: { journeyId: journey.id, status: "ACTIVE" },
      }),
    ]);

    return NextResponse.json({
      journey: {
        ...journey,
        stats: {
          enrolled,
          completed,
          active,
          conversionRate: enrolled > 0 ? Math.round((completed / enrolled) * 100 * 10) / 10 : 0,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch journey:", error);
    return NextResponse.json({ error: "Failed to fetch journey" }, { status: 500 });
  }
}

/**
 * ジャーニー更新
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

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

    const { name, description, triggerType, triggerConfig, status, nodes } = body;

    // ジャーニー更新
    const journey = await prisma.journey.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(triggerType !== undefined && { triggerType }),
        ...(triggerConfig !== undefined && { triggerConfig }),
        ...(status !== undefined && { status }),
      },
      include: {
        nodes: true,
      },
    });

    // ノードの更新（全置換）
    if (nodes !== undefined) {
      // 既存のノードを削除
      await prisma.journeyNode.deleteMany({
        where: { journeyId: id },
      });

      // 新しいノードを作成
      if (nodes.length > 0) {
        await prisma.journeyNode.createMany({
          data: nodes.map((node: {
            type: string;
            title: string;
            description?: string;
            config?: Record<string, unknown>;
            position: { x: number; y: number };
            connections: string[];
            order?: number;
          }, index: number) => ({
            journeyId: id,
            type: node.type,
            title: node.title,
            description: node.description || null,
            config: node.config || null,
            position: node.position,
            connections: node.connections || [],
            order: node.order ?? index,
          })),
        });
      }

      // 更新後のジャーニーを再取得
      const updatedJourney = await prisma.journey.findUnique({
        where: { id },
        include: {
          nodes: {
            orderBy: { order: "asc" },
          },
        },
      });

      return NextResponse.json({ journey: updatedJourney });
    }

    return NextResponse.json({ journey });
  } catch (error) {
    console.error("Failed to update journey:", error);
    return NextResponse.json({ error: "Failed to update journey" }, { status: 500 });
  }
}

/**
 * ジャーニー削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // アクティブなコンタクトがいる場合は警告
    const activeContacts = await prisma.journeyContact.count({
      where: {
        journeyId: id,
        status: "ACTIVE",
      },
    });

    if (activeContacts > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete journey with active contacts",
          activeContacts,
        },
        { status: 400 }
      );
    }

    await prisma.journey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete journey:", error);
    return NextResponse.json({ error: "Failed to delete journey" }, { status: 500 });
  }
}
