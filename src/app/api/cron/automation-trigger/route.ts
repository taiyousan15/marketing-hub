import { NextResponse } from "next/server";
import { executePendingAutomations } from "@/actions/automation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await executePendingAutomations();

    return NextResponse.json({
      ok: true,
      ...results,
    });
  } catch (error) {
    console.error("Automation trigger cron error:", error);
    return NextResponse.json(
      { error: "Automation execution failed" },
      { status: 500 }
    );
  }
}
