"use client";

import { useState } from "react";
import { MemberRank } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RankBadge } from "./rank-badge";
import { cn } from "@/lib/utils";
import {
  GripVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ArrowRight,
  Clock,
  Plus,
} from "lucide-react";

interface Lesson {
  id: string;
  name: string;
  description: string | null;
  order: number;
  duration: number | null;
  isPublished: boolean;
  requiredRank: MemberRank;
  isSequentialStart: boolean;
  requireCompletion: boolean;
}

interface LessonListProps {
  lessons: Lesson[];
  onReorder?: (lessonId: string, newOrder: number) => Promise<void>;
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => Promise<void>;
  onTogglePublish?: (lessonId: string, isPublished: boolean) => Promise<void>;
  onAdd?: () => void;
}

export function LessonList({
  lessons,
  onReorder,
  onEdit,
  onDelete,
  onTogglePublish,
  onAdd,
}: LessonListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);

  const handleDragStart = (e: React.DragEvent, lessonId: string) => {
    setDraggedId(lessonId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId || !onReorder) return;

    const targetLesson = sortedLessons.find((l) => l.id === targetId);
    if (!targetLesson) return;

    setIsLoading(draggedId);
    try {
      await onReorder(draggedId, targetLesson.order);
    } finally {
      setIsLoading(null);
      setDraggedId(null);
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!onDelete) return;
    if (!confirm("このレッスンを削除してもよろしいですか？")) return;

    setIsLoading(lessonId);
    try {
      await onDelete(lessonId);
    } finally {
      setIsLoading(null);
    }
  };

  const handleTogglePublish = async (lesson: Lesson) => {
    if (!onTogglePublish) return;

    setIsLoading(lesson.id);
    try {
      await onTogglePublish(lesson.id, !lesson.isPublished);
    } finally {
      setIsLoading(null);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">レッスン一覧</CardTitle>
        {onAdd && (
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            追加
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {sortedLessons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            レッスンがありません
          </div>
        ) : (
          <div className="space-y-2">
            {sortedLessons.map((lesson, index) => (
              <div
                key={lesson.id}
                draggable={!!onReorder}
                onDragStart={(e) => handleDragStart(e, lesson.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, lesson.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all",
                  draggedId === lesson.id && "opacity-50",
                  !lesson.isPublished && "opacity-60 bg-muted/50",
                  isLoading === lesson.id && "pointer-events-none"
                )}
              >
                {/* ドラッグハンドル */}
                {onReorder && (
                  <div className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                {/* 順番 */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">{index + 1}</span>
                </div>

                {/* コンテンツ */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{lesson.name}</span>
                    {lesson.requireCompletion && (
                      <span
                        className="text-orange-500"
                        title="順次視聴：完了必須"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                    {lesson.isSequentialStart && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                        順次開始
                      </span>
                    )}
                    {!lesson.isPublished && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        非公開
                      </span>
                    )}
                  </div>
                  {lesson.description && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {lesson.description}
                    </p>
                  )}
                </div>

                {/* ランク */}
                <RankBadge rank={lesson.requiredRank} size="sm" />

                {/* 時間 */}
                {lesson.duration && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDuration(lesson.duration)}
                  </div>
                )}

                {/* アクション */}
                <div className="flex items-center gap-1">
                  {onTogglePublish && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTogglePublish(lesson)}
                      disabled={isLoading === lesson.id}
                      title={lesson.isPublished ? "非公開にする" : "公開する"}
                    >
                      {lesson.isPublished ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(lesson.id)}
                      disabled={isLoading === lesson.id}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(lesson.id)}
                      disabled={isLoading === lesson.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
