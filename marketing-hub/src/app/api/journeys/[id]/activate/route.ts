import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * ジャーニーを有効化
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
      include: {
        nodes: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    // 既にアクティブな場合
    if (existing.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Journey is already active" },
        { status: 400 }
      );
    }

    // ノードが存在するかチェック
    if (existing.nodes.length === 0) {
      return NextResponse.json(
        { error: "Cannot activate journey without nodes" },
        { status: 400 }
      );
    }

    // トリガーノードが存在するかチェック
    const hasTrigger = existing.nodes.some((node) => node.type === "TRIGGER");
    if (!hasTrigger) {
      return NextResponse.json(
        { error: "Journey must have at least one trigger node" },
        { status: 400 }
      );
    }

    const journey = await prisma.journey.update({
      where: { id },
      data: { status: "ACTIVE" },
      include: {
        nodes: true,
      },
    });

    return NextResponse.json({ journey });
  } catch (error) {
    console.error("Failed to activate journey:", error);
    return NextResponse.json({ error: "Failed to activate journey" }, { status: 500 });
  }
}
