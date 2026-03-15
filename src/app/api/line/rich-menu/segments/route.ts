import { NextRequest, NextResponse } from "next/server";
import { updateRichMenusForTenant } from "@/lib/line/rich-menu-switcher";

function getTenantId(request: NextRequest): string | null {
  return request.headers.get("x-tenant-id") || null;
}

// POST: Trigger bulk rich menu re-evaluation for all contacts in tenant
export async function POST(request: NextRequest) {
  const tenantId = getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID required" }, { status: 401 });
  }

  try {
    const results = await updateRichMenusForTenant(tenantId);

    return NextResponse.json({
      success: true,
      data: {
        updated: results.updated,
        failed: results.failed,
        message: `Updated ${results.updated} contacts, ${results.failed} failed`,
      },
    });
  } catch (error) {
    console.error("Error updating rich menus for tenant:", error);
    return NextResponse.json(
      { error: "Failed to update rich menus" },
      { status: 500 }
    );
  }
}
