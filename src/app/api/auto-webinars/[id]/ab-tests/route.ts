import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  analyzeABTest,
  startABTest,
  pauseABTest,
  completeABTest,
} from "@/lib/auto-webinar/ab-testing";
import { ABTestStatus, ABTestAlgorithm } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/tenant";
import { CreateABTestSchema, UpdateABTestSchema, formatValidationErrors } from "@/lib/auto-webinar/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * A/Bテスト一覧取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: webinarId } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // ウェビナーの存在確認（テナント検証）
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id: webinarId, tenantId },
      select: { id: true },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const tests = await prisma.offerABTest.findMany({
      where: { webinarId },
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 各テストの分析結果を追加
    const testsWithAnalysis = await Promise.all(
      tests.map(async (test) => {
        if (test.status === ABTestStatus.RUNNING || test.status === ABTestStatus.COMPLETED) {
          const analysis = await analyzeABTest(test.id);
          return { ...test, analysis };
        }
        return { ...test, analysis: null };
      })
    );

    return NextResponse.json({ tests: testsWithAnalysis });
  } catch (error) {
    console.error("Failed to fetch AB tests:", error);
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 });
  }
}

/**
 * A/Bテスト作成
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: webinarId } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // バリデーション
    const validationResult = CreateABTestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        formatValidationErrors(validationResult.error),
        { status: 400 }
      );
    }

    // ウェビナーの存在確認（テナント検証）
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id: webinarId, tenantId },
      select: { id: true },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const {
      offerId,
      name,
      description,
      algorithm = "RANDOM",
      confidenceLevel = 0.95,
      minSampleSize = 100,
      minConversions = 10,
      autoOptimize = false,
      variants = [],
    } = validationResult.data;

    // オファーの存在確認
    const offer = await prisma.autoWebinarTimedOffer.findFirst({
      where: {
        id: offerId,
        webinarId,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    // 同じオファーに実行中のテストがないか確認
    const existingTest = await prisma.offerABTest.findFirst({
      where: {
        offerId,
        status: { in: [ABTestStatus.RUNNING, ABTestStatus.DRAFT] },
      },
    });

    if (existingTest) {
      return NextResponse.json(
        { error: "An active test already exists for this offer" },
        { status: 400 }
      );
    }

    // テスト作成
    const test = await prisma.offerABTest.create({
      data: {
        webinarId,
        offerId,
        name,
        description,
        algorithm: algorithm as ABTestAlgorithm,
        confidenceLevel,
        minSampleSize,
        minConversions,
        autoOptimize,
        variants: {
          create: [
            // コントロール（元のオファー）
            {
              name: "A (コントロール)",
              isControl: true,
              title: offer.title,
              offerDescription: offer.description,
              buttonText: offer.buttonText,
              buttonUrl: offer.buttonUrl,
              countdownEnabled: offer.countdownEnabled,
              countdownSeconds: offer.countdownSeconds,
              limitedSeats: offer.limitedSeats,
              popupPosition: offer.popupPosition,
              weight: 50,
            },
            // バリアント
            ...variants.map((v: any, index: number) => ({
              name: v.name || `B${index > 0 ? index + 1 : ""}`,
              isControl: false,
              title: v.title,
              offerDescription: v.description,
              buttonText: v.buttonText,
              buttonUrl: v.buttonUrl,
              countdownEnabled: v.countdownEnabled,
              countdownSeconds: v.countdownSeconds,
              limitedSeats: v.limitedSeats,
              popupPosition: v.popupPosition,
              weight: v.weight || 50,
            })),
          ],
        },
      },
      include: {
        variants: true,
      },
    });

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    console.error("Failed to create AB test:", error);
    return NextResponse.json({ error: "Failed to create test" }, { status: 500 });
  }
}

/**
 * A/Bテスト更新
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: webinarId } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // ウェビナーの存在確認（テナント検証）
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id: webinarId, tenantId },
      select: { id: true },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const { testId, action, ...updateData } = body;

    if (!testId) {
      return NextResponse.json({ error: "testId is required" }, { status: 400 });
    }

    // テストの存在確認
    const test = await prisma.offerABTest.findFirst({
      where: {
        id: testId,
        webinarId,
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // アクション処理
    if (action) {
      switch (action) {
        case "start":
          await startABTest(testId);
          break;
        case "pause":
          await pauseABTest(testId);
          break;
        case "complete":
          if (!updateData.winnerId) {
            return NextResponse.json(
              { error: "winnerId is required for complete action" },
              { status: 400 }
            );
          }
          await completeABTest(testId, updateData.winnerId);
          break;
        default:
          return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }

      const updatedTest = await prisma.offerABTest.findUnique({
        where: { id: testId },
        include: { variants: true },
      });

      return NextResponse.json({ test: updatedTest });
    }

    // 通常の更新
    const updatedTest = await prisma.offerABTest.update({
      where: { id: testId },
      data: {
        name: updateData.name,
        description: updateData.description,
        algorithm: updateData.algorithm,
        confidenceLevel: updateData.confidenceLevel,
        minSampleSize: updateData.minSampleSize,
        minConversions: updateData.minConversions,
        autoOptimize: updateData.autoOptimize,
      },
      include: { variants: true },
    });

    return NextResponse.json({ test: updatedTest });
  } catch (error) {
    console.error("Failed to update AB test:", error);
    return NextResponse.json({ error: "Failed to update test" }, { status: 500 });
  }
}

/**
 * A/Bテスト削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: webinarId } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // ウェビナーの存在確認（テナント検証）
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id: webinarId, tenantId },
      select: { id: true },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const testId = request.nextUrl.searchParams.get("testId");

    if (!testId) {
      return NextResponse.json({ error: "testId is required" }, { status: 400 });
    }

    // テストの存在確認
    const test = await prisma.offerABTest.findFirst({
      where: {
        id: testId,
        webinarId,
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // 実行中のテストは削除不可
    if (test.status === ABTestStatus.RUNNING) {
      return NextResponse.json(
        { error: "Cannot delete a running test. Pause it first." },
        { status: 400 }
      );
    }

    await prisma.offerABTest.delete({
      where: { id: testId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete AB test:", error);
    return NextResponse.json({ error: "Failed to delete test" }, { status: 500 });
  }
}
