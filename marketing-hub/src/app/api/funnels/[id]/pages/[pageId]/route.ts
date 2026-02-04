import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

/**
 * 単一ページ取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id, pageId } = await params;
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

    const page = await prisma.funnelPage.findUnique({
      where: {
        id: pageId,
        funnelId: id,
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error("Failed to fetch page:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

/**
 * ページ更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id, pageId } = await params;
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

    // ページの存在確認
    const existingPage = await prisma.funnelPage.findUnique({
      where: {
        id: pageId,
        funnelId: id,
      },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // 更新データを構築
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.slug !== undefined) {
      // スラグの重複チェック
      const duplicate = await prisma.funnelPage.findFirst({
        where: {
          funnelId: id,
          slug: body.slug,
          NOT: { id: pageId },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 }
        );
      }
      updateData.slug = body.slug;
    }
    if (body.content !== undefined) {
      updateData.content = body.content;
    }
    if (body.seoTitle !== undefined) {
      updateData.seoTitle = body.seoTitle;
    }
    if (body.seoDescription !== undefined) {
      updateData.seoDescription = body.seoDescription;
    }
    if (body.ogImage !== undefined) {
      updateData.ogImage = body.ogImage;
    }

    const page = await prisma.funnelPage.update({
      where: { id: pageId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error) {
    console.error("Failed to update page:", error);
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 }
    );
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
    const { id, pageId } = await params;
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

    // ページの存在確認
    const page = await prisma.funnelPage.findUnique({
      where: {
        id: pageId,
        funnelId: id,
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // 関連するステップのpageIdをnullに更新
    await prisma.funnelStep.updateMany({
      where: {
        pageId: pageId,
      },
      data: {
        pageId: null,
      },
    });

    // ページを削除
    await prisma.funnelPage.delete({
      where: { id: pageId },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Failed to delete page:", error);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
