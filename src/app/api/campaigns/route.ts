import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

/**
 * キャンペーン一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const status = request.nextUrl.searchParams.get("status");
    const type = request.nextUrl.searchParams.get("type");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0");

    const where = {
      tenantId,
      ...(status && { status: status as "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED" }),
      ...(type && { type: type as "EMAIL_STEP" | "LINE_STEP" | "EMAIL_BROADCAST" | "LINE_BROADCAST" }),
    };

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          steps: {
            orderBy: { order: "asc" },
          },
          _count: {
            select: { contacts: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.campaign.count({ where }),
    ]);

    return NextResponse.json({ campaigns, total });
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

/**
 * キャンペーン作成
 */
export async function POST(request: NextRequest) {
  try {
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const { name, type, segmentId, useOptimalSendTime, minScoreThreshold, settings } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        tenantId,
        name,
        type,
        status: "DRAFT",
        segmentId: segmentId || null,
        useOptimalSendTime: useOptimalSendTime || false,
        minScoreThreshold: minScoreThreshold || null,
        settings: settings || {},
      },
      include: {
        steps: true,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Failed to create campaign:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
