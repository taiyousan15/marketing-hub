import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { MemberRank } from "@prisma/client";

type Params = { id: string };

/**
 * レッスン一覧取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: courseId } = await params;
    const userInfo = await getCurrentUser();
    const tenantId =
      userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    // コース存在確認
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tenantId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (tenantId && course.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        content: true,
        videoUrl: true,
        videoType: true,
        duration: true,
        isPublished: true,
        releaseDelay: true,
        requiredRank: true,
        isSequentialStart: true,
        requireCompletion: true,
        completionThreshold: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error("Failed to fetch lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}

/**
 * レッスン作成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: courseId } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    // コース存在確認
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tenantId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (tenantId && course.tenantId !== tenantId) {
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

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // orderが指定されていない場合、最後に追加
    let lessonOrder = order;
    if (lessonOrder === undefined) {
      const maxOrder = await prisma.lesson.aggregate({
        where: { courseId },
        _max: { order: true },
      });
      lessonOrder = (maxOrder._max.order ?? -1) + 1;
    }

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        name,
        description: description || null,
        content: content || {},
        videoUrl: videoUrl || null,
        videoType: videoType || null,
        duration: duration || null,
        isPublished: isPublished ?? false,
        releaseDelay: releaseDelay ?? 0,
        requiredRank: (requiredRank as MemberRank) || "BRONZE",
        isSequentialStart: isSequentialStart ?? false,
        requireCompletion: requireCompletion ?? false,
        completionThreshold: completionThreshold ?? 80,
        order: lessonOrder,
      },
    });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error("Failed to create lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}

/**
 * レッスン順序更新（バッチ）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: courseId } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    // コース存在確認
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tenantId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (tenantId && course.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { lessonOrders } = body;

    if (!Array.isArray(lessonOrders)) {
      return NextResponse.json(
        { error: "lessonOrders must be an array" },
        { status: 400 }
      );
    }

    // トランザクションで一括更新
    await prisma.$transaction(
      lessonOrders.map(
        ({ lessonId, order }: { lessonId: string; order: number }) =>
          prisma.lesson.update({
            where: { id: lessonId },
            data: { order },
          })
      )
    );

    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error("Failed to reorder lessons:", error);
    return NextResponse.json(
      { error: "Failed to reorder lessons" },
      { status: 500 }
    );
  }
}
