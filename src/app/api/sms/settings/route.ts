// src/app/api/sms/settings/route.ts
// SMS設定 API

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/tenant';
import { z } from 'zod';

const SMSSettingsSchema = z.object({
  provider: z.enum(['twilio', 'vonage', 'aws_sns']).default('twilio'),
  accountSid: z.string().optional(),
  authToken: z.string().optional(),
  fromNumber: z.string().optional(),
  messagingServiceSid: z.string().optional(),
  enabled: z.boolean().default(false),
  sendingHoursStart: z.number().min(0).max(23).default(9),
  sendingHoursEnd: z.number().min(0).max(23).default(20),
  removeUrls: z.boolean().default(true),
  maxPerMinute: z.number().min(1).max(100).default(30),
  maxPerDay: z.number().min(1).max(10000).default(1000),
});

/**
 * SMS設定取得
 */
export async function GET(request: NextRequest) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.sMSSettings.findUnique({
      where: { tenantId: userInfo.tenantId },
    });

    if (!settings) {
      return NextResponse.json({
        provider: 'twilio',
        enabled: false,
        sendingHoursStart: 9,
        sendingHoursEnd: 20,
        removeUrls: true,
        maxPerMinute: 30,
        maxPerDay: 1000,
      });
    }

    // 機密情報をマスク
    return NextResponse.json({
      ...settings,
      accountSid: settings.accountSid ? '***' + settings.accountSid.slice(-4) : null,
      authToken: settings.authToken ? '********' : null,
    });
  } catch (error) {
    console.error('Failed to get SMS settings:', error);
    return NextResponse.json(
      { error: 'Failed to get SMS settings' },
      { status: 500 }
    );
  }
}

/**
 * SMS設定更新
 */
export async function PUT(request: NextRequest) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // バリデーション
    const validation = SMSSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      }, { status: 400 });
    }

    const data = validation.data;

    // 既存設定を取得
    const existing = await prisma.sMSSettings.findUnique({
      where: { tenantId: userInfo.tenantId },
    });

    // 機密情報が変更されていない場合は既存値を保持
    const updateData = {
      provider: data.provider,
      accountSid: data.accountSid?.startsWith('***') ? existing?.accountSid : data.accountSid,
      authToken: data.authToken === '********' ? existing?.authToken : data.authToken,
      fromNumber: data.fromNumber,
      messagingServiceSid: data.messagingServiceSid,
      enabled: data.enabled,
      sendingHoursStart: data.sendingHoursStart,
      sendingHoursEnd: data.sendingHoursEnd,
      removeUrls: data.removeUrls,
      maxPerMinute: data.maxPerMinute,
      maxPerDay: data.maxPerDay,
    };

    const settings = await prisma.sMSSettings.upsert({
      where: { tenantId: userInfo.tenantId },
      create: {
        tenantId: userInfo.tenantId,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        accountSid: settings.accountSid ? '***' + settings.accountSid.slice(-4) : null,
        authToken: settings.authToken ? '********' : null,
      },
    });
  } catch (error) {
    console.error('Failed to update SMS settings:', error);
    return NextResponse.json(
      { error: 'Failed to update SMS settings' },
      { status: 500 }
    );
  }
}
