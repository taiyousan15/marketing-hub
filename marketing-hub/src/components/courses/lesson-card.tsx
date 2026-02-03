"use client";

import { MemberRank } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { RankBadge } from "./rank-badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  PlayCircle,
  Lock,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

interface LessonCardProps {
  lesson: {
    id: string;
    name: string;
    description?: string | null;
    order: number;
    duration?: number | null;
    requiredRank: MemberRank;
    isSequentialStart?: boolean;
    requireCompletion?: boolean;
  };
  canAccess: boolean;
  isCompleted: boolean;
  progress?: {
    watchedSeconds: number;
  } | null;
  accessDeniedMessage?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function LessonCard({
  lesson,
  canAccess,
  isCompleted,
  progress,
  accessDeniedMessage,
  onClick,
  isActive,
}: LessonCardProps) {
  // 視聴進捗を計算
  const progressPercent =
    progress && lesson.duration
      ? Math.min((progress.watchedSeconds / lesson.duration) * 100, 100)
      : 0;

  // 時間をフォーマット
  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isActive && "ring-2 ring-primary",
        !canAccess && "opacity-70",
        isCompleted && "border-green-200 bg-green-50/50"
      )}
      onClick={canAccess ? onClick : undefined}
    >
      <CardContent className="flex items-center gap-4 p-4">
        {/* 順番・状態アイコン */}
        <div className="flex-shrink-0">
          {isCompleted ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          ) : canAccess ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <PlayCircle className="h-5 w-5 text-primary" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {lesson.order + 1}.
            </span>
            <h4 className="font-medium truncate">{lesson.name}</h4>
            {lesson.requireCompletion && (
              <span className="text-xs text-orange-600" title="順次視聴">
                <ArrowRight className="h-3 w-3" />
              </span>
            )}
          </div>

          {lesson.description && (
            <p className="text-sm text-muted-foreground truncate mt-1">
              {lesson.description}
            </p>
          )}

          {/* 進捗バー（視聴中の場合） */}
          {canAccess && !isCompleted && progressPercent > 0 && (
            <div className="mt-2">
              <Progress value={progressPercent} className="h-1" />
            </div>
          )}

          {/* ロック理由 */}
          {!canAccess && accessDeniedMessage && (
            <p className="text-xs text-orange-600 mt-1">{accessDeniedMessage}</p>
          )}
        </div>

        {/* 右側情報 */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <RankBadge rank={lesson.requiredRank} size="sm" />
          {lesson.duration && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(lesson.duration)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
