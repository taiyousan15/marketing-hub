/**
 * アフィリエイトサービス
 *
 * LINE登録からバックエンド商品販売までの追跡と報酬計算を行う
 */

import { prisma } from "@/lib/db/prisma";
import {
  AffiliateConversionType,
  AffiliateConversionStatus,
  AffiliateCommissionTypeName,
  AffiliateCommissionStatus,
  ProductCategory,
} from "@prisma/client";

// ==================== クリック追跡 ====================

interface RecordClickInput {
  affiliateLinkCode: string;
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
  fingerprint?: string;
}

interface RecordClickResult {
  success: boolean;
  clickId?: string;
  targetUrl?: string;
  error?: string;
}

/**
 * アフィリエイトリンクのクリックを記録
 */
export async function recordAffiliateClick(
  input: RecordClickInput
): Promise<RecordClickResult> {
  try {
    // リンクを取得
    const link = await prisma.affiliateLink.findUnique({
      where: { code: input.affiliateLinkCode },
      include: { partner: true },
    });

    if (!link || !link.isActive) {
      return { success: false, error: "Invalid or inactive affiliate link" };
    }

    if (link.partner.status !== "ACTIVE") {
      return { success: false, error: "Partner is not active" };
    }

    // デバイスタイプを判定
    const deviceType = detectDeviceType(input.userAgent);

    // クリックを記録
    const click = await prisma.affiliateClick.create({
      data: {
        affiliateLinkId: link.id,
        partnerId: link.partnerId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        referer: input.referer,
        fingerprint: input.fingerprint,
        deviceType,
      },
    });

    // リンクの統計を更新
    await prisma.affiliateLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    });

    // パートナーの統計を更新
    await prisma.partner.update({
      where: { id: link.partnerId },
      data: { totalClicks: { increment: 1 } },
    });

    return {
      success: true,
      clickId: click.clickId,
      targetUrl: link.targetUrl,
    };
  } catch (error) {
    console.error("Error recording affiliate click:", error);
    return { success: false, error: "Failed to record click" };
  }
}

// ==================== コンバージョン記録 ====================

interface RecordConversionInput {
  tenantId: string;
  clickId?: string;
  partnerCode?: string;
  type: AffiliateConversionType;
  contactId?: string;
  orderId?: string;
  amount?: number;
}

interface RecordConversionResult {
  success: boolean;
  conversionId?: string;
  commissions?: {
    partnerId: string;
    amount: number;
    tier: number;
  }[];
  error?: string;
}

/**
 * コンバージョン（成果）を記録し、報酬を計算
 */
export async function recordConversion(
  input: RecordConversionInput
): Promise<RecordConversionResult> {
  try {
    // クリックまたはパートナーコードからパートナーを特定
    let partnerId: string | null = null;
    let clickId: string | null = null;
    let affiliateLinkId: string | null = null;

    if (input.clickId) {
      const click = await prisma.affiliateClick.findUnique({
        where: { clickId: input.clickId },
        include: { affiliateLink: true },
      });

      if (click) {
        partnerId = click.partnerId;
        clickId = click.id;
        affiliateLinkId = click.affiliateLinkId;
      }
    }

    if (!partnerId && input.partnerCode) {
      const partner = await prisma.partner.findUnique({
        where: { code: input.partnerCode },
      });
      if (partner && partner.status === "ACTIVE") {
        partnerId = partner.id;
      }
    }

    if (!partnerId) {
      return { success: false, error: "Partner not found" };
    }

    // パートナー情報を取得
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        parentPartner: true,
      },
    });

    if (!partner) {
      return { success: false, error: "Partner not found" };
    }

    // コンバージョンを作成
    const conversion = await prisma.affiliateConversion.create({
      data: {
        tenantId: input.tenantId,
        partnerId,
        affiliateLinkId,
        clickId,
        type: input.type,
        contactId: input.contactId,
        orderId: input.orderId,
        amount: input.amount,
        status: AffiliateConversionStatus.PENDING,
      },
    });

    // 報酬を計算
    const commissions = await calculateCommissions(
      conversion.id,
      input.tenantId,
      partner,
      input.type,
      input.amount
    );

    // リンクの統計を更新
    if (affiliateLinkId) {
      await prisma.affiliateLink.update({
        where: { id: affiliateLinkId },
        data: { conversionCount: { increment: 1 } },
      });
    }

    // パートナーの統計を更新
    await prisma.partner.update({
      where: { id: partnerId },
      data: { totalConversions: { increment: 1 } },
    });

    return {
      success: true,
      conversionId: conversion.id,
      commissions: commissions.map((c) => ({
        partnerId: c.partnerId,
        amount: c.amount,
        tier: c.tier,
      })),
    };
  } catch (error) {
    console.error("Error recording conversion:", error);
    return { success: false, error: "Failed to record conversion" };
  }
}

