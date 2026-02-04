/**
 * アフィリエイト報酬支払い管理API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// 支払い一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const partnerId = searchParams.get("partnerId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { tenantId };
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;

    const [payouts, total] = await Promise.all([
      prisma.affiliatePayout.findMany({
        where,
        include: {
          partner: {
            select: {
              id: true,
              name: true,
              code: true,
              email: true,
              bankAccountType: true,
              bankAccountNumber: true,
              bankAccountName: true,
              bankName: true,
              bankBranch: true,
            },
          },
          _count: {
            select: { commissions: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.affiliatePayout.count({ where }),
    ]);

    return NextResponse.json({
      payouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch payouts" },
      { status: 500 }
    );
  }
}

// 支払い処理を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, partnerId, method = "BANK_TRANSFER" } = body;

    if (!tenantId || !partnerId) {
      return NextResponse.json(
        { error: "tenantId and partnerId are required" },
        { status: 400 }
      );
    }

    // パートナーを確認
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
    });

    if (!partner || partner.tenantId !== tenantId) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    // 支払い可能なコミッションを取得
    // - ステータスがAPPROVED
    // - payableAtが過去（冷却期間終了）
    // - まだ支払いに紐付いていない
    const now = new Date();
    const payableCommissions = await prisma.affiliateCommission.findMany({
      where: {
        tenantId,
        partnerId,
        status: "APPROVED",
        payableAt: { lte: now },
        payoutId: null,
      },
    });

    if (payableCommissions.length === 0) {
      return NextResponse.json(
        { error: "No payable commissions found" },
        { status: 400 }
      );
    }

    // 合計金額を計算
    const totalAmount = payableCommissions.reduce(
      (sum, c) => sum + c.amount,
      0
    );

    // 最低支払い金額をチェック（デフォルト: 5000円）
    const minimumPayout = partner.minimumPayoutAmount || 5000;
    if (totalAmount < minimumPayout) {
      return NextResponse.json(
        {
          error: `Total amount (${totalAmount}) is below minimum payout (${minimumPayout})`,
        },
        { status: 400 }
      );
    }

    // 対象期間を計算（最も古いコミッションから最も新しいコミッションまで）
    const createdDates = payableCommissions.map((c) => c.createdAt);
    const periodStart = new Date(Math.min(...createdDates.map((d) => d.getTime())));
    const periodEnd = new Date(Math.max(...createdDates.map((d) => d.getTime())));

    // 支払いレコードを作成
    const payout = await prisma.affiliatePayout.create({
      data: {
        tenantId,
        partnerId,
        amount: totalAmount,
        method: method as "BANK_TRANSFER" | "PAYPAL",
        status: "PENDING",
        periodStart,
        periodEnd,
      },
    });

    // コミッションを支払いに紐付け
    await prisma.affiliateCommission.updateMany({
      where: {
        id: { in: payableCommissions.map((c) => c.id) },
      },
      data: {
        payoutId: payout.id,
        // ステータスはAPPROVEDのまま（支払い完了時にPAIDに変更）
      },
    });

    // 支払い情報を返す
    const createdPayout = await prisma.affiliatePayout.findUnique({
      where: { id: payout.id },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
            bankAccountType: true,
            bankAccountNumber: true,
            bankAccountName: true,
            bankName: true,
            bankBranch: true,
          },
        },
        commissions: {
          select: {
            id: true,
            amount: true,
            type: true,
            tier: true,
          },
        },
      },
    });

    return NextResponse.json({ payout: createdPayout }, { status: 201 });
  } catch (error) {
    console.error("Error creating payout:", error);
    return NextResponse.json(
      { error: "Failed to create payout" },
      { status: 500 }
    );
  }
}

// 支払いステータス更新
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { payoutId, action, transactionId, note } = body;

    if (!payoutId || !action) {
      return NextResponse.json(
        { error: "payoutId and action are required" },
        { status: 400 }
      );
    }

    const payout = await prisma.affiliatePayout.findUnique({
      where: { id: payoutId },
      include: { commissions: true },
    });

    if (!payout) {
      return NextResponse.json(
        { error: "Payout not found" },
        { status: 404 }
      );
    }

    let updateData: Record<string, unknown> = {};
    let commissionStatus: string | null = null;

    switch (action) {
      case "process":
        // 支払い処理開始
        updateData = {
          // ステータスはAPPROVEDのまま（支払い完了時にPAIDに変更）
          processedAt: new Date(),
        };
        break;

      case "complete":
        // 支払い完了
        updateData = {
          status: "COMPLETED",
          processedAt: new Date(),
          transactionId,
          note,
        };
        commissionStatus = "PAID";

        // パートナーの未払い報酬を減算
        await prisma.partner.update({
          where: { id: payout.partnerId },
          data: {
            unpaidEarnings: { decrement: payout.amount },
          },
        });
        break;

      case "fail":
        // 支払い失敗
        updateData = {
          status: "FAILED",
          note,
        };
        commissionStatus = "APPROVED"; // コミッションを承認状態に戻す
        break;

      case "cancel":
        // 支払いキャンセル
        updateData = {
          status: "CANCELLED",
          note,
        };
        commissionStatus = "APPROVED"; // コミッションを承認状態に戻す
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // 支払いを更新
    await prisma.affiliatePayout.update({
      where: { id: payoutId },
      data: updateData,
    });

    // コミッションステータスを更新
    if (commissionStatus) {
      await prisma.affiliateCommission.updateMany({
        where: { payoutId },
        data: {
          status: commissionStatus as "APPROVED" | "PAID",
          ...(commissionStatus === "PAID" ? { paidAt: new Date() } : {}),
        },
      });
    }

    // 失敗またはキャンセルの場合、コミッションの紐付けを解除
    if (action === "fail" || action === "cancel") {
      await prisma.affiliateCommission.updateMany({
        where: { payoutId },
        data: { payoutId: null },
      });
    }

    const updatedPayout = await prisma.affiliatePayout.findUnique({
      where: { id: payoutId },
      include: {
        partner: {
          select: { id: true, name: true, code: true, email: true },
        },
        commissions: {
          select: { id: true, amount: true, status: true },
        },
      },
    });

    return NextResponse.json({ payout: updatedPayout });
  } catch (error) {
    console.error("Error updating payout:", error);
    return NextResponse.json(
      { error: "Failed to update payout" },
      { status: 500 }
    );
  }
}

// 一括支払い処理
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, method = "BANK_TRANSFER" } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const now = new Date();

    // 支払い可能なコミッションを持つパートナーを取得
    const partnersWithCommissions = await prisma.affiliateCommission.groupBy({
      by: ["partnerId"],
      where: {
        tenantId,
        status: "APPROVED",
        payableAt: { lte: now },
        payoutId: null,
      },
      _sum: { amount: true },
    });

    const results: Array<{
      partnerId: string;
      status: string;
      payoutId?: string;
      amount?: number;
      error?: string;
    }> = [];

    for (const partnerData of partnersWithCommissions) {
      const { partnerId, _sum } = partnerData;
      const totalAmount = _sum.amount || 0;

      // パートナー情報を取得
      const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
      });

      if (!partner) {
        results.push({
          partnerId,
          status: "skipped",
          error: "Partner not found",
        });
        continue;
      }

      // 最低支払い金額をチェック
      const minimumPayout = partner.minimumPayoutAmount || 5000;
      if (totalAmount < minimumPayout) {
        results.push({
          partnerId,
          status: "skipped",
          amount: totalAmount,
          error: `Below minimum payout (${minimumPayout})`,
        });
        continue;
      }

      // 支払い可能なコミッションを取得
      const commissions = await prisma.affiliateCommission.findMany({
        where: {
          tenantId,
          partnerId,
          status: "APPROVED",
          payableAt: { lte: now },
          payoutId: null,
        },
      });

      // 対象期間を計算
      const createdDates = commissions.map((c) => c.createdAt);
      const periodStart = new Date(Math.min(...createdDates.map((d) => d.getTime())));
      const periodEnd = new Date(Math.max(...createdDates.map((d) => d.getTime())));

      // 支払いを作成
      const payout = await prisma.affiliatePayout.create({
        data: {
          tenantId,
          partnerId,
          amount: totalAmount,
          method: method as "BANK_TRANSFER" | "PAYPAL",
          status: "PENDING",
          periodStart,
          periodEnd,
        },
      });

      // コミッションを紐付け
      await prisma.affiliateCommission.updateMany({
        where: {
          id: { in: commissions.map((c) => c.id) },
        },
        data: {
          payoutId: payout.id,
          // ステータスはAPPROVEDのまま（支払い完了時にPAIDに変更）
        },
      });

      results.push({
        partnerId,
        status: "created",
        payoutId: payout.id,
        amount: totalAmount,
      });
    }

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        created: results.filter((r) => r.status === "created").length,
        skipped: results.filter((r) => r.status === "skipped").length,
      },
    });
  } catch (error) {
    console.error("Error in bulk payout creation:", error);
    return NextResponse.json(
      { error: "Failed to create bulk payouts" },
      { status: 500 }
    );
  }
}
