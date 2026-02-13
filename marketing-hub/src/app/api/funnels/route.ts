import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

/**
 * ファネル一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const funnels = await prisma.funnel.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
      },
      include: {
        pages: {
          select: { id: true, name: true, slug: true, order: true },
          orderBy: { order: "asc" },
        },
        _count: {
          select: { pages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ funnels });
  } catch (error) {
    console.error("Failed to fetch funnels:", error);
    return NextResponse.json(
      { error: "Failed to fetch funnels" },
      { status: 500 }
    );
  }
}

/**
 * ファネル作成
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const tenantId = currentUser.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    // ファネル作成
    const funnel = await prisma.funnel.create({
      data: {
        tenantId,
        name: body.name,
        domain: body.domain,
        settings: body.settings || {},
      },
      include: {
        pages: true,
      },
    });

    // 更新後のファネルを取得
    const updatedFunnel = await prisma.funnel.findUnique({
      where: { id: funnel.id },
      include: {
        pages: true,
      },
    });

    return NextResponse.json({ funnel: updatedFunnel }, { status: 201 });
  } catch (error) {
    console.error("Failed to create funnel:", error);
    return NextResponse.json(
      { error: "Failed to create funnel" },
      { status: 500 }
    );
  }
}

