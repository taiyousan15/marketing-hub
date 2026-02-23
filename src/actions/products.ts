'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/tenant';
import { stripe } from '@/lib/stripe/client';
import type { ProductType, RecurringInterval } from '@prisma/client';

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().int().min(0),
  currency: z.string().default('JPY'),
  type: z.enum(['ONE_TIME', 'SUBSCRIPTION']).default('ONE_TIME'),
  recurringInterval: z.enum(['MONTHLY', 'YEARLY']).optional().nullable(),
  courseId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  price: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  courseId: z.string().optional().nullable(),
});

export async function getProducts() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  return prisma.product.findMany({
    where: { tenantId: user.tenantId },
    include: {
      _count: { select: { orders: true, subscriptions: true } },
      course: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProduct(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  return prisma.product.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      _count: { select: { orders: true, subscriptions: true } },
      course: { select: { id: true, name: true } },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { contact: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

export async function createProduct(data: z.infer<typeof createProductSchema>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const validated = createProductSchema.parse(data);

  // Stripe Product/Price 作成 (Stripeが設定されている場合のみ)
  let stripeProductId: string | null = null;
  let stripePriceId: string | null = null;

  if (stripe) {
    try {
      const stripeProduct = await stripe.products.create({
        name: validated.name,
        description: validated.description ?? undefined,
        metadata: { tenantId: user.tenantId },
      });
      stripeProductId = stripeProduct.id;

      const recurring =
        validated.type === 'SUBSCRIPTION' && validated.recurringInterval
          ? { interval: (validated.recurringInterval === 'YEARLY' ? 'year' : 'month') as 'year' | 'month' }
          : undefined;

      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        currency: validated.currency.toLowerCase(),
        unit_amount: validated.price,
        metadata: { tenantId: user.tenantId },
        ...(recurring ? { recurring } : {}),
      });
      stripePriceId = stripePrice.id;
    } catch (error) {
      console.error('Stripe product creation failed:', error);
      // Stripeエラーでも DB には保存する（後で同期可能）
    }
  }

  const product = await prisma.product.create({
    data: {
      tenantId: user.tenantId,
      name: validated.name,
      description: validated.description ?? null,
      price: validated.price,
      currency: validated.currency,
      type: validated.type as ProductType,
      recurringInterval: validated.recurringInterval as RecurringInterval | null,
      courseId: validated.courseId ?? null,
      isActive: validated.isActive,
      stripeProductId,
      stripePriceId,
    },
  });

  revalidatePath('/products');
  return product;
}

export async function updateProduct(id: string, data: z.infer<typeof updateProductSchema>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const validated = updateProductSchema.parse(data);

  const existing = await prisma.product.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!existing) throw new Error('Product not found');

  // Stripe側も更新 (名前変更のみ)
  if (stripe && existing.stripeProductId && validated.name) {
    try {
      await stripe.products.update(existing.stripeProductId, {
        name: validated.name,
      });
    } catch (error) {
      console.error('Stripe product update failed:', error);
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.description !== undefined && { description: validated.description }),
      ...(validated.price !== undefined && { price: validated.price }),
      ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      ...(validated.courseId !== undefined && { courseId: validated.courseId }),
    },
  });

  revalidatePath('/products');
  return product;
}

export async function deleteProduct(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const existing = await prisma.product.findFirst({
    where: { id, tenantId: user.tenantId },
    include: { _count: { select: { orders: true } } },
  });
  if (!existing) throw new Error('Product not found');

  // 注文が存在する場合は非アクティブ化のみ
  if (existing._count.orders > 0) {
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  } else {
    // Stripe側もアーカイブ
    if (stripe && existing.stripeProductId) {
      try {
        await stripe.products.update(existing.stripeProductId, { active: false });
      } catch (error) {
        console.error('Stripe product archive failed:', error);
      }
    }
    await prisma.product.delete({ where: { id } });
  }

  revalidatePath('/products');
}
