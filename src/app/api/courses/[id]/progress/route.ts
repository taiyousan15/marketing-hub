import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  updateLessonProgress,
  getCourseProgress,
  markLessonAsCompleted,
} from "@/lib/courses/progress";

type Params = { id: string };

/**
 * コース進捗取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: courseId } = await params;
    const contactId = request.nextUrl.searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId is required" },
        { status: 400 }
      );
    }

    // コース存在確認
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const progress = await getCourseProgress(courseId, contactId);

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Failed to fetch progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

/**
 * 進捗更新
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: courseId } = await params;
    const body = await request.json();

    const { contactId, lessonId, watchedSeconds, markComplete } = body;

    if (!contactId || !lessonId) {
      return NextResponse.json(
        { error: "contactId and lessonId are required" },
        { status: 400 }
      );
    }

    // レッスン存在確認
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        courseId,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    let result;

    if (markComplete) {
      // 完了としてマーク
      await markLessonAsCompleted(lessonId, contactId);
      result = { isCompleted: true, progress: 100 };
    } else if (watchedSeconds !== undefined) {
      // 視聴時間を更新
      result = await updateLessonProgress(lessonId, contactId, watchedSeconds);
    } else {
      return NextResponse.json(
        { error: "watchedSeconds or markComplete is required" },
        { status: 400 }
      );
    }

    // コース全体の進捗も返す
    const courseProgress = await getCourseProgress(courseId, contactId);

    return NextResponse.json({
      lessonProgress: result,
      courseProgress,
    });
  } catch (error) {
    console.error("Failed to update progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
