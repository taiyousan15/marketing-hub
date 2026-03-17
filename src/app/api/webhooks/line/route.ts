import { NextRequest, NextResponse } from "next/server";
import { WebhookEvent } from "@line/bot-sdk";
import { validateSignature } from "@/lib/line/client";
import { prisma } from "@/lib/db/prisma";
import { processLineOptin } from "@/lib/affiliate/service";
import { processAutoResponse } from "@/lib/line/auto-response";
import { onFollowEvent } from "@/lib/line/rich-menu-switcher";
import { assignLineAccountToContact } from "@/lib/line/distribution";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  // 署名検証
  if (!signature || !validateSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // URLからテナントID・アカウントIDを取得
  // Webhook URL形式: /api/webhooks/line?tenant=xxx&account=yyy
  const { searchParams } = new URL(request.url);
  const tenantId =
    searchParams.get("tenant") ||
    request.headers.get("x-tenant-id") ||
    process.env.DEFAULT_TENANT_ID;
  const accountId = searchParams.get("account") || null;

  if (!tenantId) {
    console.error("Tenant ID not found in LINE webhook request");
    return NextResponse.json(
      { error: "Tenant ID required" },
      { status: 400 }
    );
  }

  const { events } = JSON.parse(body) as { events: WebhookEvent[] };

  // 各イベントを処理
  for (const event of events) {
    await handleLineEvent(event, tenantId, accountId);
  }

  return NextResponse.json({ success: true });
}

async function handleLineEvent(event: WebhookEvent, tenantId: string, accountId: string | null) {
  switch (event.type) {
    case "follow":
      await handleFollow(event, tenantId, accountId);
      break;
    case "unfollow":
      await handleUnfollow(event, tenantId);
      break;
    case "message":
      await handleMessage(event, tenantId);
      break;
    case "postback":
      await handlePostback(event, tenantId);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleFollow(
  event: WebhookEvent & { type: "follow" },
  tenantId: string,
  accountId: string | null
) {
  const userId = event.source.userId;
  if (!userId) return;

  console.log(`New follower: ${userId} (account: ${accountId || "unknown"})`);

  // LIFFパラメータやリッチメニューからアフィリエイト情報を取得
  const clickId = await getAffiliateClickId(userId);
  const partnerCode = await getPartnerCode(userId);

  // 既存のコンタクトを確認
  let contact = await prisma.contact.findFirst({
    where: {
      tenantId,
      lineUserId: userId,
    },
  });

  if (!contact) {
    // 新規コンタクトを作成
    contact = await prisma.contact.create({
      data: {
        tenantId,
        lineUserId: userId,
        lineOptIn: true,
        lineOptInAt: new Date(),
        source: "LINE",
        lineAccountId: accountId,
      },
    });
    console.log(`Created new contact for LINE user: ${contact.id}`);
  } else {
    // 既存コンタクトを更新
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        lineOptIn: true,
        lineOptInAt: new Date(),
        lineAccountId: accountId || contact.lineAccountId,
      },
    });
    console.log(`Updated contact for LINE user: ${contact.id}`);
  }

  // アカウントIDが指定されている場合、そのアカウントのcurrentFriendsを更新
  if (accountId) {
    await prisma.lineAccount.update({
      where: { id: accountId },
      data: { currentFriends: { increment: 1 } },
    }).catch((err: Error) => {
      console.error("Error updating currentFriends:", err.message);
    });
  }

  // プロジェクト単位の振り分け: アカウントが上限(maxFriends)に達したか確認
  if (accountId) {
    try {
      const account = await prisma.lineAccount.findUnique({
        where: { id: accountId },
        select: { projectId: true, currentFriends: true, maxFriends: true },
      });

      if (account?.maxFriends && account.currentFriends >= account.maxFriends && account.projectId) {
        console.log(
          `Account ${accountId} reached maxFriends limit (${account.maxFriends}). ` +
          `Next followers will be distributed to another account in project ${account.projectId}.`
        );
      }
    } catch (error) {
      console.error("Error checking account limit:", error);
    }
  }

  // セグメントベースのリッチメニューを自動設定
  try {
    await onFollowEvent(tenantId, userId);
  } catch (error) {
    console.error("Error setting rich menu on follow:", error);
  }

  // アフィリエイトオプトインを処理
  if (clickId || partnerCode) {
    try {
      const result = await processLineOptin({
        tenantId,
        contactId: contact.id,
        lineUserId: userId,
        clickId: clickId || undefined,
        partnerCode: partnerCode || undefined,
      });

      if (result.success) {
        console.log(
          `Affiliate opt-in processed for contact ${contact.id}:`,
          result.commissions
        );
      }
    } catch (error) {
      console.error("Error processing affiliate opt-in:", error);
    }
  }
}

/**
 * LINE LIFFまたはリッチメニュー経由で保存されたクリックIDを取得
 * LIFF経由で友だち追加した場合、事前にクリック情報がDBに保存されている
 */
async function getAffiliateClickId(lineUserId: string): Promise<string | null> {
  // TODO: Implement affiliate click tracking when pendingLineUserId field is added
  return null;
}

