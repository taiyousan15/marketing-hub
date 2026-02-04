"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VideoPlayer } from "@/components/courses/video-player";
import { RankBadge } from "@/components/courses/rank-badge";
import { MemberRank, VideoType } from "@prisma/client";

interface Lesson {
  id: string;
  name: string;
  description: string | null;
  content: unknown;
  videoUrl: string | null;
  videoType: VideoType | null;
  duration: number | null;
  order: number;
  requiredRank: MemberRank;
  completionThreshold: number;
  rankInfo: {
    label: string;
    color: string;
    icon: string;
  };
}

interface Navigation {
  prevLesson: { id: string; name: string } | null;
  nextLesson: {
    id: string;
    name: string;
    requiredRank: MemberRank;
    rankInfo: { label: string; icon: string };
  } | null;
  currentIndex: number;
  totalLessons: number;
}

interface LessonProgress {
  isCompleted: boolean;
  watchedSeconds: number;
}

export default function PublicLessonPage({
  params,
}: {
  params: Promise<{ shareCode: string; lessonId: string }>;
}) {
  const { shareCode, lessonId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactId = searchParams.get("contactId");

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [navigation, setNavigation] = useState<Navigation | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState<{
    reason: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchLesson();
  }, [shareCode, lessonId, contactId]);

  const fetchLesson = async () => {
    try {
      const url = contactId
        ? `/api/m/${shareCode}/${lessonId}?contactId=${contactId}`
        : `/api/m/${shareCode}/${lessonId}`;
      const res = await fetch(url);

      if (res.status === 403) {
        const data = await res.json();
        setAccessDenied({ reason: data.reason, message: data.message });
        return;
      }

      if (!res.ok) {
        setError("レッスンが見つかりません");
        return;
      }

      const data = await res.json();
      setLesson(data.lesson);
      setNavigation(data.navigation);
      setProgress(data.progress);
    } catch (err) {
      setError("レッスンの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgress = async (watchedSeconds: number) => {
    if (!contactId) return;

    try {
      // Note: 公開コースでは進捗保存APIを別途実装が必要
      // 今回は簡易的にコンソールログのみ
      console.log("Progress update:", { lessonId, watchedSeconds });
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  };

  const handleComplete = async () => {
    if (!contactId) return;

    try {
      // Note: 公開コースでは完了APIを別途実装が必要
      console.log("Lesson completed:", lessonId);
    } catch (err) {
      console.error("Failed to mark as complete:", err);
    }
  };

  const navigateTo = (targetLessonId: string) => {
    const url = contactId
      ? `/m/${shareCode}/${targetLessonId}?contactId=${contactId}`
      : `/m/${shareCode}/${targetLessonId}`;
    router.push(url);
  };

  const backToCourse = () => {
    const url = contactId
      ? `/m/${shareCode}?contactId=${contactId}`
      : `/m/${shareCode}`;
    router.push(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={backToCourse}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          コース一覧に戻る
        </Button>

        <Card className="max-w-lg mx-auto">
          <CardContent className="py-12 text-center">
            <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">アクセスできません</h2>
            <p className="text-muted-foreground">{accessDenied.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={backToCourse}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          コース一覧に戻る
        </Button>

        <Card className="max-w-lg mx-auto">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-bold mb-2">
              {error || "レッスンが見つかりません"}
            </h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ナビゲーション */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={backToCourse}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          コース一覧
        </Button>
        {navigation && (
          <span className="text-sm text-muted-foreground">
            {navigation.currentIndex + 1} / {navigation.totalLessons}
          </span>
        )}
      </div>

      {/* レッスンヘッダー */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{lesson.name}</h1>
          <RankBadge rank={lesson.requiredRank} size="sm" />
        </div>
        {lesson.description && (
          <p className="text-muted-foreground">{lesson.description}</p>
        )}
      </div>

      {/* 動画プレイヤー */}
      {lesson.videoUrl && lesson.videoType && (
        <VideoPlayer
          videoUrl={lesson.videoUrl}
          videoType={lesson.videoType}
          duration={lesson.duration}
          completionThreshold={lesson.completionThreshold}
          initialWatchedSeconds={progress?.watchedSeconds || 0}
          onProgress={handleProgress}
          onComplete={handleComplete}
        />
      )}

      {/* コンテンツ（動画がない場合やテキストコンテンツ） */}
      {!lesson.videoUrl && (
        <Card>
          <CardContent className="py-8">
            {typeof lesson.content === "object" && lesson.content !== null ? (
              <div className="prose max-w-none">
                {/* JSON形式のコンテンツを表示 */}
                <pre className="text-sm">
                  {JSON.stringify(lesson.content, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                コンテンツがありません
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 前後ナビゲーション */}
      {navigation && (
        <div className="flex items-center justify-between pt-6 border-t">
          {navigation.prevLesson ? (
            <Button
              variant="outline"
              onClick={() => navigateTo(navigation.prevLesson!.id)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              前へ: {navigation.prevLesson.name}
            </Button>
          ) : (
            <div />
          )}

          {navigation.nextLesson ? (
            <Button onClick={() => navigateTo(navigation.nextLesson!.id)}>
              次へ: {navigation.nextLesson.name}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" onClick={backToCourse}>
              コース一覧に戻る
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
