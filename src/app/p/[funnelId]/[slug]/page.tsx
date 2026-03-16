import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { LPPageClient } from "./lp-page-client";

interface Props {
  params: Promise<{ funnelId: string; slug: string }>;
}

/**
 * 公開LPページ — 認証不要
 * /p/[funnelId]/[slug]
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { funnelId, slug } = await params;

  const page = await prisma.funnelPage.findFirst({
    where: { funnelId, slug },
    select: { name: true, seoTitle: true, seoDescription: true, ogImage: true },
  });

  if (!page) return { title: "Not Found" };

  return {
    title: page.seoTitle || page.name,
    description: page.seoDescription || undefined,
    openGraph: page.ogImage
      ? { images: [{ url: page.ogImage }] }
      : undefined,
  };
}

export default async function PublicLPPage({ params }: Props) {
  const { funnelId, slug } = await params;

  const page = await prisma.funnelPage.findFirst({
    where: { funnelId, slug },
    select: {
      id: true,
      funnelId: true,
      name: true,
      slug: true,
      content: true,
      seoTitle: true,
      seoDescription: true,
      ogImage: true,
      funnel: {
        select: {
          id: true,
          name: true,
          status: true,
          steps: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              type: true,
              order: true,
              pageId: true,
              page: { select: { id: true, slug: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!page) notFound();

  // 非公開ファネルは404
  if (page.funnel.status !== "PUBLISHED") notFound();

  // 次ステップを特定（現在のページのステップ順序 + 1）
  const steps = page.funnel.steps;
  const currentStepIndex = steps.findIndex((s) => s.pageId === page.id);
  const nextStep =
    currentStepIndex >= 0 && currentStepIndex < steps.length - 1
      ? steps[currentStepIndex + 1]
      : null;
  const nextPageSlug = nextStep?.page?.slug ?? null;

  // アクティブなA/Bテストバリアントを取得（テーブル未作成時は空配列）
  let activeVariants: { id: string; testId: string; weight: number }[] = [];
  try {
    const variants = await prisma.aBTestVariant.findMany({
      where: {
        test: {
          funnelId,
          status: "RUNNING",
        },
        pageId: page.id,
      },
      select: { id: true, testId: true, weight: true },
    });
    activeVariants = variants;
  } catch {
    // ABTestVariant テーブルが未マイグレーションの場合はスキップ
  }

  return (
    <LPPageClient
      page={{
        id: page.id,
        name: page.name,
        slug: page.slug,
        content: page.content as unknown as Record<string, unknown>[],
      }}
      funnelId={funnelId}
      nextPageSlug={nextPageSlug}
      activeVariants={activeVariants}
    />
  );
}
