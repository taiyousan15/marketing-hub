import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const trackSchema = z.object({
  pageId: z.string(),
  event: z.enum(["view", "conversion"]),
  variantId: z.string().optional(),
});

/**
 * ファネルページのPV/CV計測（認証不要の公開エンドポイント）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { pageId, event, variantId } = trackSchema.parse(body);

    if (event === "view") {
      await prisma.funnelPage.update({
        where: { id: pageId },
        data: { pageViews: { increment: 1 } },
      });

      // A/Bテストのバリアントインプレッション記録
      if (variantId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const variant = await prisma.aBTestVariant.findUnique({
          where: { id: variantId },
          select: { testId: true },
        });

        if (variant) {
          // 既存の日次レコードを更新、なければ作成
          const existing = await prisma.aBTestResult.findFirst({
            where: {
              variantId,
              date: { gte: today },
            },
          });

          if (existing) {
            await prisma.aBTestResult.update({
              where: { id: existing.id },
              data: { impressions: { increment: 1 } },
            });
          } else {
            await prisma.aBTestResult.create({
              data: {
                testId: variant.testId,
                variantId,
                impressions: 1,
                conversions: 0,
              },
            });
          }
        }
      }
    } else if (event === "conversion") {
      await prisma.funnelPage.update({
        where: { id: pageId },
        data: { conversions: { increment: 1 } },
      });

      // A/BテストのCV記録
      if (variantId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await prisma.aBTestResult.findFirst({
          where: {
            variantId,
            date: { gte: today },
          },
        });

        if (existing) {
          await prisma.aBTestResult.update({
            where: { id: existing.id },
            data: { conversions: { increment: 1 } },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}
