import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { z } from "zod";

const CreateRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggerType: z.string().min(1),
  aiEnabled: z.boolean().default(false),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await prisma.automationRule.findMany({
      where: { tenantId: user.tenantId },
      include: {
        triggers: true,
        actions: { orderBy: { order: "asc" } },
        _count: { select: { executions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("GET /api/automation/rules error:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = CreateRuleSchema.safeParse(body);
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

    const { name, description, triggerType, aiEnabled } = validation.data;

    const rule = await prisma.automationRule.create({
      data: {
        tenantId: user.tenantId,
        name,
        description: description ?? null,
        aiEnabled,
        triggers: {
          create: {
            type: triggerType as "LINE_FRIEND_ADDED",
            conditions: [],
          },
        },
      },
      include: {
        triggers: true,
        actions: { orderBy: { order: "asc" } },
        _count: { select: { executions: true } },
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("POST /api/automation/rules error:", error);
    return NextResponse.json(
      { error: "Failed to create automation rule" },
      { status: 500 }
    );
  }
}
