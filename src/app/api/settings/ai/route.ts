import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/tenant";
import { getAISettings, updateAISettings, aiSettingsSchema } from "@/actions/settings";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const settings = await getAISettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings/ai error:", error);
    return NextResponse.json({ error: "Failed to get AI settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = aiSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const settings = await updateAISettings(validation.data);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("PUT /api/settings/ai error:", error);
    return NextResponse.json({ error: "Failed to update AI settings" }, { status: 500 });
  }
}
