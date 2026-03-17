/**
 * 次の振り分け先LINEアカウント取得API
 *
 * GET /api/line/distribution/next?tenantId=xxx&projectId=yyy
 *
 * LP表示時やQRコード生成時に呼び出し、
 * 次にフォローさせるべきLINEアカウントを返す
 */

import { NextRequest, NextResponse } from "next/server";
import { getNextLineAccount, getDistributionStats } from "@/lib/line/distribution";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const projectId = searchParams.get("projectId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const account = await getNextLineAccount(
      tenantId,
      projectId || undefined
    );

    if (!account) {
      return NextResponse.json(
        { error: "No available LINE account found" },
        { status: 404 }
      );
    }

    // 統計情報も含めて返す
    const stats = await getDistributionStats(tenantId, projectId || undefined);

    return NextResponse.json({
      account: {
        id: account.accountId,
        channelId: account.channelId,
        projectId: account.projectId,
        // LINE友だち追加URL
        addFriendUrl: `https://line.me/R/ti/p/@${account.channelId}`,
        // Webhook URL（このアカウント用）
        webhookUrl: `/api/webhooks/line?tenant=${tenantId}&account=${account.accountId}`,
      },
      stats,
    });
  } catch (error) {
    console.error("Error getting next LINE account:", error);
    return NextResponse.json(
      { error: "Failed to get next LINE account" },
      { status: 500 }
    );
  }
}
