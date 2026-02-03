import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

type Params = { id: string };

/**
 * ファネル詳細取得
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

    const { id } = await params;

    const funnel = await prisma.funnel.findUnique({
      where: { id },
      include: {
        pages: {
          orderBy: { order: "asc" },
          include: {
            actions: true,
          },
        },
        steps: {
          orderBy: { order: "asc" },
          include: {
            page: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!funnel) {
      return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
    }

    return NextResponse.json({ funnel });
  } catch (error) {
    console.error("Failed to fetch funnel:", error);
    return NextResponse.json(
      { error: "Failed to fetch funnel" },
      { status: 500 }
    );
  }
}

/**
 * ファネル更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const funnel = await prisma.funnel.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.domain !== undefined ? { domain: body.domain } : {}),
        ...(body.settings !== undefined ? { settings: body.settings } : {}),
      },
      include: {
        pages: { orderBy: { order: "asc" } },
        steps: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ funnel });
  } catch (error) {
    console.error("Failed to update funnel:", error);
    return NextResponse.json(
      { error: "Failed to update funnel" },
      { status: 500 }
    );
  }
}

/**
 * ファネル削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.funnel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete funnel:", error);
    return NextResponse.json(
      { error: "Failed to delete funnel" },
      { status: 500 }
    );
  }
}
