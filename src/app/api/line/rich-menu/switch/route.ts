import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { lineClient } from "@/lib/line/client";

function getTenantId(request: NextRequest): string | null {
  return request.headers.get("x-tenant-id") || null;
}

// POST: Switch rich menu tab for a user
export async function POST(request: NextRequest) {
  const tenantId = getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { lineUserId, tabGroup, tabOrder } = body;

    if (!lineUserId || !tabGroup) {
      return NextResponse.json(
        { error: "lineUserId and tabGroup are required" },
        { status: 400 }
      );
    }

    // Find the target menu in the tab group
    const targetMenu = await prisma.lineRichMenu.findFirst({
      where: {
        tenantId,
        tabGroup,
        tabOrder: tabOrder ?? 0,
      },
    });

    if (!targetMenu?.lineRichMenuId) {
      return NextResponse.json(
        { error: "Target rich menu not found in tab group" },
        { status: 404 }
      );
    }

    if (!lineClient) {
      return NextResponse.json(
        { error: "LINE client not configured" },
        { status: 500 }
      );
    }

    // Switch rich menu via LINE API
    await lineClient.linkRichMenuToUser(lineUserId, targetMenu.lineRichMenuId);

    return NextResponse.json({
      success: true,
      data: {
        menuId: targetMenu.id,
        tabGroup,
        tabOrder: targetMenu.tabOrder,
      },
    });
  } catch (error) {
    console.error("Error switching rich menu tab:", error);
    return NextResponse.json(
      { error: "Failed to switch rich menu" },
      { status: 500 }
    );
  }
}

// GET: List tab groups
export async function GET(request: NextRequest) {
  const tenantId = getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID required" }, { status: 401 });
  }

  try {
    const menus = await prisma.lineRichMenu.findMany({
      where: {
        tenantId,
        tabGroup: { not: null },
      },
      orderBy: [{ tabGroup: "asc" }, { tabOrder: "asc" }],
      select: {
        id: true,
        name: true,
        tabGroup: true,
        tabOrder: true,
        lineRichMenuId: true,
        imageUrl: true,
      },
    });

    // Group by tabGroup (immutable accumulation)
    const groups = menus.reduce<Record<string, typeof menus>>((acc, menu) => {
      const group = menu.tabGroup || "default";
      const existing = acc[group] ?? [];
      return { ...acc, [group]: [...existing, menu] };
    }, {});

    return NextResponse.json({ success: true, data: groups });
  } catch (error) {
    console.error("Error fetching tab groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch tab groups" },
      { status: 500 }
    );
  }
}
