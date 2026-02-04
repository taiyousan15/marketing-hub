import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { JourneyStatus, Prisma } from "@prisma/client";

/**
 * ジャーニー一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Prisma.JourneyWhereInput = {
      tenantId: user.tenantId,
    };

    if (status && status !== "all") {
      where.status = status.toUpperCase() as JourneyStatus;
    }

    const [journeys, total] = await Promise.all([
      prisma.journey.findMany({
        where,
        include: {
          nodes: {
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
      prisma.journey.count({ where }),
    ]);

    // 統計情報を計算
    const journeysWithStats = await Promise.all(
      journeys.map(async (journey) => {
        const [enrolled, completed, active] = await Promise.all([
          prisma.journeyContact.count({
            where: { journeyId: journey.id },
          }),
          prisma.journeyContact.count({
            where: { journeyId: journey.id, status: "COMPLETED" },
          }),
          prisma.journeyContact.count({
            where: { journeyId: journey.id, status: "ACTIVE" },
          }),
        ]);

        return {
          ...journey,
          stats: {
            enrolled,
            completed,
            active,
            conversionRate: enrolled > 0 ? Math.round((completed / enrolled) * 100 * 10) / 10 : 0,
          },
        };
      })
    );

    return NextResponse.json({
      journeys: journeysWithStats,
      total,
    });
  } catch (error) {
    console.error("Failed to fetch journeys:", error);
    return NextResponse.json({ error: "Failed to fetch journeys" }, { status: 500 });
  }
}

/**
 * ジャーニー作成
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, triggerType, triggerConfig, nodes } = body;

    if (!name || !triggerType) {
      return NextResponse.json(
        { error: "Name and triggerType are required" },
        { status: 400 }
      );
    }

    const journey = await prisma.journey.create({
      data: {
        tenantId: user.tenantId,
        name,
        description: description || null,
        triggerType,
        triggerConfig: triggerConfig || null,
        status: "DRAFT",
        nodes: nodes
          ? {
              create: nodes.map((node: {
                type: string;
                title: string;
                description?: string;
                config?: Record<string, unknown>;
                position: { x: number; y: number };
                connections: string[];
                order?: number;
              }, index: number) => ({
                type: node.type,
                title: node.title,
                description: node.description || null,
                config: node.config || null,
                position: node.position,
                connections: node.connections || [],
                order: node.order ?? index,
              })),
            }
          : undefined,
      },
      include: {
        nodes: true,
      },
    });

    return NextResponse.json({ journey }, { status: 201 });
  } catch (error) {
    console.error("Failed to create journey:", error);
    return NextResponse.json({ error: "Failed to create journey" }, { status: 500 });
  }
}
