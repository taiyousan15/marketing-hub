import { NextRequest, NextResponse } from 'next/server';
import { updateDeal, deleteDeal } from '@/actions/pipeline';

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
