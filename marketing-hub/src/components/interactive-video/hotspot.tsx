'use client';

import { type Hotspot } from '@/lib/interactive-video/state-machine';
import { MousePointer2 } from 'lucide-react';

interface HotspotComponentProps {
  hotspot: Hotspot;
  onClick: () => void;
}

export function HotspotComponent({ hotspot, onClick }: HotspotComponentProps) {
  return (
    <button
      onClick={onClick}
      className="absolute group cursor-pointer z-20 animate-in fade-in zoom-in duration-300"
      style={{
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        width: `${hotspot.width}%`,
        height: `${hotspot.height}%`,
      }}
      aria-label={hotspot.label}
    >
      {/* Clickable Area with Pulse Animation */}
      <div className="relative w-full h-full">
        {/* Pulse Rings */}
        <div className="absolute inset-0 rounded-lg bg-blue-500/30 animate-pulse" />
        <div className="absolute inset-0 rounded-lg bg-blue-500/20 animate-ping" />

        {/* Hotspot Content */}
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-blue-400 bg-blue-500/10 backdrop-blur-sm transition-all group-hover:bg-blue-500/30 group-hover:border-blue-300 group-hover:scale-110">
          {/* Icon */}
          <MousePointer2 className="w-6 h-6 text-white drop-shadow-lg animate-bounce" />
        </div>

        {/* Label Tooltip */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/90 text-white text-sm font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {hotspot.label}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45" />
        </div>
      </div>

      {/* Corner Indicators */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400 rounded-tl" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-400 rounded-tr" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-400 rounded-bl" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400 rounded-br" />
    </button>
  );
}
