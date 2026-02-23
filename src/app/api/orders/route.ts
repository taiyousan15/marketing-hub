import { NextRequest, NextResponse } from 'next/server';
import { getOrders, getOrderStats } from '@/actions/orders';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') ?? '1');
    const limit = Number(searchParams.get('limit') ?? '50');
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      const stats = await getOrderStats();
      return NextResponse.json(stats);
    }

    const result = await getOrders(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
