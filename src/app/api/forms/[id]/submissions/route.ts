import { NextRequest, NextResponse } from 'next/server';
import { getFormSubmissions } from '@/actions/forms';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    const data = await getFormSubmissions(id, page, limit);
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/forms/[id]/submissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
