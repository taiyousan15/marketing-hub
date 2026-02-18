import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const existing = await prisma.tag.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const data = updateSchema.parse(body);
    const tag = await prisma.tag.update({
      where: { id },
      data,
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
    console.error("Tags PATCH error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    const isDuplicate = msg.includes("Unique constraint");
    return NextResponse.json(
      { error: isDuplicate ? "同じ名前のタグが既に存在します" : "Failed to update tag" },
      { status: isDuplicate ? 409 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId =
      userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const existing = await prisma.tag.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    await prisma.tag.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tags DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
