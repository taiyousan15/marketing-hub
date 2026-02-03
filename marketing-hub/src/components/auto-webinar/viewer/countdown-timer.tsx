"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetTime: Date;
  onComplete?: () => void;
  className?: string;
}

export function CountdownTimer({
  targetTime,
  onComplete,
  className = "",
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date();
    const diff = targetTime.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      total: diff,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime, onComplete]);

  if (timeLeft.total <= 0) {
    return null;
  }

  const TimeBlock = ({
    value,
    label,
  }: {
    value: number;
    label: string;
  }) => (
    <div className="flex flex-col items-center">
      <div className="bg-black/50 text-white text-3xl md:text-5xl font-mono font-bold px-4 py-2 rounded-lg min-w-[80px] text-center">
        {value.toString().padStart(2, "0")}
      </div>
      <span className="text-xs text-white/70 mt-1">{label}</span>
    </div>
  );

  return (
    <div className={`text-center ${className}`}>
      <div className="flex items-center justify-center gap-1 text-white/80 mb-4">
        <Clock className="w-5 h-5" />
        <span className="text-lg">ウェビナー開始まで</span>
      </div>

      <div className="flex items-center justify-center gap-4">
        {timeLeft.days > 0 && (
          <>
            <TimeBlock value={timeLeft.days} label="日" />
            <span className="text-white text-3xl font-bold">:</span>
          </>
        )}
        <TimeBlock value={timeLeft.hours} label="時間" />
        <span className="text-white text-3xl font-bold">:</span>
        <TimeBlock value={timeLeft.minutes} label="分" />
        <span className="text-white text-3xl font-bold">:</span>
        <TimeBlock value={timeLeft.seconds} label="秒" />
      </div>

      <p className="text-white/60 text-sm mt-4">
        開始時刻: {targetTime.toLocaleString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}

/**
 * オファー用の小さいカウントダウン
 */
export function OfferCountdown({
  seconds,
  onComplete,
}: {
  seconds: number;
  onComplete?: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining, onComplete]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="flex items-center gap-2 text-destructive font-mono font-bold">
      <Clock className="w-4 h-4 animate-pulse" />
      <span>
        残り {minutes}:{secs.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
