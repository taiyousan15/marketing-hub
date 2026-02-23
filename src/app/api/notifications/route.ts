import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/tenant';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ notifications: [] });
    }

    const tenantId = user.tenantId;

    // 最新の注文、フォーム送信、新規コンタクトから通知を生成
    const [recentOrders, recentSubmissions, recentContacts] = await Promise.all([
      prisma.order.findMany({
        where: { tenantId },
        include: {
          product: { select: { name: true } },
          contact: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.formSubmission.findMany({
        where: { form: { tenantId } },
        include: {
          form: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.contact.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
    ]);

    const notifications = [
      ...recentOrders.map((order) => ({
        id: `order-${order.id}`,
        type: 'order' as const,
        title: '新規注文',
        description: `${order.contact.name ?? order.contact.email} が ${order.product.name} を購入`,
        createdAt: order.createdAt.toISOString(),
        read: false,
      })),
      ...recentSubmissions.map((sub) => ({
        id: `form-${sub.id}`,
        type: 'form_submission' as const,
        title: 'フォーム送信',
        description: `${sub.form.name} に新しい送信がありました`,
        createdAt: sub.createdAt.toISOString(),
        read: false,
      })),
      ...recentContacts.map((c) => ({
        id: `contact-${c.id}`,
        type: 'contact' as const,
        title: '新規コンタクト',
        description: c.name ?? c.email ?? '名前なし',
        createdAt: c.createdAt.toISOString(),
        read: false,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ notifications: [] });
  }
}
