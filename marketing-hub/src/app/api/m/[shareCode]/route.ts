import { NextRequest, NextResponse } from "next/server";
import { getCourseByShareCode } from "@/lib/courses/public-access";
import {
  getLessonsWithAccessInfo,
  RANK_INFO,
  LessonForAccess,
} from "@/lib/courses/access-control";
import { getLessonProgressMap } from "@/lib/courses/progress";

type Params = { shareCode: string };

/**
 * 公開コース取得（認証不要）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { shareCode } = await params;
    const contactId = request.nextUrl.searchParams.get("contactId");

    // 公開コースを取得
    const course = await getCourseByShareCode(shareCode);

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or not public" },
        { status: 404 }
      );
    }

    // contactIdがある場合は進捗情報も取得
    let lessonsToReturn: (typeof course.lessons[number] & {
      canAccess?: boolean;
      isCompleted?: boolean;
      accessDeniedReason?: string;
      accessDeniedMessage?: string;
      progress?: { lessonId: string; isCompleted: boolean; watchedSeconds: number } | null;
    })[] = course.lessons;

    if (contactId) {
      const progressMap = await getLessonProgressMap(course.id, contactId);

      // アクセス情報を付与（型を合わせるためにマッピング）
      const lessonsForAccess: (LessonForAccess & { duration?: number | null })[] = course.lessons.map((l) => ({
        id: l.id,
        order: l.order,
        isPublished: l.isPublished,
        requiredRank: l.requiredRank,
        requireCompletion: l.requireCompletion,
        completionThreshold: l.completionThreshold,
        isSequentialStart: l.isSequentialStart,
        duration: l.duration,
      }));

      const accessInfo = getLessonsWithAccessInfo(
        lessonsForAccess,
        {
          id: course.id,
          isPublished: true,
          accessMode: course.accessMode,
          isPublicCourse: course.isPublicCourse,
        },
        null, // 公開コースなのでenrollment不要
        progressMap
      );

      // 元のlessonデータとアクセス情報をマージ
      lessonsToReturn = course.lessons.map((lesson) => {
        const access = accessInfo.find((a) => a.id === lesson.id);
        return {
          ...lesson,
          canAccess: access?.canAccess ?? true,
          isCompleted: access?.isCompleted ?? false,
          accessDeniedReason: access?.accessDeniedReason,
          accessDeniedMessage: access?.accessDeniedMessage,
          progress: access?.progress,
        };
      });
    }

    return NextResponse.json({
      course: {
        id: course.id,
        name: course.name,
        description: course.description,
        thumbnail: course.thumbnail,
        accessMode: course.accessMode,
      },
      lessons: lessonsToReturn.map((lesson) => ({
        ...lesson,
        rankInfo: RANK_INFO[lesson.requiredRank],
      })),
    });
  } catch (error) {
    console.error("Failed to fetch public course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}
