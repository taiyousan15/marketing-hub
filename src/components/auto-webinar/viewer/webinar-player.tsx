"use client";

import { Card } from "@/components/ui/card";

interface WebinarPlayerProps {
  videoUrl: string;
  videoType: "YOUTUBE" | "VIMEO" | "UPLOAD";
  videoDuration: number;
  currentPosition: number;
  isLive: boolean;
  isReplay: boolean;
  onPositionUpdate: (position: number) => void;
  className?: string;
}

/**
 * ウェビナー視聴プレイヤー - Not implemented
 */
export function WebinarPlayer({
  videoUrl,
  videoType,
  videoDuration,
  currentPosition,
  isLive,
  isReplay,
  onPositionUpdate,
  className = "",
}: WebinarPlayerProps) {
  return (
    <Card className={`w-full bg-black flex items-center justify-center ${className}`}>
      <div className="text-white p-8 text-center">
        <p>Webinar player is not implemented</p>
      </div>
    </Card>
  );
}
