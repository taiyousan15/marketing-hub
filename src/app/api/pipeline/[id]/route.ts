import { NextRequest, NextResponse } from 'next/server';
import { updateDeal, deleteDeal } from '@/actions/pipeline';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/tenant';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const deal = await prisma.deal.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        stage: true,
        contact: { select: { id: true, name: true, email: true } },
        pipeline: {
          select: {
            id: true,
            name: true,
            stages: { orderBy: { order: 'asc' }, select: { id: true, name: true, color: true } },
          },
        },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

    return NextResponse.json({ deal });
  } catch (error) {
    console.error('GET /api/pipeline/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const deal = await updateDeal(id, body);
    return NextResponse.json({ deal });
  } catch (error) {
    console.error('PATCH /api/pipeline/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDeal(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/pipeline/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
  }
}
