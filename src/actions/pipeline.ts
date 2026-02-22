'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { DealStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/tenant';

const createPipelineSchema = z.object({
  name: z.string().min(1).max(100),
});

const createDealSchema = z.object({
  pipelineId: z.string().cuid(),
  stageId: z.string().cuid(),
  title: z.string().min(1).max(200),
  amount: z.number().int().min(0).default(0),
  contactId: z.string().cuid().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

const updateDealSchema = z.object({
  stageId: z.string().cuid().optional(),
  title: z.string().min(1).max(200).optional(),
  amount: z.number().int().min(0).optional(),
  status: z.nativeEnum(DealStatus).optional(),
  contactId: z.string().cuid().optional().nullable(),
  closedAt: z.date().optional().nullable(),
});

export async function getPipelines() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const pipelines = await prisma.pipeline.findMany({
    where: { tenantId: user.tenantId },
    include: {
      stages: { orderBy: { order: 'asc' } },
      _count: { select: { deals: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return pipelines;
}

export async function createPipeline(data: { name: string }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const validated = createPipelineSchema.parse(data);

  const pipeline = await prisma.pipeline.create({
    data: {
      tenantId: user.tenantId,
      name: validated.name,
      stages: {
        create: [
          { name: '見込み', order: 0, color: '#94a3b8', probability: 10 },
          { name: 'アプローチ', order: 1, color: '#60a5fa', probability: 25 },
          { name: '提案', order: 2, color: '#a78bfa', probability: 50 },
          { name: '交渉', order: 3, color: '#fb923c', probability: 75 },
          { name: '成約', order: 4, color: '#4ade80', probability: 100 },
        ],
      },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  });

  revalidatePath('/pipeline');
  return pipeline;
}

export async function getDeals(pipelineId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const deals = await prisma.deal.findMany({
    where: { tenantId: user.tenantId, pipelineId },
    include: {
      stage: true,
      contact: { select: { id: true, name: true, email: true } },
      activities: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
    orderBy: { createdAt: 'desc' },
  });

  return deals;
}

export async function createDeal(data: z.infer<typeof createDealSchema>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const validated = createDealSchema.parse(data);

  const deal = await prisma.deal.create({
    data: {
      tenantId: user.tenantId,
      pipelineId: validated.pipelineId,
      stageId: validated.stageId,
      title: validated.title,
      amount: validated.amount,
      contactId: validated.contactId ?? null,
      assigneeId: validated.assigneeId ?? null,
    },
    include: {
      stage: true,
      contact: { select: { id: true, name: true, email: true } },
    },
  });

  revalidatePath('/pipeline');
  return deal;
}

export async function updateDeal(id: string, data: z.infer<typeof updateDealSchema>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const validated = updateDealSchema.parse(data);

  const deal = await prisma.deal.update({
    where: { id, tenantId: user.tenantId },
    data: {
      ...validated,
      closedAt: validated.status === 'WON' || validated.status === 'LOST'
        ? new Date()
        : validated.closedAt,
    },
    include: { stage: true },
  });

  revalidatePath('/pipeline');
  return deal;
}

export async function deleteDeal(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.deal.delete({
    where: { id, tenantId: user.tenantId },
  });

  revalidatePath('/pipeline');
}

export async function addDealActivity(dealId: string, type: string, body: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const deal = await prisma.deal.findFirst({
    where: { id: dealId, tenantId: user.tenantId },
  });

  if (!deal) {
    throw new Error('Deal not found');
  }

  const activity = await prisma.dealActivity.create({
    data: { dealId, type, body },
  });

  revalidatePath(`/pipeline/${dealId}`);
  return activity;
}