/**
 * URL経由で渡されたパートナーコードを取得
 */
async function getPartnerCode(lineUserId: string): Promise<string | null> {
  // TODO: Implement partner code tracking when pendingLineUserId field is added
  return null;
}

async function handleUnfollow(
  event: WebhookEvent & { type: "unfollow" },
  tenantId: string
) {
  const userId = event.source.userId;
  if (!userId) return;

  console.log(`Unfollowed: ${userId}`);

  // コンタクトのLINEオプトイン状態を更新
  await prisma.contact.updateMany({
    where: {
      tenantId,
      lineUserId: userId,
    },
    data: {
      lineOptIn: false,
    },
  });
}

async function handleMessage(
  event: WebhookEvent & { type: "message" },
  tenantId: string
) {
  const userId = event.source.userId;
  if (!userId) return;

  if (event.message.type === "text") {
    const text = event.message.text;
    console.log(`Message from ${userId}: ${text}`);

    // アフィリエイトコードがメッセージに含まれている場合、紹介者を記録
    // 例: ユーザーが「紹介コード: ABC123」と送信した場合
    const codeMatch = text.match(/(?:紹介コード|code)[:\s]*([A-Z0-9]+)/i);
    if (codeMatch) {
      const partnerCode = codeMatch[1];
      await linkAffiliateToContact(tenantId, userId, partnerCode);
    }

    // 自動応答のチェック
    const contact = await prisma.contact.findFirst({
      where: { tenantId, lineUserId: userId },
      select: { id: true },
    });

    if (contact && event.replyToken) {
      await processAutoResponse(
        tenantId,
        event.replyToken,
        text,
        contact.id
      );
    }
  }
}

/**
 * メッセージ経由でアフィリエイトコードを受け取った場合の処理
 */
async function linkAffiliateToContact(
  tenantId: string,
  lineUserId: string,
  partnerCode: string
) {
  try {
    // パートナーを確認
    const partner = await prisma.partner.findFirst({
      where: {
        code: partnerCode,
        tenantId,
        status: "ACTIVE",
      },
    });

    if (!partner) {
      console.log(`Partner not found for code: ${partnerCode}`);
      return;
    }

    // コンタクトを取得
    const contact = await prisma.contact.findFirst({
      where: {
        tenantId,
        lineUserId,
      },
    });

    if (!contact) {
      console.log(`Contact not found for LINE user: ${lineUserId}`);
      return;
    }

    // 既に紹介者がいる場合はスキップ
    if (contact.referredByPartnerId) {
      console.log(`Contact ${contact.id} already has a referrer`);
      return;
    }

    // 紹介者を設定
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        referredByPartnerId: partner.id,
      },
    });

    // オプトイン報酬を処理
    const result = await processLineOptin({
      tenantId,
      contactId: contact.id,
      lineUserId,
      partnerCode,
    });

    if (result.success) {
      console.log(
        `Affiliate linked via message for contact ${contact.id}:`,
        result.commissions
      );
    }
  } catch (error) {
    console.error("Error linking affiliate via message:", error);
  }
}

async function handlePostback(
  event: WebhookEvent & { type: "postback" },
  tenantId: string
) {
  const userId = event.source.userId;
  if (!userId) return;

  const data = event.postback.data;
  console.log(`Postback from ${userId}: ${data}`);

  // ポストバックデータを解析してアクションを実行
  const params = new URLSearchParams(data);

  // アフィリエイトトラッキング用のポストバック処理
  // リッチメニューやカルーセルからのクリックでアフィリエイト情報を取得
  const affClickId = params.get("aff_click");
  const affCode = params.get("aff");

  if (affClickId || affCode) {
    const contact = await prisma.contact.findFirst({
      where: { tenantId, lineUserId: userId },
    });

    if (contact && !contact.referredByPartnerId) {
      try {
        const result = await processLineOptin({
          tenantId,
          contactId: contact.id,
          lineUserId: userId,
          clickId: affClickId || undefined,
          partnerCode: affCode || undefined,
        });

        if (result.success) {
          console.log(
            `Affiliate tracked via postback for contact ${contact.id}`
          );
        }
      } catch (error) {
        console.error("Error processing affiliate postback:", error);
      }
    }
  }

  // タブ切り替えリッチメニュー処理
  const tabAction = params.get("action");
  const tabGroup = params.get("tab_group");
  const tabOrder = params.get("tab_order");

  if (tabAction === "switch_tab" && tabGroup) {
    try {
      const targetMenu = await prisma.lineRichMenu.findFirst({
        where: {
          tabGroup,
          tabOrder: tabOrder ? parseInt(tabOrder, 10) : 0,
        },
      });

      if (targetMenu?.lineRichMenuId) {
        const { lineClient: client } = await import("@/lib/line/client");
        if (client) {
          await client.linkRichMenuToUser(userId, targetMenu.lineRichMenuId);
        }
      }
    } catch (error) {
      console.error("Error switching tab rich menu:", error);
    }
  }
}