// ==================== 報酬計算 ====================

interface PartnerWithParent {
  id: string;
  defaultOptinCommission: number;
  defaultFrontendCommission: number;
  defaultBackendCommission: number;
  tier2CommissionRate: number;
  rank: string;
  parentPartner: {
    id: string;
    defaultBackendCommission: number;
    tier2CommissionRate: number;
    rank: string;
  } | null;
}

/**
 * コンバージョンに対する報酬を計算
 */
async function calculateCommissions(
  conversionId: string,
  tenantId: string,
  partner: PartnerWithParent,
  type: AffiliateConversionType,
  amount?: number
): Promise<{ partnerId: string; amount: number; tier: number }[]> {
  const commissions: { partnerId: string; amount: number; tier: number }[] = [];
  const coolingOffDays = 30; // デフォルト30日

  // クーリングオフ後の支払い可能日
  const payableAt = new Date();
  payableAt.setDate(payableAt.getDate() + coolingOffDays);

  // 直接パートナーへの報酬（Tier 1）
  let tier1Amount = 0;
  let commissionType: AffiliateCommissionTypeName;

  switch (type) {
    case AffiliateConversionType.LINE_OPTIN:
    case AffiliateConversionType.EMAIL_OPTIN:
      // オプトイン報酬（固定額）
      tier1Amount = partner.defaultOptinCommission;
      commissionType = AffiliateCommissionTypeName.OPTIN;
      break;

    case AffiliateConversionType.FRONTEND_PURCHASE:
      // フロントエンド報酬（パーセント）
      if (amount) {
        tier1Amount = Math.floor(
          (amount * partner.defaultFrontendCommission) / 100
        );
      }
      commissionType = AffiliateCommissionTypeName.FRONTEND;
      break;

    case AffiliateConversionType.BACKEND_PURCHASE:
      // バックエンド報酬（パーセント）
      if (amount) {
        tier1Amount = Math.floor(
          (amount * partner.defaultBackendCommission) / 100
        );
      }
      commissionType = AffiliateCommissionTypeName.BACKEND;
      break;

    default:
      return commissions;
  }

  if (tier1Amount > 0) {
    // Tier 1 コミッションを作成
    await prisma.affiliateCommission.create({
      data: {
        tenantId,
        partnerId: partner.id,
        conversionId,
        type: commissionType,
        amount: tier1Amount,
        rate:
          type === AffiliateConversionType.LINE_OPTIN ||
          type === AffiliateConversionType.EMAIL_OPTIN
            ? null
            : type === AffiliateConversionType.FRONTEND_PURCHASE
            ? partner.defaultFrontendCommission
            : partner.defaultBackendCommission,
        baseAmount: amount,
        tier: 1,
        status: AffiliateCommissionStatus.PENDING,
        payableAt,
      },
    });

    commissions.push({
      partnerId: partner.id,
      amount: tier1Amount,
      tier: 1,
    });

    // パートナーの未払い報酬を更新
    await prisma.partner.update({
      where: { id: partner.id },
      data: {
        totalEarnings: { increment: tier1Amount },
        unpaidEarnings: { increment: tier1Amount },
      },
    });
  }

  // 2ティア報酬（親パートナーへ）
  if (
    partner.parentPartner &&
    tier1Amount > 0 &&
    partner.parentPartner.tier2CommissionRate > 0
  ) {
    const tier2Amount = Math.floor(
      (tier1Amount * partner.parentPartner.tier2CommissionRate) / 100
    );

    if (tier2Amount > 0) {
      await prisma.affiliateCommission.create({
        data: {
          tenantId,
          partnerId: partner.parentPartner.id,
          conversionId,
          type: AffiliateCommissionTypeName.TIER2,
          amount: tier2Amount,
          rate: partner.parentPartner.tier2CommissionRate,
          baseAmount: tier1Amount,
          tier: 2,
          sourcePartnerId: partner.id,
          status: AffiliateCommissionStatus.PENDING,
          payableAt,
        },
      });

      commissions.push({
        partnerId: partner.parentPartner.id,
        amount: tier2Amount,
        tier: 2,
      });

      // 親パートナーの未払い報酬を更新
      await prisma.partner.update({
        where: { id: partner.parentPartner.id },
        data: {
          totalEarnings: { increment: tier2Amount },
          unpaidEarnings: { increment: tier2Amount },
        },
      });
    }
  }

  return commissions;
}

