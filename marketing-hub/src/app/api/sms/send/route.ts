// src/app/api/sms/send/route.ts
// SMS送信 API

import { NextRequest, NextResponse } from 'next/server';
import { sendSMS, validatePhoneNumber } from '@/lib/sms';
import { getCurrentUser } from '@/lib/auth/tenant';
import { z } from 'zod';

const SendSMSSchema = z.object({
  to: z.string().min(1, '電話番号は必須です'),
  body: z.string().min(1, 'メッセージは必須です').max(670, 'メッセージは670文字以内にしてください'),
  contactId: z.string().optional(),
  scheduleAt: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const userInfo = await getCurrentUser();
    if (!userInfo?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // バリデーション
    const validation = SendSMSSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      }, { status: 400 });
    }

    const { to, body: messageBody, contactId, scheduleAt } = validation.data;

    // 電話番号バリデーション
    const phoneValidation = validatePhoneNumber(to);
    if (!phoneValidation.valid) {
      return NextResponse.json({
        error: phoneValidation.error,
      }, { status: 400 });
    }

    // SMS送信
    const result = await sendSMS({
      to,
      body: messageBody,
      tenantId: userInfo.tenantId,
      contactId,
      scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
    });

    if (!result.success) {
      return NextResponse.json({
        error: result.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      messageSid: result.messageSid,
      status: result.status,
      segments: result.segments,
    });
  } catch (error) {
    console.error('SMS send API error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
