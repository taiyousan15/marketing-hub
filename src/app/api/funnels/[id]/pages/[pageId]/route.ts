import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

const updatePageSchema = z.object({
  name: z.string().min(1).optional(),
  content: z.array(z.any()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  ogImage: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

/**
 * ページ詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { pageId } = await params;

    const page = await prisma.funnelPage.findUnique({
      where: { id: pageId },
      include: {
        steps: { select: { id: true, name: true, type: true, order: true } },
        funnel: { select: { id: true, name: true, type: true, status: true } },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error("Failed to fetch page:", error);
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
  }
}

/**
 * ページ更新（LP Builder の保存）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { pageId } = await params;
    const body = await request.json();
    const data = updatePageSchema.parse(body);

    const page = await prisma.funnelPage.update({
      where: { id: pageId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.content !== undefined
          ? { content: data.content as unknown as Prisma.InputJsonValue }
          : {}),
        ...(data.seoTitle !== undefined ? { seoTitle: data.seoTitle } : {}),
        ...(data.seoDescription !== undefined ? { seoDescription: data.seoDescription } : {}),
        ...(data.ogImage !== undefined ? { ogImage: data.ogImage } : {}),
      },
    });

    return NextResponse.json({ page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Failed to update page:", error);
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

/**
 * ページ削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { pageId } = await params;

    await prisma.funnelPage.delete({ where: { id: pageId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete page:", error);
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
