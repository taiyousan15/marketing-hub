import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

const createPageSchema = z.object({
  name: z.string().min(1),
  stepId: z.string().optional(),
  stepType: z.string().optional(),
});

/**
 * ページ一覧取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: funnelId } = await params;

    const pages = await prisma.funnelPage.findMany({
      where: { funnelId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        order: true,
        pageViews: true,
        conversions: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Failed to fetch pages:", error);
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
  }
}

/**
 * ページ作成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: funnelId } = await params;
    const body = await request.json();
    const { name, stepId, stepType } = createPageSchema.parse(body);

    // slug 生成（名前ベース + タイムスタンプ）
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "page";
    const slug = `${baseSlug}-${Date.now()}`;

    // 既存ページ数を取得してorder決定
    const count = await prisma.funnelPage.count({ where: { funnelId } });

    const page = await prisma.funnelPage.create({
      data: {
        funnelId,
        name,
        slug,
        content: [],
        order: count,
      },
    });

    // stepId があればFunnelStepと紐付け
    if (stepId) {
      await prisma.funnelStep.update({
        where: { id: stepId },
        data: { pageId: page.id },
      });
    }

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Failed to create page:", error);
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}
