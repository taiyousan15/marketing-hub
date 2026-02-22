'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ABTestStatus, ABTestAlgorithm } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/tenant';

const createABTestSchema = z.object({
  name: z.string().min(1).max(200),
  algorithm: z.nativeEnum(ABTestAlgorithm).default('EQUAL_WEIGHT'),
  funnelId: z.string().cuid().optional().nullable(),
  variants: z.array(z.object({
    name: z.string().min(1),
    weight: z.number().int().min(1).max(100),
    pageId: z.string().cuid().optional().nullable(),
  })).min(2),
});

export type CreateABTestInput = z.infer<typeof createABTestSchema>;

export async function getABTests() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const tests = await prisma.aBTest.findMany({
    where: { tenantId: user.tenantId },
    include: {
      variants: {
        include: {
          _count: { select: { results: true } },
        },
      },
      _count: { select: { results: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return tests;
}

export async function createABTest(data: CreateABTestInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const validated = createABTestSchema.parse(data);

  const test = await prisma.aBTest.create({
    data: {
      tenantId: user.tenantId,
      name: validated.name,
      algorithm: validated.algorithm,
      funnelId: validated.funnelId ?? null,
      variants: {
        create: validated.variants.map((v) => ({
          name: v.name,
          weight: v.weight,
          pageId: v.pageId ?? null,
        })),
      },
    },
    include: { variants: true },
  });

  revalidatePath('/automation/ab-tests');
  return test;
}

export async function updateABTest(
  id: string,
  data: { name?: string; algorithm?: ABTestAlgorithm }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const test = await prisma.aBTest.update({
    where: { id, tenantId: user.tenantId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.algorithm !== undefined && { algorithm: data.algorithm }),
    },
  });

  revalidatePath('/automation/ab-tests');
  return test;
}

export async function startABTest(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const test = await prisma.aBTest.update({
    where: { id, tenantId: user.tenantId },
    data: {
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  revalidatePath('/automation/ab-tests');
  return test;
}

export async function endABTest(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const test = await prisma.aBTest.update({
    where: { id, tenantId: user.tenantId },
    data: {
      status: 'COMPLETED',
      endedAt: new Date(),
    },
  });

  revalidatePath('/automation/ab-tests');
  return test;
}

export async function deleteABTest(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.aBTest.delete({
    where: { id, tenantId: user.tenantId },
  });

  revalidatePath('/automation/ab-tests');
}

export async function getABTestResults(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const test = await prisma.aBTest.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      variants: {
        include: { results: { orderBy: { date: 'asc' } } },
      },
    },
  });

  if (!test) return null;

  const variantStats = test.variants.map((variant) => {
    const totalImpressions = variant.results.reduce((s, r) => s + r.impressions, 0);
    const totalConversions = variant.results.reduce((s, r) => s + r.conversions, 0);
    const conversionRate = totalImpressions > 0
      ? (totalConversions / totalImpressions) * 100
      : 0;

    return {
      ...variant,
      totalImpressions,
      totalConversions,
      conversionRate,
    };
  });

  const winner = variantStats.reduce((best, current) =>
    current.conversionRate > best.conversionRate ? current : best,
    variantStats[0]
  );

  return { test, variantStats, winner };
}

export async function recordABTestImpression(variantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.aBTestResult.upsert({
    where: {
      id: `${variantId}_${today.toISOString().slice(0, 10)}`,
    },
    update: {
      impressions: { increment: 1 },
    },
    create: {
      id: `${variantId}_${today.toISOString().slice(0, 10)}`,
      testId: (await prisma.aBTestVariant.findUniqueOrThrow({
        where: { id: variantId },
        select: { testId: true },
      })).testId,
      variantId,
      impressions: 1,
      conversions: 0,
      date: today,
    },
  });
}
