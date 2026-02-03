// src/app/api/webhooks/sms/route.ts
// Twilio SMS Webhook ハンドラー

import { NextRequest, NextResponse } from 'next/server';
import { updateSMSStatus, processOptout, isOptoutMessage } from '@/lib/sms';
import { prisma } from '@/lib/db/prisma';
import twilio from 'twilio';

// Twilioの署名検証
function validateTwilioSignature(
  request: NextRequest,
  body: string
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const signature = request.headers.get('x-twilio-signature');
  if (!signature) return false;

  const url = request.url;

  // URLパラメータをオブジェクトに変換
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(body);
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return twilio.validateRequest(authToken, signature, url, params);
}

/**
 * SMS配信状況更新 Webhook
 * Twilioからのステータスコールバック
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);

    // 本番環境では署名検証
    if (process.env.NODE_ENV === 'production') {
      if (!validateTwilioSignature(request, body)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    const messageSid = params.get('MessageSid');
    const messageStatus = params.get('MessageStatus');
    const from = params.get('From');
    const to = params.get('To');
    const bodyText = params.get('Body');
    const errorCode = params.get('ErrorCode');
    const errorMessage = params.get('ErrorMessage');

    // 受信メッセージ（オプトアウト処理）
    if (bodyText && from) {
      if (isOptoutMessage(bodyText)) {
        // fromからテナントを特定してオプトアウト処理
        const smsLog = await prisma.sMSLog.findFirst({
          where: { toNumber: from },
          orderBy: { queuedAt: 'desc' },
          select: { tenantId: true }
        });

        if (smsLog) {
          await processOptout(smsLog.tenantId, from);
          console.log(`Opt-out processed for ${from}`);
        }
      }

      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        }
      );
    }

    // ステータス更新
    if (messageSid && messageStatus) {
      await updateSMSStatus(
        messageSid,
        messageStatus,
        errorCode || undefined,
        errorMessage || undefined
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SMS webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// GETリクエストは拒否
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
