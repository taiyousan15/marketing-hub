'use client';

import { type CTAConfig } from '@/lib/interactive-video/state-machine';
import { ArrowRight } from 'lucide-react';

interface CTAOverlayProps {
  cta: CTAConfig;
  onClick: () => void;
}

export function CTAOverlay({ cta, onClick }: CTAOverlayProps) {
  const isPrimary = cta.variant === 'primary';

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom duration-500">
      <button
        onClick={onClick}
        className={`
          group px-8 py-4 rounded-full font-bold text-lg shadow-2xl
          transition-all duration-200 hover:scale-105 active:scale-95
          flex items-center gap-3
          ${
            isPrimary
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }
        `}
      >
        <span>{cta.text}</span>
        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />

        {/* Glow Effect */}
        <div
          className={`
          absolute inset-0 rounded-full blur-xl opacity-50 -z-10
          ${isPrimary ? 'bg-orange-500' : 'bg-gray-400'}
        `}
        />
      </button>

      {/* Urgency Indicator (optional) */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-yellow-400 text-black text-sm font-semibold rounded-full shadow-lg animate-bounce">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          期間限定オファー
        </div>
      </div>
    </div>
  );
}
