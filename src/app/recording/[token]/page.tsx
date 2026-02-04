"use client";

import { useState, useEffect, useRef, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  FileText,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface RecordingData {
  recording: {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    fileUrl: string | null;
    duration: number | null;
    allowDownload: boolean;
  };
  transcription: {
    status: string;
    fullText: string | null;
    segments: Array<{ start: number; end: number; text: string; speaker?: string }> | null;
    summary: string | null;
    keyPoints: string[] | null;
  } | null;
  watchProgress: number;
  expiresAt: string | null;
}

export default function RecordingViewerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecordingData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchRecording();

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [token]);

  const fetchRecording = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/recording-access/${token}`);

      if (!res.ok) {
        if (res.status === 404) {
          setError("録画が見つかりません");
        } else if (res.status === 410) {
          setError("この録画の視聴期限が切れています");
        } else {
          setError("録画の読み込みに失敗しました");
        }
        return;
      }

      const recordingData = await res.json();
      setData(recordingData);

      // 以前の視聴位置から再開
      if (recordingData.watchProgress > 0 && videoRef.current) {
        videoRef.current.currentTime = recordingData.watchProgress;
      }
    } catch (err) {
      setError("録画の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleDownload = () => {
    if (!data?.recording.fileUrl) return;
    window.open(data.recording.fileUrl, "_blank");
  };

  const updateWatchProgress = async (watchedUntil: number) => {
    try {
      await fetch(`/api/recording-access/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchedUntil }),
      });
    } catch (err) {
      console.error("Failed to update watch progress:", err);
    }
  };

  // 視聴進捗を定期的に保存
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        if (videoRef.current) {
          updateWatchProgress(Math.floor(videoRef.current.currentTime));
        }
      }, 10000); // 10秒ごと
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        // 停止時に最終位置を保存
        if (videoRef.current) {
          updateWatchProgress(Math.floor(videoRef.current.currentTime));
        }
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, token]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // セグメントをクリックしてその位置にジャンプ
  const jumpToSegment = (startTime: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = startTime;
    setCurrentTime(startTime);
    if (!isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">エラー</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { recording, transcription, expiresAt } = data;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* ヘッダー */}
      <header className="bg-black/50 p-4">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold text-white">{recording.title}</h1>
          {expiresAt && (
            <p className="text-sm text-gray-400 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              視聴期限: {new Date(expiresAt).toLocaleString("ja-JP")}
            </p>
          )}
        </div>
      </header>

      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 動画プレイヤー */}
          <div className="lg:col-span-2">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={recording.fileUrl || undefined}
                className="w-full aspect-video"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                poster={recording.thumbnail || undefined}
              />

              {/* カスタムコントロール */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {/* プログレスバー */}
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 mb-3 cursor-pointer"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={handlePlayPause}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={handleMuteToggle}
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </Button>

                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {recording.allowDownload && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={handleDownload}
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={handleFullscreen}
                    >
                      <Maximize className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 説明 */}
            {recording.description && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {recording.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* サイドバー（文字起こし） */}
          <div className="lg:col-span-1">
            {transcription && transcription.status === "COMPLETED" ? (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5" />
                    文字起こし
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="transcript">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="transcript">全文</TabsTrigger>
                      <TabsTrigger value="summary">要約</TabsTrigger>
                    </TabsList>

                    <TabsContent value="transcript" className="mt-4">
                      <div className="max-h-[60vh] overflow-y-auto space-y-2">
                        {transcription.segments ? (
                          transcription.segments.map((segment, index) => (
                            <div
                              key={index}
                              className={`p-2 rounded cursor-pointer hover:bg-muted transition-colors ${
                                currentTime >= segment.start &&
                                currentTime < segment.end
                                  ? "bg-primary/10 border-l-2 border-primary"
                                  : ""
                              }`}
                              onClick={() => jumpToSegment(segment.start)}
                            >
                              <span className="text-xs text-muted-foreground">
                                {formatTime(segment.start)}
                              </span>
                              {segment.speaker && (
                                <span className="text-xs font-medium ml-2">
                                  {segment.speaker}
                                </span>
                              )}
                              <p className="text-sm mt-1">{segment.text}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {transcription.fullText}
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="summary" className="mt-4">
                      {transcription.summary && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">概要</h4>
                          <p className="text-sm text-muted-foreground">
                            {transcription.summary}
                          </p>
                        </div>
                      )}

                      {transcription.keyPoints &&
                        transcription.keyPoints.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">要点</h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {transcription.keyPoints.map((point, i) => (
                                <li key={i}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : transcription && transcription.status === "PROCESSING" ? (
              <Card className="h-full">
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p>文字起こしを生成中...</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-4 opacity-50" />
                  <p>文字起こしはありません</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
