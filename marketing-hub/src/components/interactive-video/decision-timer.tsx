'use client';

import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';

interface DecisionTimerProps {
  duration: number; // seconds
  onExpire: () => void;
}

export function DecisionTimer({ duration, onExpire }: DecisionTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onExpire]);

  const progress = (timeLeft / duration) * 100;
  const isUrgent = timeLeft <= 5;

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 animate-in slide-in-from-top duration-300">
      <div
        className={`
        px-6 py-3 rounded-full backdrop-blur-md shadow-lg
        transition-all duration-300
        ${
          isUrgent
            ? 'bg-red-500/90 animate-pulse'
            : 'bg-black/70'
        }
      `}
      >
        <div className="flex items-center gap-3">
          <Timer
            className={`
            w-5 h-5 text-white
            ${isUrgent ? 'animate-bounce' : ''}
          `}
          />

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-300 font-medium">
              自動的に進みます
            </span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`
                    h-full transition-all duration-1000 ease-linear
                    ${isUrgent ? 'bg-red-400' : 'bg-blue-400'}
                  `}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span
                className={`
                text-sm font-bold tabular-nums min-w-[2ch]
                ${isUrgent ? 'text-white' : 'text-gray-200'}
              `}
              >
                {timeLeft}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