// ==================== LINE登録時のアフィリエイト処理 ====================

interface ProcessLineOptinInput {
  tenantId: string;
  contactId: string;
  lineUserId: string;
  clickId?: string;
  partnerCode?: string;
}

/**
 * LINE友だち追加時のアフィリエイト処理
 */
export async function processLineOptin(
  input: ProcessLineOptinInput
): Promise<RecordConversionResult> {
  // コンタクトにアフィリエイト情報を紐付け
  if (input.clickId || input.partnerCode) {
    let partnerId: string | null = null;

    if (input.clickId) {
      const click = await prisma.affiliateClick.findUnique({
        where: { clickId: input.clickId },
      });
      if (click) {
        partnerId = click.partnerId;
      }
    }

    if (!partnerId && input.partnerCode) {
      const partner = await prisma.partner.findUnique({
        where: { code: input.partnerCode },
      });
      if (partner) {
        partnerId = partner.id;
      }
    }

    if (partnerId) {
      await prisma.contact.update({
        where: { id: input.contactId },
        data: {
          referredByPartnerId: partnerId,
          affiliateClickId: input.clickId,
        },
      });
    }
  }

  // コンバージョンを記録
  return recordConversion({
    tenantId: input.tenantId,
    clickId: input.clickId,
    partnerCode: input.partnerCode,
    type: AffiliateConversionType.LINE_OPTIN,
    contactId: input.contactId,
  });
}

// ==================== 商品購入時のアフィリエイト処理 ====================

interface ProcessPurchaseInput {
  tenantId: string;
  orderId: string;
  contactId: string;
  productId: string;
  amount: number;
}

/**
 * 商品購入時のアフィリエイト処理
 * コンタクトに紐付いているパートナーに対してバックエンド報酬を計算
 */
