'use server';

import { prisma } from '@/lib/db/prisma';
import { deliverMessage } from '@/lib/step-delivery/engine';
import type { DeliveryChannel } from '@prisma/client';

/**
 * ステップの遅延時間をミリ秒で計算
 */
function calculateDelayMs(step: {
  delayDays: number;
  delayHours: number;
  delayMinutes: number;
}): number {
  return (
    step.delayDays * 24 * 60 * 60 * 1000 +
    step.delayHours * 60 * 60 * 1000 +
    step.delayMinutes * 60 * 1000
  );
}

/**
 * キャンペーンタイプからデフォルトの配信チャンネルを決定
 */
function getChannelFromCampaignType(type: string): DeliveryChannel {
  if (type.startsWith('LINE')) return 'LINE';
  if (type === 'SMS') return 'SMS';
  return 'EMAIL';
}

/**
 * 配信対象のCampaignContactsを取得
 * - ステータスがACTIVE
 * - nextStepAtが現在時刻以前 or null（初回実行）
 */
export async function getExecutableContacts(campaignId: string) {
  const now = new Date();

  return prisma.campaignContact.findMany({
    where: {
      campaignId,
      status: 'ACTIVE',
      OR: [
        { nextStepAt: { lte: now } },
        { nextStepAt: null, currentStep: 0 },
      ],
    },
    include: {
      contact: {
        select: { id: true, email: true, name: true, phone: true, lineUserId: true },
      },
    },
  });
}

/**
 * 単一のCampaignContactに対して次のステップを実行
 */
export async function executeStepForContact(
  campaignId: string,
  campaignContact: {
    id: string;
    contactId: string;
    currentStep: number;
  },
  step: {
    id: string;
    order: number;
    type: string;
    subject: string | null;
    content: unknown;
  },
  channel: DeliveryChannel,
  tenantId: string
) {
  const content = step.content as Record<string, string>;

  // WAITステップの場合はスキップして次へ
  if (step.type === 'WAIT') {
    return { success: true, skipped: true };
  }

  // CONDITIONステップは将来拡張（今はスキップ）
  if (step.type === 'CONDITION' || step.type === 'ACTION') {
    return { success: true, skipped: true };
  }

  // MESSAGE ステップ → 配信エンジンに委譲
  const result = await deliverMessage({
    channel,
    contactId: campaignContact.contactId,
    tenantId,
    stepId: step.id,
    campaignId,
    subject: step.subject ?? undefined,
    htmlContent: content.html ?? content.body ?? undefined,
    textContent: content.text ?? content.body ?? undefined,
    smsBody: content.smsBody ?? content.body ?? undefined,
    lineMessage: content.lineMessage ?? content.body ?? undefined,
    whatsappMessage: content.whatsappMessage ?? content.body ?? undefined,
  });

  // 実行ログ保存
  await prisma.campaignExecution.create({
    data: {
      campaignId,
      stepId: step.id,
      contactId: campaignContact.contactId,
      channel: channel,
      status: result.success ? 'SENT' : 'FAILED',
      sentAt: result.success ? result.timestamp : null,
      error: result.error ?? null,
    },
  });

  return result;
}

/**
 * キャンペーン全体の実行（Cronから呼ばれる）
 */
export async function executeCampaigns() {
  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: 'ACTIVE' },
    include: {
      steps: { orderBy: { order: 'asc' } },
    },
  });

  const results: Array<{
    campaignId: string;
    processed: number;
    sent: number;
    failed: number;
    completed: number;
  }> = [];

  for (const campaign of activeCampaigns) {
    if (campaign.steps.length === 0) continue;

    const contacts = await getExecutableContacts(campaign.id);
    let sent = 0;
    let failed = 0;
    let completed = 0;

    const channel = getChannelFromCampaignType(campaign.type);

    for (const cc of contacts) {
      const stepIndex = cc.currentStep;
      const step = campaign.steps.find((s) => s.order === stepIndex);

      if (!step) {
        // 全ステップ完了
        await prisma.campaignContact.update({
          where: { id: cc.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        completed++;
        continue;
      }

      try {
        const result = await executeStepForContact(
          campaign.id,
          { id: cc.id, contactId: cc.contactId, currentStep: cc.currentStep },
          step,
          channel,
          campaign.tenantId
        );

        if (result.success) {
          sent++;
        } else {
          failed++;
        }

        // 次のステップへ進む
        const nextStep = campaign.steps.find((s) => s.order === stepIndex + 1);
        if (nextStep) {
          const delayMs = calculateDelayMs(nextStep);
          await prisma.campaignContact.update({
            where: { id: cc.id },
            data: {
              currentStep: stepIndex + 1,
              nextStepAt: new Date(Date.now() + delayMs),
            },
          });
        } else {
          // これが最後のステップ
          await prisma.campaignContact.update({
            where: { id: cc.id },
            data: { status: 'COMPLETED', completedAt: new Date() },
          });
          completed++;
        }
      } catch (error) {
        console.error(
          `Campaign ${campaign.id} step ${step.id} contact ${cc.contactId} error:`,
          error
        );
        failed++;

        // エラーログ保存
        await prisma.campaignExecution.create({
          data: {
            campaignId: campaign.id,
            stepId: step.id,
            contactId: cc.contactId,
            channel,
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    // 全コンタクトが完了したらキャンペーンも完了
    const remainingActive = await prisma.campaignContact.count({
      where: { campaignId: campaign.id, status: 'ACTIVE' },
    });

    if (remainingActive === 0 && contacts.length > 0) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'COMPLETED' },
      });
    }

    results.push({
      campaignId: campaign.id,
      processed: contacts.length,
      sent,
      failed,
      completed,
    });
  }

  return results;
}

/**
 * キャンペーンの実行ログを取得
 */
export async function getCampaignExecutions(
  campaignId: string,
  page = 1,
  limit = 50
) {
  const [executions, total] = await Promise.all([
    prisma.campaignExecution.findMany({
      where: { campaignId },
      include: {
        contact: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaignExecution.count({ where: { campaignId } }),
  ]);

  return { executions, total, page, limit };
}
