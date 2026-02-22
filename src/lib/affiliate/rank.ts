/**
 * アフィリエイト ランク自動昇格ロジック
 */

import { prisma } from "@/lib/db/prisma";

const RANK_TIERS = [
  { label: "STANDARD", minConversions: 0, rate: 10 },
  { label: "SILVER", minConversions: 10, rate: 12 },
  { label: "GOLD", minConversions: 30, rate: 15 },
  { label: "PLATINUM", minConversions: 100, rate: 18 },
  { label: "VIP", minConversions: 300, rate: 20 },
] as const;

/**
 * パートナーの成約数を確認し、必要であればランク（commissionRate）を自動昇格する
 */
export async function checkAndUpgradeRank(partnerId: string): Promise<void> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    include: {
      _count: { select: { affiliateConversions: true } },
    },
  });

  if (!partner) return;

  const conversionCount = partner._count.affiliateConversions;

  const newTier = [...RANK_TIERS]
    .reverse()
    .find((t) => conversionCount >= t.minConversions);

  if (newTier && newTier.rate > partner.commissionRate) {
    await prisma.partner.update({
      where: { id: partnerId },
      data: { commissionRate: newTier.rate },
    });
  }
}

/**
 * commissionRate からランクラベルを返す
 */
export function getRankLabel(rate: number): string {
  const tier = [...RANK_TIERS].reverse().find((t) => rate >= t.rate);
  return tier?.label ?? "STANDARD";
}

/**
 * 成約数から現在のランクラベルを返す
 */
export function getRankLabelByConversions(conversions: number): string {
  const tier = [...RANK_TIERS]
    .reverse()
    .find((t) => conversions >= t.minConversions);
  return tier?.label ?? "STANDARD";
}
