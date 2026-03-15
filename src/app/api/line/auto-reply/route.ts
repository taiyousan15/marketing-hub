import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

function getTenantId(request: NextRequest): string | null {
  return request.headers.get("x-tenant-id") || null;
}

// GET: List auto-reply rules
export async function GET(request: NextRequest) {
  const tenantId = getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID required" }, { status: 401 });
  }

  try {
    const rules = await prisma.lineAutoReply.findMany({
      where: { tenantId },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    console.error("Error fetching auto-reply rules:", error);
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

// POST: Create auto-reply rule
export async function POST(request: NextRequest) {
  const tenantId = getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, keyword, matchType, replyType, replyContent, priority } = body;

    if (!name || !keyword) {
      return NextResponse.json(
        { error: "Name and keyword are required" },
        { status: 400 }
      );
    }

    const rule = await prisma.lineAutoReply.create({
      data: {
        tenantId,
        name,
        keyword,
        matchType: matchType || "contains",
        replyType: replyType || "text",
        replyContent: replyContent || { text: "" },
        priority: priority || 0,
      },
    });

    return NextResponse.json({ success: true, data: rule }, { status: 201 });
  } catch (error) {
    console.error("Error creating auto-reply rule:", error);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}

// PATCH: Update auto-reply rule
export async function PATCH(request: NextRequest) {
  const tenantId = getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Rule ID required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.lineAutoReply.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const rule = await prisma.lineAutoReply.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: rule });
  } catch (error) {
    console.error("Error updating auto-reply rule:", error);
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }
}

// DELETE: Delete auto-reply rule
export async function DELETE(request: NextRequest) {
  const tenantId = getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Rule ID required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.lineAutoReply.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    await prisma.lineAutoReply.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting auto-reply rule:", error);
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
