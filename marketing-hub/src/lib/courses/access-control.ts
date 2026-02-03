// src/lib/courses/access-control.ts

import { MemberRank, CourseAccessMode } from "@prisma/client";

// ランク階層レベル
export const RANK_LEVELS: Record<MemberRank, number> = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
};

// ランク表示情報
export const RANK_INFO: Record<
  MemberRank,
  { label: string; color: string; icon: string; bgColor: string }
> = {
  BRONZE: {
    label: "ブロンズ",
    color: "#CD7F32",
    icon: "🟤",
    bgColor: "bg-amber-100",
  },
  SILVER: {
    label: "シルバー",
    color: "#C0C0C0",
    icon: "🥈",
    bgColor: "bg-gray-100",
  },
  GOLD: {
    label: "ゴールド",
    color: "#FFD700",
    icon: "🥇",
    bgColor: "bg-yellow-100",
  },
  PLATINUM: {
    label: "プラチナ",
    color: "#E5E4E2",
    icon: "💎",
    bgColor: "bg-purple-100",
  },
};

// ランクでアクセス可能かどうかを判定
export function canAccessByRank(
  userRank: MemberRank,
  requiredRank: MemberRank
): boolean {
  return RANK_LEVELS[userRank] >= RANK_LEVELS[requiredRank];
}

// ランクの順序を取得
export function getRankLevel(rank: MemberRank): number {
  return RANK_LEVELS[rank];
}

// ランク一覧を取得（昇順）
export function getAllRanks(): MemberRank[] {
  return ["BRONZE", "SILVER", "GOLD", "PLATINUM"] as MemberRank[];
}

// アクセス拒否理由
export type AccessDeniedReason =
  | "RANK_INSUFFICIENT"
  | "PREVIOUS_NOT_COMPLETED"
  | "NOT_ENROLLED"
  | "COURSE_NOT_PUBLISHED"
  | "LESSON_NOT_PUBLISHED"
  | "ENROLLMENT_EXPIRED";

// アクセスチェック結果
export type AccessCheckResult =
  | { allowed: true }
  | { allowed: false; reason: AccessDeniedReason; message: string };

// レッスン型
export interface LessonForAccess {
  id: string;
  order: number;
  isPublished: boolean;
  requiredRank: MemberRank;
  requireCompletion: boolean;
  completionThreshold: number;
  isSequentialStart: boolean;
}

// 進捗型
export interface ProgressForAccess {
  lessonId: string;
  isCompleted: boolean;
  watchedSeconds: number;
}

// コース型
export interface CourseForAccess {
  id: string;
  isPublished: boolean;
  accessMode: CourseAccessMode;
  isPublicCourse: boolean;
}

// 受講情報型
export interface EnrollmentForAccess {
  memberRank: MemberRank;
  expiresAt: Date | null;
}

// 完了判定
export function isLessonComplete(
  progress: ProgressForAccess | null | undefined,
  lesson: { duration?: number | null; completionThreshold: number }
): boolean {
  if (!progress) return false;
  if (progress.isCompleted) return true;

  // 動画がない場合は視聴秒数に関係なく未完了
  if (!lesson.duration || lesson.duration <= 0) return false;

  const percent = (progress.watchedSeconds / lesson.duration) * 100;
  return percent >= lesson.completionThreshold;
}

// 順次視聴の開始レッスンを見つける
export function findSequentialStartIndex(lessons: LessonForAccess[]): number {
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
  const startIndex = sortedLessons.findIndex((l) => l.isSequentialStart);
  return startIndex >= 0 ? startIndex : 0;
}

