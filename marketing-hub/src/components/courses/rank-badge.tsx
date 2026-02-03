"use client";

import { MemberRank } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ランク情報
const RANK_CONFIG: Record<
  MemberRank,
  {
    label: string;
    icon: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  BRONZE: {
    label: "ブロンズ",
    icon: "🟤",
    bgClass: "bg-amber-100",
    textClass: "text-amber-800",
    borderClass: "border-amber-300",
  },
  SILVER: {
    label: "シルバー",
    icon: "🥈",
    bgClass: "bg-gray-100",
    textClass: "text-gray-800",
    borderClass: "border-gray-300",
  },
  GOLD: {
    label: "ゴールド",
    icon: "🥇",
    bgClass: "bg-yellow-100",
    textClass: "text-yellow-800",
    borderClass: "border-yellow-400",
  },
  PLATINUM: {
    label: "プラチナ",
    icon: "💎",
    bgClass: "bg-purple-100",
    textClass: "text-purple-800",
    borderClass: "border-purple-400",
  },
};

interface RankBadgeProps {
  rank: MemberRank;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function RankBadge({
  rank,
  size = "md",
  showIcon = true,
  showLabel = true,
  className,
}: RankBadgeProps) {
  const config = RANK_CONFIG[rank];

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        config.bgClass,
        config.textClass,
        config.borderClass,
        sizeClasses[size],
        "font-medium",
        className
      )}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {showLabel && config.label}
    </Badge>
  );
}

// ランク選択用のドロップダウンオプション
export function getRankOptions(): {
  value: MemberRank;
  label: string;
  icon: string;
}[] {
  return (Object.keys(RANK_CONFIG) as MemberRank[]).map((rank) => ({
    value: rank,
    label: RANK_CONFIG[rank].label,
    icon: RANK_CONFIG[rank].icon,
  }));
}

// ランク表示名を取得
export function getRankLabel(rank: MemberRank): string {
  return RANK_CONFIG[rank].label;
}

// ランクアイコンを取得
export function getRankIcon(rank: MemberRank): string {
  return RANK_CONFIG[rank].icon;
}
