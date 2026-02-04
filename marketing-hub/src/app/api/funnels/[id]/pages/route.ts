import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

/**
 * ファネルページ一覧取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const pages = await prisma.funnelPage.findMany({
      where: {
        funnelId: id,
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Failed to fetch pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

/**
 * ファネルページ作成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();

    if (!userInfo?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, stepId, stepType } = body;

    // ファネルの所有権確認
    const funnel = await prisma.funnel.findUnique({
      where: {
        id,
        tenantId: userInfo.tenantId,
      },
      include: {
        pages: true,
      },
    });

    if (!funnel) {
      return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
    }

    // ステップの存在確認（指定されている場合）
    if (stepId) {
      const step = await prisma.funnelStep.findUnique({
        where: { id: stepId },
      });

      if (!step || step.funnelId !== id) {
        return NextResponse.json({ error: "Step not found" }, { status: 404 });
      }
    }

    // スラグを生成
    const baseSlug = generateSlug(name || "page");
    let slug = baseSlug;
    let counter = 1;

    // スラグの重複チェック
    while (
      await prisma.funnelPage.findFirst({
        where: { funnelId: id, slug },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // ページのデフォルトコンテンツを生成
    const defaultContent = generateDefaultContent(stepType || "LANDING");

    // トランザクションでページ作成とステップ更新を実行
    const result = await prisma.$transaction(async (tx) => {
      // ページを作成
      const page = await tx.funnelPage.create({
        data: {
          funnelId: id,
          name: name || "新規ページ",
          slug,
          content: defaultContent,
          order: funnel.pages.length,
        },
      });

      // ステップが指定されていれば、ステップにページを紐付け
      if (stepId) {
        await tx.funnelStep.update({
          where: { id: stepId },
          data: { pageId: page.id },
        });
      }

      return page;
    });

    return NextResponse.json({
      success: true,
      page: result,
    });
  } catch (error) {
    console.error("Failed to create page:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}

/**
 * スラグ生成
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50) || "page";
}

/**
 * ステップタイプに応じたデフォルトコンテンツを生成
 */
function generateDefaultContent(stepType: string): object[] {
  const templates: Record<string, object[]> = {
    OPTIN: [
      {
        type: "header-simple",
        props: {
          logoText: "ブランド名",
          navItems: "",
          ctaText: "",
          backgroundColor: "#ffffff",
        },
      },
      {
        type: "hero-classic",
        props: {
          headline: "無料プレゼント",
          subheadline: "今すぐ登録して特典を受け取る",
          ctaText: "無料で受け取る",
          backgroundColor: "#f8fafc",
        },
      },
      {
        type: "form-newsletter",
        props: {
          title: "メールアドレスを入力",
          buttonText: "今すぐ登録",
          placeholderText: "your@email.com",
        },
      },
    ],
    SALES: [
      {
        type: "header-simple",
        props: {
          logoText: "ブランド名",
          backgroundColor: "#ffffff",
        },
      },
      {
        type: "hero-classic",
        props: {
          headline: "あなたの悩みを解決",
          subheadline: "驚きの結果をお約束します",
          ctaText: "今すぐ購入",
          backgroundColor: "#f8fafc",
        },
      },
      {
        type: "problem-grid",
        props: {
          title: "こんな悩みありませんか？",
          problems: "問題1\n問題2\n問題3",
        },
      },
      {
        type: "solution-features",
        props: {
          title: "解決策はこれです",
          features: "機能1\n機能2\n機能3",
        },
      },
      {
        type: "testimonial-cards",
        props: {
          title: "お客様の声",
        },
      },
      {
        type: "cta-simple",
        props: {
          headline: "今すぐ始めましょう",
          buttonText: "購入する",
          backgroundColor: "#3b82f6",
        },
      },
    ],
    THANK_YOU: [
      {
        type: "hero-minimal",
        props: {
          headline: "ありがとうございます！",
          subheadline: "ご登録が完了しました",
        },
      },
      {
        type: "content-text",
        props: {
          content: "メールをご確認ください。特典のダウンロードリンクをお送りしました。",
        },
      },
    ],
    LANDING: [
      {
        type: "header-simple",
        props: {
          logoText: "ブランド名",
          navItems: "特徴\n料金\nお問い合わせ",
          ctaText: "今すぐ始める",
          backgroundColor: "#ffffff",
        },
      },
      {
        type: "hero-classic",
        props: {
          headline: "キャッチコピーをここに",
          subheadline: "サブキャッチコピーで補足説明",
          ctaText: "詳細を見る",
          backgroundColor: "#f8fafc",
        },
      },
    ],
  };

  return templates[stepType] || templates.LANDING;
}