// レッスンへのアクセス可否をチェック
export function checkLessonAccess(
  lesson: LessonForAccess & { duration?: number | null },
  course: CourseForAccess,
  enrollment: EnrollmentForAccess | null,
  allLessons: (LessonForAccess & { duration?: number | null })[],
  progressMap: Map<string, ProgressForAccess>
): AccessCheckResult {
  // 1. コースが公開されているか
  if (!course.isPublished && !course.isPublicCourse) {
    return {
      allowed: false,
      reason: "COURSE_NOT_PUBLISHED",
      message: "このコースはまだ公開されていません",
    };
  }

  // 2. レッスンが公開されているか
  if (!lesson.isPublished) {
    return {
      allowed: false,
      reason: "LESSON_NOT_PUBLISHED",
      message: "このレッスンはまだ公開されていません",
    };
  }

  // 3. 公開コースの場合、受講登録不要
  if (course.isPublicCourse) {
    // 公開コースでもランク制限がある場合
    if (course.accessMode === "RANK_BASED" && enrollment) {
      if (!canAccessByRank(enrollment.memberRank, lesson.requiredRank)) {
        return {
          allowed: false,
          reason: "RANK_INSUFFICIENT",
          message: `このレッスンは${RANK_INFO[lesson.requiredRank].label}以上の方が視聴できます`,
        };
      }
    }
    // 順次視聴チェックは公開コースでも適用
  } else {
    // 非公開コースの場合、受講登録必須
    if (!enrollment) {
      return {
        allowed: false,
        reason: "NOT_ENROLLED",
        message: "このコースに登録されていません",
      };
    }

    // 4. 受講期限チェック
    if (enrollment.expiresAt && enrollment.expiresAt < new Date()) {
      return {
        allowed: false,
        reason: "ENROLLMENT_EXPIRED",
        message: "受講期限が切れています",
      };
    }

    // 5. ランクチェック（RANK_BASEDモードの場合のみ）
    if (course.accessMode === "RANK_BASED") {
      if (!canAccessByRank(enrollment.memberRank, lesson.requiredRank)) {
        return {
          allowed: false,
          reason: "RANK_INSUFFICIENT",
          message: `このレッスンは${RANK_INFO[lesson.requiredRank].label}以上の方が視聴できます`,
        };
      }
    }
  }

  // 6. 順次視聴チェック
  const sortedLessons = [...allLessons].sort((a, b) => a.order - b.order);
  const lessonIndex = sortedLessons.findIndex((l) => l.id === lesson.id);

  if (lessonIndex > 0) {
    // 順次視聴開始点を見つける
    const sequentialStartIndex = findSequentialStartIndex(sortedLessons);

    // 順次視聴開始点以降のレッスンの場合
    if (lessonIndex > sequentialStartIndex) {
      // 直前のレッスンを取得
      const prevLesson = sortedLessons[lessonIndex - 1];

      // 直前のレッスンが完了必須で、かつ順次視聴開始点以降の場合
      if (
        prevLesson.requireCompletion &&
        lessonIndex - 1 >= sequentialStartIndex
      ) {
        const prevProgress = progressMap.get(prevLesson.id);
        if (!isLessonComplete(prevProgress, prevLesson)) {
          return {
            allowed: false,
            reason: "PREVIOUS_NOT_COMPLETED",
            message:
              "前のレッスンを完了してから視聴してください",
          };
        }
      }
    }
  }

  return { allowed: true };
}

// レッスン一覧にアクセス情報を付与
export function getLessonsWithAccessInfo(
  lessons: (LessonForAccess & { duration?: number | null })[],
  course: CourseForAccess,
  enrollment: EnrollmentForAccess | null,
  progressMap: Map<string, ProgressForAccess>
): (LessonForAccess & {
  canAccess: boolean;
  accessDeniedReason?: AccessDeniedReason;
  accessDeniedMessage?: string;
  isCompleted: boolean;
  progress: ProgressForAccess | null;
})[] {
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);

  return sortedLessons.map((lesson) => {
    const access = checkLessonAccess(
      lesson,
      course,
      enrollment,
      sortedLessons,
      progressMap
    );
    const progress = progressMap.get(lesson.id) || null;
    const isCompleted = isLessonComplete(progress, lesson);

    if (access.allowed) {
      return {
        ...lesson,
        canAccess: true,
        isCompleted,
        progress,
      };
    } else {
      return {
        ...lesson,
        canAccess: false,
        accessDeniedReason: access.reason,
        accessDeniedMessage: access.message,
        isCompleted,
        progress,
      };
    }
  });
}
