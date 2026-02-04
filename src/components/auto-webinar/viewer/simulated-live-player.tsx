"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { generateEmbedUrl, calculateSyncCorrection } from "@/lib/auto-webinar/playback";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

interface SimulatedLivePlayerProps {
  videoUrl: string;
  videoType: "YOUTUBE" | "VIMEO" | "UPLOAD";
  videoDuration: number;
  currentPosition: number;
  isLive: boolean;
  isReplay: boolean;
  onPositionUpdate: (position: number) => void;
  className?: string;
}

export function SimulatedLivePlayer({
  videoUrl,
  videoType,
  videoDuration,
  currentPosition,
  isLive,
  isReplay,
  onPositionUpdate,
  className = "",
}: SimulatedLivePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [localPosition, setLocalPosition] = useState(currentPosition);
  const [isMuted, setIsMuted] = useState(true);  // 自動再生のためデフォルトはミュート
  const [isPlaying, setIsPlaying] = useState(true);

  // 埋め込みURLを生成
  const embedUrl = generateEmbedUrl(videoUrl, videoType, {
    autoplay: true,
    controls: isReplay,  // リプレイ時のみコントロール表示
    startTime: currentPosition,
  });

  // サーバー位置との同期チェック
  useEffect(() => {
    const correction = calculateSyncCorrection(localPosition, currentPosition, 3);

    if (correction.needsCorrection && isLive && !isReplay) {
      // ライブ時で2秒以上のずれがある場合は位置を補正
      setLocalPosition(currentPosition);
      // iframeに位置更新を通知（YouTube APIを使用する場合）
      // ここではシンプルにページリロードで対応
    }
  }, [currentPosition, localPosition, isLive, isReplay]);

  // 定期的な位置更新
  useEffect(() => {
    if (!isLive && !isReplay) return;

    const interval = setInterval(() => {
      setLocalPosition((prev) => {
        const newPosition = Math.min(prev + 1, videoDuration);
        onPositionUpdate(newPosition);
        return newPosition;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, isReplay, videoDuration, onPositionUpdate]);

  // プログレスバーの計算
  const progressPercent = (localPosition / videoDuration) * 100;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* 動画埋め込み */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* オーバーレイコントロール（ライブ時はシーク不可） */}
      {isLive && !isReplay && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* プログレスバー（表示のみ） */}
          <div className="w-full h-1 bg-white/30 rounded-full mb-3">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center gap-4">
              {/* LIVE バッジ */}
              <div className="flex items-center gap-2 bg-red-600 px-2 py-0.5 rounded">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="font-medium">LIVE</span>
              </div>

              <span className="text-white/70">
                {formatTime(localPosition)} / {formatTime(videoDuration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* リプレイ時のコントロールはiframe内で処理 */}
      {isReplay && (
        <div className="absolute top-4 left-4">
          <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium">
            リプレイ視聴中
          </div>
        </div>
      )}
    </div>
  );
}
