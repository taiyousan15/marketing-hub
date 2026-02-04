"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import YouTube from "react-youtube";

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
 * ウェビナー視聴プレイヤー
 * YouTube、Vimeo、アップロード動画に対応
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
  const [isPlaying, setIsPlaying] = useState(!isLive || isReplay);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [localPosition, setLocalPosition] = useState(currentPosition);
  const playerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 再生位置の同期
  useEffect(() => {
    setLocalPosition(currentPosition);
  }, [currentPosition]);

  // 定期的な進捗更新
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (videoType === "YOUTUBE" && playerRef.current) {
        const time = playerRef.current.getCurrentTime();
        setLocalPosition(time);
        onPositionUpdate(time);
      } else if (videoRef.current) {
        const time = videoRef.current.currentTime;
        setLocalPosition(time);
        onPositionUpdate(time);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, videoType, onPositionUpdate]);

  const togglePlay = () => {
    if (videoType === "YOUTUBE" && playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (videoType === "YOUTUBE" && playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
    } else if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);

    if (videoType === "YOUTUBE" && playerRef.current) {
      playerRef.current.setVolume(newVolume);
    } else if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  };

  const handleSeek = (value: number[]) => {
    const newPosition = value[0];
    setLocalPosition(newPosition);

    if (videoType === "YOUTUBE" && playerRef.current) {
      playerRef.current.seekTo(newPosition, true);
    } else if (videoRef.current) {
      videoRef.current.currentTime = newPosition;
    }

    onPositionUpdate(newPosition);
  };

  const toggleFullscreen = () => {
    const container = document.getElementById("webinar-player-container");
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : "";
  };

  const extractVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : "";
  };

  const onYouTubeReady = (event: any) => {
    playerRef.current = event.target;
    if (isReplay && currentPosition > 0) {
      event.target.seekTo(currentPosition, true);
    }
    if (isPlaying) {
      event.target.playVideo();
    }
  };

  return (
    <Card className={`overflow-hidden bg-black ${className}`} id="webinar-player-container">
      {/* 動画コンテナ */}
      <div className="relative aspect-video bg-black">
        {videoType === "YOUTUBE" && (
          <YouTube
            videoId={extractYouTubeId(videoUrl)}
            opts={{
              width: "100%",
              height: "100%",
              playerVars: {
                autoplay: isPlaying ? 1 : 0,
                controls: 0,
                modestbranding: 1,
                rel: 0,
              },
            }}
            onReady={onYouTubeReady}
            className="absolute inset-0 w-full h-full"
          />
        )}

        {videoType === "VIMEO" && (
          <iframe
            src={`https://player.vimeo.com/video/${extractVimeoId(videoUrl)}?autoplay=${isPlaying ? 1 : 0}&controls=0`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        )}

        {videoType === "UPLOAD" && (
          <video
            ref={videoRef}
            src={videoUrl}
            className="absolute inset-0 w-full h-full"
            onTimeUpdate={(e) => {
              const time = e.currentTarget.currentTime;
              setLocalPosition(time);
            }}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        {/* ライブバッジ */}
        {isLive && !isReplay && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}

        {/* リプレイバッジ */}
        {isReplay && (
          <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            REPLAY
          </div>
        )}
      </div>

      {/* コントロールバー */}
      <div className="bg-slate-900 p-4 space-y-3">
        {/* 進捗バー */}
        <div className="space-y-1">
          <Slider
            value={[localPosition]}
            max={videoDuration}
            step={1}
            onValueChange={handleSeek}
            disabled={isLive && !isReplay}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{formatTime(localPosition)}</span>
            <span>{formatTime(videoDuration)}</span>
          </div>
        </div>

        {/* 再生コントロール */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 再生/一時停止 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:bg-slate-800"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            {/* 音量コントロール */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-slate-800"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
          </div>

          {/* フルスクリーン */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-white hover:bg-slate-800"
          >
            <Maximize className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
