import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { validateRewardInput, type InputField } from "@/lib/auto-webinar/rewards";
import { deliverRewardServer } from "@/lib/auto-webinar/reward-delivery";
import { withRateLimit, withSessionRateLimit, REWARD_CLAIM_RATE_LIMIT } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 特典獲得
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // IPベースのレート制限
  const ipRateLimitResponse = withRateLimit(request, "reward-claim", REWARD_CLAIM_RATE_LIMIT);
  if (ipRateLimitResponse) {
    return ipRateLimitResponse;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      rewardId,
      sessionToken,
      contactId,
      inputData,
      keyword,
      watchedSeconds,
    } = body;

    // セッションベースのレート制限（sessionTokenがある場合）
    if (sessionToken) {
      const sessionRateLimitResponse = withSessionRateLimit(
        sessionToken,
        "reward-claim",
        REWARD_CLAIM_RATE_LIMIT
      );
      if (sessionRateLimitResponse) {
        return sessionRateLimitResponse;
      }
    }

    if (!rewardId) {
      return NextResponse.json({ error: "Reward ID required" }, { status: 400 });
    }

    // 特典の存在確認
    const reward = await prisma.autoWebinarReward.findFirst({
      where: {
        id: rewardId,
        webinarId: id,
        isActive: true,
      },
    });

    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    // 最大獲得数チェック
    if (reward.maxClaims && reward.currentClaims >= reward.maxClaims) {
      return NextResponse.json({ error: "Reward limit reached" }, { status: 400 });
    }

    // セッションの取得（あれば）
    let session = null;
    if (sessionToken) {
      session = await prisma.autoWebinarSession.findUnique({
        where: { sessionToken },
      });
    }

    // 重複チェック
    if (session) {
      const existingClaim = await prisma.autoWebinarRewardClaim.findFirst({
        where: {
          rewardId,
          sessionId: session.id,
        },
      });

      if (existingClaim) {
        return NextResponse.json({ error: "Already claimed" }, { status: 400 });
      }
    }

    // 特典タイプ別のバリデーション
    switch (reward.rewardType) {
      case "WATCH_TIME":
        if (!watchedSeconds || (reward.watchTimeSeconds && watchedSeconds < reward.watchTimeSeconds)) {
          return NextResponse.json({ error: "Watch time requirement not met" }, { status: 400 });
        }
        break;

      case "KEYWORD":
        if (!keyword) {
          return NextResponse.json({ error: "Keyword required" }, { status: 400 });
        }
        const keywords = (reward.triggerKeywords as unknown as string[]) || [];
        const normalizedKeyword = keyword.toLowerCase().trim();
        if (!keywords.some(k => k.toLowerCase().trim() === normalizedKeyword)) {
          return NextResponse.json({ error: "Invalid keyword" }, { status: 400 });
        }
        break;

      case "TIMED_INPUT":
        if (reward.inputFields && inputData) {
          const fields = reward.inputFields as unknown as InputField[];
          const validation = validateRewardInput(fields, inputData);
          if (!validation.valid) {
            return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 });
          }
        }
        break;
    }

    // トランザクションで獲得処理
    const [claim] = await prisma.$transaction([
      // 獲得記録作成
      prisma.autoWebinarRewardClaim.create({
        data: {
          rewardId,
          sessionId: session?.id,
          contactId,
          inputData: inputData || null,
          keyword: keyword || null,
          watchedSeconds: watchedSeconds || null,
        },
      }),
      // 獲得カウント更新
      prisma.autoWebinarReward.update({
        where: { id: rewardId },
        data: {
          currentClaims: { increment: 1 },
        },
      }),
    ]);

    // 特典配布処理
    const rewardDefinition = {
      id: reward.id,
      name: reward.name,
      description: reward.description,
      rewardType: reward.rewardType,
      watchTimeSeconds: reward.watchTimeSeconds,
      triggerKeywords: reward.triggerKeywords as unknown as string[] | null,
      appearAtSeconds: reward.appearAtSeconds,
      inputDeadlineSeconds: reward.inputDeadlineSeconds,
      inputFields: reward.inputFields as unknown as InputField[] | null,
      deliveryType: reward.deliveryType,
      popupTitle: reward.popupTitle,
      popupDescription: reward.popupDescription,
      popupButtonText: reward.popupButtonText,
      popupPosition: reward.popupPosition,
      maxClaims: reward.maxClaims,
      currentClaims: reward.currentClaims,
      isActive: reward.isActive,
    };

    const deliveryResult = await deliverRewardServer(rewardDefinition, contactId, inputData);

    // 配布結果を更新
    await prisma.autoWebinarRewardClaim.update({
      where: { id: claim.id },
      data: {
        delivered: deliveryResult.success,
        deliveredAt: deliveryResult.success ? new Date() : null,
        deliveryError: deliveryResult.success ? null : deliveryResult.message,
      },
    });

    return NextResponse.json({
      success: true,
      claim: {
        id: claim.id,
        claimedAt: claim.claimedAt,
      },
      delivery: deliveryResult,
    });
  } catch (error) {
    console.error("Failed to claim reward:", error);
    return NextResponse.json({ error: "Failed to claim reward" }, { status: 500 });
  }
}

/**
 * 獲得済み特典一覧（セッション用）
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get("sessionToken");
    const contactId = searchParams.get("contactId");

    if (!sessionToken && !contactId) {
      return NextResponse.json({ error: "Session token or contact ID required" }, { status: 400 });
    }

    // セッションの取得
    let sessionId: string | null = null;
    if (sessionToken) {
      const session = await prisma.autoWebinarSession.findUnique({
        where: { sessionToken },
      });
      sessionId = session?.id || null;
    }

    // 獲得済み特典を取得
    const claims = await prisma.autoWebinarRewardClaim.findMany({
      where: {
        reward: { webinarId: id },
        OR: [
          { sessionId: sessionId || undefined },
          { contactId: contactId || undefined },
        ].filter(c => Object.values(c)[0] !== undefined),
      },
      include: {
        reward: {
          select: {
            id: true,
            name: true,
            rewardType: true,
          },
        },
      },
    });

    return NextResponse.json({
      claims,
      claimedRewardIds: claims.map(c => c.rewardId),
    });
  } catch (error) {
    console.error("Failed to fetch claims:", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}
