'use client';

// Stub component - interactive video functionality not yet implemented
interface HotspotComponentProps {
  hotspot: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    action: string;
    triggerTime: number;
    hideTime?: number;
  };
  onClick: () => void;
}

export function HotspotComponent({ hotspot, onClick }: HotspotComponentProps) {
  return null;
}
