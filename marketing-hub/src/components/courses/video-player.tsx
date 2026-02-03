"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { VideoType } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Play, Pause, RotateCcw } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  videoType: VideoType;
  duration?: number | null;
  completionThreshold?: number;
  initialWatchedSeconds?: number;
  onProgress?: (watchedSeconds: number) => void;
  onComplete?: () => void;
}

export function VideoPlayer({
  videoUrl,
  videoType,
  duration,
  completionThreshold = 80,
  initialWatchedSeconds = 0,
  onProgress,
  onComplete,
}: VideoPlayerProps) {
  const [watchedSeconds, setWatchedSeconds] = useState(initialWatchedSeconds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastReportedRef = useRef(initialWatchedSeconds);

  // 進捗率を計算
  const progressPercent = duration
    ? Math.min((watchedSeconds / duration) * 100, 100)
    : 0;

  // 完了判定
  const checkCompletion = useCallback(
    (seconds: number) => {
      if (!duration || isComplete) return;
      const percent = (seconds / duration) * 100;
      if (percent >= completionThreshold) {
        setIsComplete(true);
        onComplete?.();
      }
    },
    [duration, completionThreshold, isComplete, onComplete]
  );

  // 進捗を報告（5秒ごと）
  const reportProgress = useCallback(
    (seconds: number) => {
      if (Math.floor(seconds / 5) !== Math.floor(lastReportedRef.current / 5)) {
        lastReportedRef.current = seconds;
        onProgress?.(seconds);
      }
    },
    [onProgress]
  );

  // 動画の時間更新時
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const currentTime = Math.floor(videoRef.current.currentTime);

    // 最大視聴時間を更新（巻き戻しは無視）
    if (currentTime > watchedSeconds) {
      setWatchedSeconds(currentTime);
      checkCompletion(currentTime);
      reportProgress(currentTime);
    }
  }, [watchedSeconds, checkCompletion, reportProgress]);

  // 再生/停止
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  // 最初から再生
  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
  };

  // YouTube埋め込みURL生成
  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/
    );
    const videoId = match ? match[1] : url;
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`;
  };

  // Vimeo埋め込みURL生成
  const getVimeoEmbedUrl = (url: string) => {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    const videoId = match ? match[1] : url;
    return `https://player.vimeo.com/video/${videoId}`;
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // YouTube/Vimeoの場合は埋め込み
  if (videoType === "YOUTUBE" || videoType === "VIMEO") {
    const embedUrl =
      videoType === "YOUTUBE"
        ? getYouTubeEmbedUrl(videoUrl)
        : getVimeoEmbedUrl(videoUrl);

    return (
      <Card className="overflow-hidden">
        <div className="aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {duration && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">視聴進捗</span>
              <div className="flex items-center gap-2">
                {isComplete && (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    完了
                  </span>
                )}
                <span className="text-sm font-medium">
                  {Math.round(progressPercent)}%
                </span>
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              ※ YouTube/Vimeoの場合、視聴進捗は手動で「完了」を押してください
            </p>
            {!isComplete && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setIsComplete(true);
                  onComplete?.();
                }}
              >
                視聴完了としてマーク
              </Button>
            )}
          </div>
        )}
      </Card>
    );
  }

  // アップロード動画の場合
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-black relative">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            if (duration) {
              setWatchedSeconds(duration);
              checkCompletion(duration);
              onProgress?.(duration);
            }
          }}
        />
        {!isPlaying && (
          <button
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
            onClick={handlePlayPause}
          >
            <Play className="h-16 w-16 text-white" />
          </button>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePlayPause}>
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {isComplete && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                完了
              </span>
            )}
            <span className="text-sm font-medium">
              {Math.round(progressPercent)}%
            </span>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
        {duration && (
          <p className="text-xs text-muted-foreground mt-2">
            {Math.floor(watchedSeconds / 60)}:
            {(watchedSeconds % 60).toString().padStart(2, "0")} /{" "}
            {Math.floor(duration / 60)}:
            {(duration % 60).toString().padStart(2, "0")}
          </p>
        )}
      </div>
    </Card>
  );
}
