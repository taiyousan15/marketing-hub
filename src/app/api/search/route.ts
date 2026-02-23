import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/tenant';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const tenantId = user.tenantId;

    const [contacts, campaigns, funnels, forms, products] = await Promise.all([
      prisma.contact.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, email: true },
        take: 5,
      }),
      prisma.campaign.findMany({
        where: {
          tenantId,
          name: { contains: q, mode: 'insensitive' },
        },
        select: { id: true, name: true, status: true },
        take: 5,
      }),
      prisma.funnel.findMany({
        where: {
          tenantId,
          name: { contains: q, mode: 'insensitive' },
        },
        select: { id: true, name: true },
        take: 5,
      }),
      prisma.form.findMany({
        where: {
          tenantId,
          name: { contains: q, mode: 'insensitive' },
        },
        select: { id: true, name: true },
        take: 5,
      }),
      prisma.product.findMany({
        where: {
          tenantId,
          name: { contains: q, mode: 'insensitive' },
        },
        select: { id: true, name: true, price: true },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      results: {
        contacts: contacts.map((c) => ({
          id: c.id,
          label: c.name ?? c.email ?? c.id,
          description: c.email,
          href: `/contacts/${c.id}`,
          type: 'contact' as const,
        })),
        campaigns: campaigns.map((c) => ({
          id: c.id,
          label: c.name,
          description: c.status,
          href: `/campaigns/${c.id}/edit`,
          type: 'campaign' as const,
        })),
        funnels: funnels.map((f) => ({
          id: f.id,
          label: f.name,
          href: `/funnels/${f.id}`,
          type: 'funnel' as const,
        })),
        forms: forms.map((f) => ({
          id: f.id,
          label: f.name,
          href: `/forms/${f.id}`,
          type: 'form' as const,
        })),
        products: products.map((p) => ({
          id: p.id,
          label: p.name,
          description: `¥${p.price.toLocaleString()}`,
          href: `/products/${p.id}`,
          type: 'product' as const,
        })),
      },
    });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
