"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ParticipantCounterProps {
  min: number;
  max: number;
  progress: number; // 0-1 (動画の進捗率)
  className?: string;
}

/**
 * 参加者カウンター（シミュレーション）
 * 動画の進捗に応じて参加者数が増減するアニメーション
 */
export function ParticipantCounter({
  min,
  max,
  progress,
  className = "",
}: ParticipantCounterProps) {
  const [count, setCount] = useState(min);
  const [previousCount, setPreviousCount] = useState(min);
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable");

  // 参加者数の計算ロジック
  const calculateCount = (progress: number): number => {
    // 開始時: min + 初期増加（10-20%）
    // 中盤: ピーク到達（max付近）
    // 終盤: やや減少（max の 70-90%）

    if (progress < 0.1) {
      // 開始10%: min から min*1.2 まで急増
      return Math.floor(min + (max - min) * 0.2 * (progress / 0.1));
    } else if (progress < 0.5) {
      // 10-50%: 緩やかに増加してピークへ
      const baseCount = min + (max - min) * 0.2;
      const peakCount = max;
      const localProgress = (progress - 0.1) / 0.4;
      return Math.floor(baseCount + (peakCount - baseCount) * localProgress);
    } else if (progress < 0.8) {
      // 50-80%: ピーク維持（ランダムな小変動）
      const variance = Math.sin(Date.now() / 1000) * (max * 0.05);
      return Math.floor(max + variance);
    } else {
      // 80-100%: 緩やかに減少
      const localProgress = (progress - 0.8) / 0.2;
      const endCount = max * 0.75;
      return Math.floor(max - (max - endCount) * localProgress);
    }
  };

  // 参加者数の更新（5-10秒ごと）
  useEffect(() => {
    const updateInterval = 5000 + Math.random() * 5000; // 5-10秒のランダム間隔

    const timer = setTimeout(() => {
      const targetCount = calculateCount(progress);
      const variance = Math.floor((Math.random() - 0.5) * 10); // ±5人のランダム変動
      const newCount = Math.max(min, Math.min(max, targetCount + variance));

      setPreviousCount(count);
      setCount(newCount);

      // トレンドの判定
      if (newCount > count + 2) {
        setTrend("up");
      } else if (newCount < count - 2) {
        setTrend("down");
      } else {
        setTrend("stable");
      }
    }, updateInterval);

    return () => clearTimeout(timer);
  }, [count, progress, min, max]);

  // 変化量の計算
  const delta = count - previousCount;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-sm font-semibold transition-all duration-300",
        trend === "up" && "bg-green-500/10 text-green-600 border-green-500/20",
        trend === "down" && "bg-orange-500/10 text-orange-600 border-orange-500/20",
        className
      )}
    >
      <Users className="w-4 h-4" />
      <span className="tabular-nums">{count.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground">人が視聴中</span>

      {/* トレンドインジケーター */}
      {trend !== "stable" && (
        <div className="flex items-center gap-1 ml-1">
          {trend === "up" ? (
            <TrendingUp className="w-3 h-3 text-green-600" />
          ) : (
            <TrendingDown className="w-3 h-3 text-orange-600" />
          )}
          <span className="text-xs tabular-nums">
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        </div>
      )}
    </Badge>
  );
}

/**
 * シンプル版の参加者カウンター（トレンド非表示）
 */
export function SimpleParticipantCounter({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  return (
    <Badge variant="secondary" className={cn("flex items-center gap-2 px-3 py-1.5", className)}>
      <Users className="w-4 h-4" />
      <span className="text-sm font-semibold tabular-nums">
        {count.toLocaleString()}
      </span>
      <span className="text-xs text-muted-foreground">人</span>
    </Badge>
  );
}

/**
 * ライブドットインジケーター付き参加者カウンター
 */
export function LiveParticipantCounter({
  count,
  isLive = true,
  className = "",
}: {
  count: number;
  isLive?: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant={isLive ? "destructive" : "secondary"}
      className={cn("flex items-center gap-2 px-3 py-1.5", className)}
    >
      {isLive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
      )}
      <Users className="w-4 h-4" />
      <span className="text-sm font-semibold tabular-nums">
        {count.toLocaleString()}
      </span>
      <span className="text-xs">{isLive ? "LIVE" : "視聴中"}</span>
    </Badge>
  );
}
