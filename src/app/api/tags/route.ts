import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export async function GET(request: NextRequest) {
  try {
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const tags = await prisma.tag.findMany({
      where: { tenantId },
      include: {
        _count: { select: { contacts: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      tags: tags.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        contactCount: t._count.contacts,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Tags GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const { name, color } = createSchema.parse(body);

    const tag = await prisma.tag.create({
      data: { tenantId, name, color },
      include: { _count: { select: { contacts: true } } },
    });

    return NextResponse.json({
      tag: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        contactCount: tag._count.contacts,
        createdAt: tag.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Tags POST error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    const isDuplicate = msg.includes("Unique constraint");
    return NextResponse.json(
      { error: isDuplicate ? "同じ名前のタグが既に存在します" : "Failed to create tag" },
      { status: isDuplicate ? 409 : 500 }
    );
  }
}