export async function processPurchase(
  input: ProcessPurchaseInput
): Promise<RecordConversionResult> {
  // コンタクトを取得
  const contact = await prisma.contact.findUnique({
    where: { id: input.contactId },
    include: { referredByPartner: true },
  });

  if (!contact?.referredByPartnerId) {
    return { success: false, error: "Contact has no referrer" };
  }

  // 商品カテゴリを確認
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });

  if (!product) {
    return { success: false, error: "Product not found" };
  }

  // アフィリエイトが有効か確認
  if (!product.affiliateEnabled) {
    return { success: false, error: "Affiliate not enabled for this product" };
  }

  // コンバージョンタイプを決定
  const conversionType =
    product.category === ProductCategory.BACKEND
      ? AffiliateConversionType.BACKEND_PURCHASE
      : AffiliateConversionType.FRONTEND_PURCHASE;

  // パートナーを取得
  const partner = await prisma.partner.findUnique({
    where: { id: contact.referredByPartnerId },
    include: { parentPartner: true },
  });

  if (!partner || partner.status !== "ACTIVE") {
    return { success: false, error: "Partner not active" };
  }

  // 商品固有の報酬率があればそちらを使用
  const commissionRate =
    product.affiliateCommissionRate ??
    (product.category === ProductCategory.BACKEND
      ? partner.defaultBackendCommission
      : partner.defaultFrontendCommission);

  // コンバージョンを作成
  const conversion = await prisma.affiliateConversion.create({
    data: {
      tenantId: input.tenantId,
      partnerId: partner.id,
      affiliateLinkId: null,
      clickId: contact.affiliateClickId,
      type: conversionType,
      contactId: input.contactId,
      orderId: input.orderId,
      amount: input.amount,
      status: AffiliateConversionStatus.PENDING,
    },
  });

  // 報酬を計算（商品固有の報酬率を考慮）
  const coolingOffDays = 30;
  const payableAt = new Date();
  payableAt.setDate(payableAt.getDate() + coolingOffDays);

  const commissions: { partnerId: string; amount: number; tier: number }[] = [];

  // Tier 1 報酬
  const tier1Amount = Math.floor((input.amount * commissionRate) / 100);

  if (tier1Amount > 0) {
    await prisma.affiliateCommission.create({
      data: {
        tenantId: input.tenantId,
        partnerId: partner.id,
        conversionId: conversion.id,
        type:
          product.category === ProductCategory.BACKEND
            ? AffiliateCommissionTypeName.BACKEND
            : AffiliateCommissionTypeName.FRONTEND,
        amount: tier1Amount,
        rate: commissionRate,
        baseAmount: input.amount,
        tier: 1,
        status: AffiliateCommissionStatus.PENDING,
        payableAt,
      },
    });

    commissions.push({
      partnerId: partner.id,
      amount: tier1Amount,
      tier: 1,
    });

    await prisma.partner.update({
      where: { id: partner.id },
      data: {
        totalEarnings: { increment: tier1Amount },
        unpaidEarnings: { increment: tier1Amount },
        totalConversions: { increment: 1 },
      },
    });
  }

  // Tier 2 報酬（親パートナーへ）
  if (partner.parentPartner && partner.parentPartner.tier2CommissionRate > 0) {
    const tier2Amount = Math.floor(
      (tier1Amount * partner.parentPartner.tier2CommissionRate) / 100
    );

    if (tier2Amount > 0) {
      await prisma.affiliateCommission.create({
        data: {
          tenantId: input.tenantId,
          partnerId: partner.parentPartner.id,
          conversionId: conversion.id,
          type: AffiliateCommissionTypeName.TIER2,
          amount: tier2Amount,
          rate: partner.parentPartner.tier2CommissionRate,
          baseAmount: tier1Amount,
          tier: 2,
          sourcePartnerId: partner.id,
          status: AffiliateCommissionStatus.PENDING,
          payableAt,
        },
      });

      commissions.push({
        partnerId: partner.parentPartner.id,
        amount: tier2Amount,
        tier: 2,
      });

      await prisma.partner.update({
        where: { id: partner.parentPartner.id },
        data: {
          totalEarnings: { increment: tier2Amount },
          unpaidEarnings: { increment: tier2Amount },
        },
      });
    }
  }

  // 注文にコンバージョンを紐付け
  await prisma.order.update({
    where: { id: input.orderId },
    data: { affiliateConversionId: conversion.id },
  });

  return {
    success: true,
    conversionId: conversion.id,
    commissions,
  };
}

// ==================== ユーティリティ関数 ====================

function detectDeviceType(userAgent?: string): string | null {
  if (!userAgent) return null;

  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) {
      return "tablet";
    }
    return "mobile";
  }
  return "desktop";
}

/**
 * アフィリエイトコードを生成
 */
export function generateAffiliateCode(prefix: string = "AF"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = prefix;
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * アフィリエイトリンクコードを生成
 */
export function generateLinkCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
