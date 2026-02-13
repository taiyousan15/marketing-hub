'use client';

// Stub component - interactive video functionality not yet implemented
interface SmartVSLPlayerProps {
  config: {
    segments: Record<string, any>;
    branches: Record<string, any[]>;
    hotspots?: Record<string, any[]>;
    ctas?: Record<string, any[]>;
  };
  autoPlay?: boolean;
  onStateChange?: (state: string) => void;
  onTrackingEvent?: (event: {
    type: string;
    timestamp: number;
    data: unknown;
  }) => void;
}

export function SmartVSLPlayer({
  config,
  autoPlay,
  onStateChange,
  onTrackingEvent,
}: SmartVSLPlayerProps) {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
      <p className="text-gray-400">Interactive video player not yet implemented</p>
    </div>
  );
}
