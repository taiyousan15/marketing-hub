"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownProps {
  startAt: string;
  title?: string;
  description?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(startAt: string): TimeLeft | null {
  const diff = new Date(startAt).getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function Countdown({ startAt, title, description }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calcTimeLeft(startAt)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft(startAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [startAt]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      <div className="text-center max-w-lg px-6">
        <Clock className="h-16 w-16 mx-auto mb-6 text-blue-400" />

        {title && (
          <h1 className="text-2xl font-bold mb-3 dark:text-white">{title}</h1>
        )}

        {timeLeft === null ? (
          <p className="text-lg text-blue-300 animate-pulse">
            まもなく開始します...
          </p>
        ) : (
          <>
            <p className="text-gray-400 mb-8">配信開始まで</p>
            <div className="flex items-center justify-center gap-4">
              <TimeUnit value={timeLeft.days} label="日" />
              <Separator />
              <TimeUnit value={timeLeft.hours} label="時間" />
              <Separator />
              <TimeUnit value={timeLeft.minutes} label="分" />
              <Separator />
              <TimeUnit value={timeLeft.seconds} label="秒" />
            </div>
            <p className="text-gray-500 mt-8 text-sm">
              開始予定:{" "}
              {new Date(startAt).toLocaleString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </>
        )}

        {description && (
          <p className="text-gray-500 mt-6 text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[64px]">
      <span className="text-4xl font-mono font-bold tabular-nums text-white">
        {pad(value)}
      </span>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
    </div>
  );
}

function Separator() {
  return <span className="text-3xl font-bold text-gray-600 pb-4">:</span>;
}
