import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { EventType, EventStatus } from "@prisma/client";

/**
 * イベント一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const events = await prisma.event.findMany({
      where: {
        tenantId: currentUser.tenantId,
        ...(type ? { type: type as EventType } : {}),
        ...(status ? { status: status as EventStatus } : {}),
      },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

/**
 * イベント作成
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = currentUser.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const body = await request.json();

    // バリデーション
    if (!body.name || !body.type || !body.startAt || !body.endAt) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, startAt, endAt" },
        { status: 400 }
      );
    }

    // イベント作成
    const event = await prisma.event.create({
      data: {
        tenantId,
        name: body.name,
        description: body.description || null,
        type: body.type as EventType,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        timezone: body.timezone || "Asia/Tokyo",
        location: body.location || null,
        isOnline: body.isOnline !== false,
        meetingUrl: body.meetingUrl || null,
        capacity: body.capacity || null,
        status: (body.status as EventStatus) || "SCHEDULED",
      },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
