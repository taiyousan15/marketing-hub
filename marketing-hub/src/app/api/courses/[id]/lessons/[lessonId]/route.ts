import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { MemberRank } from "@prisma/client";

type Params = { id: string; lessonId: string };

/**
 * レッスン詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: courseId, lessonId } = await params;
    const userInfo = await getCurrentUser();
    const tenantId =
      userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        courseId,
      },
      include: {
        course: {
          select: {
            tenantId: true,
            name: true,
            accessMode: true,
            isPublicCourse: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (tenantId && lesson.course.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Failed to fetch lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}

/**
 * レッスン更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: courseId, lessonId } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    // レッスン存在確認
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        courseId,
      },
      include: {
        course: {
          select: { tenantId: true },
        },
      },
    });

    if (!existingLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (tenantId && existingLesson.course.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      name,
      description,
      content,
      videoUrl,
      videoType,
      duration,
      isPublished,
      releaseDelay,
      requiredRank,
      isSequentialStart,
      requireCompletion,
      completionThreshold,
      order,
    } = body;

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(videoType !== undefined && { videoType }),
        ...(duration !== undefined && { duration }),
        ...(isPublished !== undefined && { isPublished }),
        ...(releaseDelay !== undefined && { releaseDelay }),
        ...(requiredRank !== undefined && {
          requiredRank: requiredRank as MemberRank,
        }),
        ...(isSequentialStart !== undefined && { isSequentialStart }),
        ...(requireCompletion !== undefined && { requireCompletion }),
        ...(completionThreshold !== undefined && { completionThreshold }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Failed to update lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

/**
 * レッスン削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: courseId, lessonId } = await params;
    const userInfo = await getCurrentUser();
    const tenantId =
      userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    // レッスン存在確認
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        courseId,
      },
      include: {
        course: {
          select: { tenantId: true },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (tenantId && lesson.course.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    // 残りのレッスンの順序を再調整
    const remainingLessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    });

    await prisma.$transaction(
      remainingLessons.map((l, index) =>
        prisma.lesson.update({
          where: { id: l.id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
