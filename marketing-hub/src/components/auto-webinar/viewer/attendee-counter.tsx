"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { calculateFakeAttendees, getNextAttendeeCount } from "@/lib/auto-webinar/attendees";

interface AttendeeCounterProps {
  min: number;
  max: number;
  progress: number;  // 0-1
  updateInterval?: number;  // ms
  className?: string;
}

export function AttendeeCounter({
  min,
  max,
  progress,
  updateInterval = 5000,
  className = "",
}: AttendeeCounterProps) {
  const [count, setCount] = useState(() =>
    calculateFakeAttendees(min, max, progress)
  );
  const [isIncreasing, setIsIncreasing] = useState(false);

  useEffect(() => {
    // 進捗に基づいて参加者数を更新
    const targetCount = calculateFakeAttendees(min, max, progress);

    // アニメーション用の状態更新
    setIsIncreasing(targetCount > count);

    // 急激な変化を避けるため、getNextAttendeeCountを使用
    setCount((prev) => getNextAttendeeCount(prev, min, max, progress));
  }, [progress, min, max]);

  // 定期的なランダム変動
  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        const variance = Math.floor((Math.random() - 0.5) * 4);  // ±2
        const newCount = Math.max(min, Math.min(max, prev + variance));
        setIsIncreasing(newCount > prev);
        return newCount;
      });
    }, updateInterval);

    return () => clearInterval(timer);
  }, [min, max, updateInterval]);

  return (
    <div
      className={`flex items-center gap-2 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm ${className}`}
    >
      <div className="relative">
        <Users className="w-4 h-4" />
        <span
          className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
            isIncreasing ? "bg-green-500" : "bg-red-500"
          } animate-pulse`}
        />
      </div>
      <span className="font-medium">{count.toLocaleString()}</span>
      <span className="text-white/70">人が視聴中</span>
    </div>
  );
}
