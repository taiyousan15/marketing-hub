'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma, JourneyStatus, JourneyNodeType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/tenant';

const nodeDataSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(JourneyNodeType),
  label: z.string(),
  positionX: z.number(),
  positionY: z.number(),
  config: z.record(z.string(), z.unknown()).default({}),
});

const edgeDataSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  label: z.string().optional().nullable(),
});

export async function getJourneys() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const journeys = await prisma.journey.findMany({
    where: { tenantId: user.tenantId },
    include: {
      _count: { select: { nodes: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return journeys;
}

export async function createJourney(data: { name: string; description?: string }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const journey = await prisma.journey.create({
    data: {
      tenantId: user.tenantId,
      name: data.name,
      description: data.description ?? null,
      nodes: {
        create: [
          {
            type: 'TRIGGER',
            label: 'トリガー',
            positionX: 250,
            positionY: 50,
            config: {},
          },
        ],
      },
    },
    include: {
      nodes: true,
      edges: true,
    },
  });

  revalidatePath('/automation/journeys');
  return journey;
}

export async function getJourney(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const journey = await prisma.journey.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      nodes: true,
      edges: true,
    },
  });

  return journey;
}

export async function updateJourneyNodes(
  journeyId: string,
  nodes: z.infer<typeof nodeDataSchema>[],
  edges: z.infer<typeof edgeDataSchema>[]
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const validatedNodes = z.array(nodeDataSchema).parse(nodes);
  const validatedEdges = z.array(edgeDataSchema).parse(edges);

  await prisma.$transaction(async (tx) => {
    await tx.journeyEdge.deleteMany({ where: { journeyId } });
    await tx.journeyNode.deleteMany({ where: { journeyId } });

    const journey = await tx.journey.findFirst({
      where: { id: journeyId, tenantId: user.tenantId },
    });
    if (!journey) throw new Error('Journey not found');

    const nodeIdMap = new Map<string, string>();

    for (const node of validatedNodes) {
      const created = await tx.journeyNode.create({
        data: {
          id: node.id,
          journeyId,
          type: node.type,
          label: node.label,
          positionX: node.positionX,
          positionY: node.positionY,
          config: node.config as unknown as Prisma.InputJsonValue,
        },
      });
      nodeIdMap.set(node.id, created.id);
    }

    for (const edge of validatedEdges) {
      await tx.journeyEdge.create({
        data: {
          id: edge.id,
          journeyId,
          sourceId: edge.sourceId,
          targetId: edge.targetId,
          label: edge.label ?? null,
        },
      });
    }
  });

  revalidatePath(`/automation/journeys/${journeyId}`);
}

export async function updateJourneyStatus(id: string, status: JourneyStatus) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const journey = await prisma.journey.update({
    where: { id, tenantId: user.tenantId },
    data: { status },
  });

  revalidatePath('/automation/journeys');
  revalidatePath(`/automation/journeys/${id}`);
  return journey;
}

export async function deleteJourney(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.journey.delete({
    where: { id, tenantId: user.tenantId },
  });

  revalidatePath('/automation/journeys');
}
