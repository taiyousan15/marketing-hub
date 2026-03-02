"use server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { generateAffiliateCode } from "@/lib/affiliate/service";
import {
  sendPartnerApprovalEmail,
  sendPayoutNotificationEmail,
} from "@/lib/email/resend-client";
import { isBankAccountComplete } from "@/lib/validations/bank-account";

export async function getAffiliatePartners(options?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("認証が必要です");

  const { status, search, page = 1, limit = 20 } = options ?? {};

  const where: Record<string, unknown> = { tenantId: user.tenantId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  const [partners, total] = await Promise.all([
    prisma.partner.findMany({
      where,
      include: {
        _count: {
          select: {
            affiliateConversions: true,
            affiliateLinks: true,
          },
        },
        affiliateConversions: {
          select: { amount: true, status: true },
        },
        affiliateLinks: {
          select: { clicks: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.partner.count({ where }),
  ]);

  const enriched = partners.map((p) => {
    const totalClicks = p.affiliateLinks.reduce((s, l) => s + l.clicks, 0);
    const totalConversions = p.affiliateConversions.length;
    const totalEarnings = p.affiliateConversions
      .filter((c) => c.status !== "REJECTED")
      .reduce((s, c) => s + c.amount, 0);
    const pendingEarnings = p.affiliateConversions
      .filter((c) => c.status === "PENDING")
      .reduce((s, c) => s + c.amount, 0);
    const conversionRate =
      totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return {
      id: p.id,
      name: p.name,
      email: p.email,
      code: p.code,
      status: p.status,
      commissionRate: p.commissionRate,
      totalClicks,
      totalConversions,
      totalEarnings,
      pendingEarnings,
      conversionRate: Math.round(conversionRate * 100) / 100,
      createdAt: p.createdAt.toISOString(),
    };
  });

  return {
    partners: enriched,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getAffiliateLinks(options?: {
  page?: number;
  limit?: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("認証が必要です");

  const { page = 1, limit = 20 } = options ?? {};

  const [links, total] = await Promise.all([
    prisma.affiliateLink.findMany({
      where: { tenantId: user.tenantId },
      include: {
        partner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.affiliateLink.count({ where: { tenantId: user.tenantId } }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    links: links.map((l) => ({
      id: l.id,
      linkCode: l.linkCode,
      url: l.url,
      affiliateUrl: `${baseUrl}/r/${l.linkCode}`,
      partnerName: l.partner.name,
      partnerId: l.partner.id,
      clicks: l.clicks,
      conversions: l.conversions,
      createdAt: l.createdAt.toISOString(),
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getAffiliatePayouts(options?: {
  page?: number;
  limit?: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("認証が必要です");

  const { page = 1, limit = 20 } = options ?? {};

  const [payouts, total] = await Promise.all([
    prisma.affiliatePayout.findMany({
      where: { tenantId: user.tenantId },
      include: {
        partner: {
          select: { id: true, name: true, email: true, bankAccountInfo: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.affiliatePayout.count({ where: { tenantId: user.tenantId } }),
  ]);

  return {
    payouts: payouts.map((p) => ({
      id: p.id,
      partnerId: p.partner.id,
      partnerName: p.partner.name,
      amount: p.amount,
      status: p.status,
      paymentMethod: p.paymentMethod,
      paidAt: p.paidAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      hasBankAccount: isBankAccountComplete(p.partner.bankAccountInfo),
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getAffiliateStats() {
  const user = await getCurrentUser();
  if (!user) throw new Error("認証が必要です");

  const tenantId = user.tenantId;

  const [activePartners, pendingPartners, clickCount, earningsAgg, pendingAgg] =
    await Promise.all([
      prisma.partner.count({ where: { tenantId, status: "ACTIVE" } }),
      prisma.partner.count({ where: { tenantId, status: "PENDING" } }),
      prisma.affiliateClick.count({ where: { tenantId } }),
      prisma.affiliateConversion.aggregate({
        where: { tenantId, status: { not: "REJECTED" } },
        _sum: { amount: true },
      }),
      prisma.affiliateConversion.aggregate({
        where: { tenantId, status: "PENDING" },
        _sum: { amount: true },
      }),
    ]);

  return {
    activePartners,
    pendingPartners,
    totalClicks: clickCount,
    totalEarnings: earningsAgg._sum.amount ?? 0,
    pendingPayout: pendingAgg._sum.amount ?? 0,
  };
}

// ==================== コンバージョン管理 ====================

export async function getAffiliateConversions(params?: {
  status?: string;
  partnerId?: string;
  page?: number;
  limit?: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("認証が必要です");

  const { status, partnerId, page = 1, limit = 20 } = params ?? {};

  const where: Record<string, unknown> = { tenantId: user.tenantId };
  if (status) where.status = status;
  if (partnerId) where.partnerId = partnerId;

  const [conversions, total] = await Promise.all([
    prisma.affiliateConversion.findMany({
      where,
      include: {
        partner: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.affiliateConversion.count({ where }),
  ]);

  return {
    conversions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function approveConversion(
  conversionId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "認証が必要です" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/affiliate/conversions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversionId, action: "approve", tenantId: user.tenantId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { success: false, error: (data as { error?: string }).error ?? "承認に失敗しました" };
  }
  return { success: true };
}

export async function rejectConversion(
  conversionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "認証が必要です" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/affiliate/conversions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversionId,
      action: "reject",
      rejectionReason: reason,
      tenantId: user.tenantId,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { success: false, error: (data as { error?: string }).error ?? "却下に失敗しました" };
  }
  return { success: true };
}

export async function refundConversion(
  conversionId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "認証が必要です" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/affiliate/conversions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversionId, action: "refund", tenantId: user.tenantId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { success: false, error: (data as { error?: string }).error ?? "返金処理に失敗しました" };
  }
  return { success: true };
}

// ==================== 管理者用ミューテーション ====================

export async function addAffiliatePartner(data: {
  name: string;
  email: string;
  commissionRate: number;
}): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "認証が必要です" };

  const { name, email, commissionRate } = data;

  const existing = await prisma.partner.findFirst({
    where: { tenantId: user.tenantId, email },
  });
  if (existing) {
    return { success: false, error: "このメールアドレスは既に登録されています" };
  }

  let code = generateAffiliateCode();
  while (await prisma.partner.findUnique({ where: { code } })) {
    code = generateAffiliateCode();
  }

  await prisma.partner.create({
    data: {
      tenantId: user.tenantId,
      email,
      name,
      code,
      commissionRate,
      status: "ACTIVE",
    },
  });

  return { success: true };
}

export async function updatePartnerStatus(
  partnerId: string,
  action: "approve" | "suspend"
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "認証が必要です" };

  const partner = await prisma.partner.findFirst({
    where: { id: partnerId, tenantId: user.tenantId },
  });
  if (!partner) return { success: false, error: "パートナーが見つかりません" };

  const newStatus = action === "approve" ? "ACTIVE" : "SUSPENDED";
  await prisma.partner.update({
    where: { id: partnerId },
    data: { status: newStatus },
  });

  if (action === "approve" && process.env.RESEND_API_KEY) {
    await sendPartnerApprovalEmail(partner.email, partner.name).catch(
      (err) => { console.error("Approval email failed:", err); }
    );
  }

  return { success: true };
}

export async function processPayoutById(
  payoutId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "認証が必要です" };

  const payout = await prisma.affiliatePayout.findFirst({
    where: { id: payoutId, tenantId: user.tenantId },
    include: {
      partner: {
        select: {
          name: true,
          email: true,
          notifyPayout: true,
          bankAccountInfo: true,
        },
      },
    },
  });
  if (!payout) return { success: false, error: "支払いが見つかりません" };

  if (!isBankAccountComplete(payout.partner.bankAccountInfo)) {
    return {
      success: false,
      error: "パートナーの口座情報が未登録または不完全です",
    };
  }

  await prisma.affiliatePayout.update({
    where: { id: payoutId },
    data: {
      status: "COMPLETED",
      paidAt: new Date(),
      updatedAt: new Date(),
      paymentDetails: payout.partner.bankAccountInfo as object,
    },
  });

  if (payout.partner.notifyPayout && process.env.RESEND_API_KEY) {
    await sendPayoutNotificationEmail(
      payout.partner.email,
      payout.partner.name,
      payout.amount,
      payout.paymentMethod
    ).catch((err) => { console.error("Payout email failed:", err); });
  }

  return { success: true };
}

export async function processBulkPayouts(): Promise<{
  success: boolean;
  created: number;
  skipped: number;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { success: false, created: 0, skipped: 0, error: "認証が必要です" };

  const tenantId = user.tenantId;

  const partnersWithCommissions = await prisma.affiliateCommission.groupBy({
    by: ["partnerId"],
    where: { tenantId, status: "APPROVED" },
    _sum: { amount: true },
  });

  let created = 0;
  let skipped = 0;

  for (const { partnerId, _sum } of partnersWithCommissions) {
    const totalAmount = _sum.amount ?? 0;
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) { skipped++; continue; }

    const minimumPayout = partner.minimumPayoutAmount || 5000;
    if (totalAmount < minimumPayout) { skipped++; continue; }

    if (!isBankAccountComplete(partner.bankAccountInfo)) {
      skipped++;
      continue;
    }

    await prisma.affiliatePayout.create({
      data: {
        tenantId,
        partnerId,
        amount: totalAmount,
        paymentMethod: "BANK_TRANSFER",
        paymentDetails: partner.bankAccountInfo as object,
        status: "PENDING",
        updatedAt: new Date(),
      },
    });
    created++;
  }

  return { success: true, created, skipped };
}
