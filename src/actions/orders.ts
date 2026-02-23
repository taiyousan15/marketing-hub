'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/tenant';
import { stripe, createCheckoutSession, createRefund } from '@/lib/stripe/client';

export async function getOrders(page = 1, limit = 50) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { tenantId: user.tenantId },
      include: {
        product: { select: { id: true, name: true, type: true } },
        contact: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where: { tenantId: user.tenantId } }),
  ]);

  return { orders, total, page, limit };
}

export async function getOrder(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  return prisma.order.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      product: true,
      contact: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
}

export async function initiateCheckout(data: {
  productId: string;
  contactId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const product = await prisma.product.findFirst({
    where: { id: data.productId, tenantId: user.tenantId, isActive: true },
  });
  if (!product) throw new Error('Product not found');

  if (!product.stripePriceId) {
    throw new Error('Stripe Price が未設定です。商品のStripe連携を確認してください。');
  }

  const contact = await prisma.contact.findFirst({
    where: { id: data.contactId, tenantId: user.tenantId },
  });
  if (!contact) throw new Error('Contact not found');

  // Stripe顧客をfindOrCreate
  let stripeCustomerId: string | undefined;
  if (stripe && contact.email) {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
      if (tenant?.stripeCustomerId) {
        stripeCustomerId = tenant.stripeCustomerId;
      } else {
        const customer = await stripe.customers.create({
          email: contact.email,
          name: contact.name ?? undefined,
          metadata: { tenantId: user.tenantId, contactId: contact.id },
        });
        stripeCustomerId = customer.id;
      }
    } catch (error) {
      console.error('Stripe customer creation failed:', error);
    }
  }

  // Order(PENDING) 作成
  const order = await prisma.order.create({
    data: {
      tenantId: user.tenantId,
      contactId: data.contactId,
      productId: data.productId,
      amount: product.price,
      currency: product.currency,
      status: 'PENDING',
    },
  });

  // Checkout Session 作成
  const session = await createCheckoutSession({
    customerId: stripeCustomerId,
    priceId: product.stripePriceId,
    successUrl: data.successUrl,
    cancelUrl: data.cancelUrl,
    mode: product.type === 'SUBSCRIPTION' ? 'subscription' : 'payment',
    metadata: {
      orderId: order.id,
      tenantId: user.tenantId,
      contactId: data.contactId,
      productId: data.productId,
    },
  });

  // Payment Intent ID 保存
  if (typeof session.payment_intent === 'string') {
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: session.payment_intent },
    });
  }

  revalidatePath('/orders');
  return { checkoutUrl: session.url, orderId: order.id };
}

export async function processRefund(
  orderId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId: user.tenantId },
  });
  if (!order) throw new Error('Order not found');

  if (order.status !== 'COMPLETED') {
    throw new Error('完了済みの注文のみ返金可能です');
  }

  if (!order.stripePaymentIntentId) {
    throw new Error('Stripe Payment Intent が見つかりません');
  }

  const refund = await createRefund({
    paymentIntentId: order.stripePaymentIntentId,
    amount: amount ?? undefined,
    reason: reason ?? 'requested_by_customer',
  });

  const newStatus = amount && amount < order.amount ? 'PARTIALLY_REFUNDED' : 'REFUNDED';

  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  revalidatePath('/orders');
  return { refundId: refund.id, status: newStatus };
}

export async function getOrderStats() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const [totalOrders, totalRevenue, completedOrders] = await Promise.all([
    prisma.order.count({ where: { tenantId: user.tenantId } }),
    prisma.order.aggregate({
      where: { tenantId: user.tenantId, status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.order.count({ where: { tenantId: user.tenantId, status: 'COMPLETED' } }),
  ]);

  return {
    totalOrders,
    completedOrders,
    totalRevenue: totalRevenue._sum.amount ?? 0,
  };
}
