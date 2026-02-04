import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getPublicLesson } from "@/lib/courses/public-access";
import {
  checkLessonAccess,
  RANK_INFO,
} from "@/lib/courses/access-control";
import { getLessonProgressMap } from "@/lib/courses/progress";

type Params = { shareCode: string; lessonId: string };

/**
 * 公開レッスン取得（認証不要）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { shareCode, lessonId } = await params;
    const contactId = request.nextUrl.searchParams.get("contactId");

    // 公開コースを確認
    const course = await prisma.course.findUnique({
      where: { shareCode },
      select: {
        id: true,
        isPublicCourse: true,
        accessMode: true,
        isPublished: true,
        lessons: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            order: true,
            duration: true,
            isPublished: true,
            requiredRank: true,
            isSequentialStart: true,
            requireCompletion: true,
            completionThreshold: true,
          },
        },
      },
    });

    if (!course || !course.isPublicCourse) {
      return NextResponse.json(
        { error: "Course not found or not public" },
        { status: 404 }
      );
    }

    // レッスンを取得
    const lesson = await getPublicLesson(shareCode, lessonId);

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // アクセスチェック
    let progressMap = new Map();
    if (contactId) {
      progressMap = await getLessonProgressMap(course.id, contactId);
    }

    const accessCheck = checkLessonAccess(
      {
        ...lesson,
        isPublished: true,
      },
      {
        id: course.id,
        isPublished: true,
        accessMode: course.accessMode,
        isPublicCourse: course.isPublicCourse,
      },
      null, // 公開コースなのでenrollment不要
      course.lessons,
      progressMap
    );

    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          error: "Access denied",
          reason: accessCheck.reason,
          message: accessCheck.message,
        },
        { status: 403 }
      );
    }

    // 前後のレッスン情報を取得
    const sortedLessons = course.lessons;
    const currentIndex = sortedLessons.findIndex((l) => l.id === lessonId);
    const prevLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
    const nextLesson =
      currentIndex < sortedLessons.length - 1
        ? sortedLessons[currentIndex + 1]
        : null;

    // 現在の進捗
    const currentProgress = progressMap.get(lessonId);

    return NextResponse.json({
      lesson: {
        ...lesson,
        rankInfo: RANK_INFO[lesson.requiredRank],
      },
      navigation: {
        prevLesson: prevLesson
          ? {
              id: prevLesson.id,
              name: prevLesson.name,
            }
          : null,
        nextLesson: nextLesson
          ? {
              id: nextLesson.id,
              name: nextLesson.name,
              requiredRank: nextLesson.requiredRank,
              rankInfo: RANK_INFO[nextLesson.requiredRank],
            }
          : null,
        currentIndex,
        totalLessons: sortedLessons.length,
      },
      progress: currentProgress || null,
    });
  } catch (error) {
    console.error("Failed to fetch public lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}
