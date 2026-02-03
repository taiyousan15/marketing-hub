// src/app/api/webhooks/whatsapp/route.ts
// Twilio WhatsApp Webhook

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  updateWhatsAppStatus,
  processWhatsAppOptout,
  extractPhoneNumber,
} from "@/lib/whatsapp/twilio-whatsapp-client";

// オプトアウトキーワード
const OPTOUT_KEYWORDS = ["stop", "unsubscribe", "停止", "解除", "配信停止"];

export async function POST(req: NextRequest) {
  try {
    // Twilioからのフォームデータを解析
    const formData = await req.formData();

    const messageSid = formData.get("MessageSid") as string;
    const status = formData.get("MessageStatus") as string;
    const errorCode = formData.get("ErrorCode") as string | null;
    const errorMessage = formData.get("ErrorMessage") as string | null;
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;

    // ステータス更新（送信メッセージのステータス変更）
    if (messageSid && status) {
      await updateWhatsAppStatus(
        messageSid,
        status,
        errorCode || undefined,
        errorMessage || undefined
      );

      return NextResponse.json({ success: true, type: "status_update" });
    }

    // 受信メッセージ処理
    if (from && body) {
      const lowerBody = body.toLowerCase().trim();

      // オプトアウトチェック
      const isOptout = OPTOUT_KEYWORDS.some(
        (keyword) =>
          lowerBody === keyword.toLowerCase() ||
          lowerBody.includes(keyword.toLowerCase())
      );

      if (isOptout) {
        // オプトアウト処理
        // fromからテナントを特定（WhatsApp番号で逆引き）
        const settings = await prisma.whatsAppSettings.findFirst({
          where: {
            enabled: true,
          },
        });

        if (settings) {
          await processWhatsAppOptout(settings.tenantId, from);
        }

        return NextResponse.json({ success: true, type: "optout" });
      }

      // 通常の受信メッセージ処理（将来のチャット機能用）
      // 現在は受信メッセージをログに記録のみ
      console.log("WhatsApp received:", {
        from,
        body,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, type: "incoming" });
    }

    return NextResponse.json({ success: true, type: "unknown" });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    // Twilioに200を返さないとリトライされる
    return NextResponse.json({ success: false, error: "Processing error" });
  }
}

// Twilio署名検証用（本番環境で有効化推奨）
export async function GET(req: NextRequest) {
  // Webhook検証用
  return new NextResponse("OK", { status: 200 });
}
