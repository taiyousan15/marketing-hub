import { NextRequest, NextResponse } from 'next/server';
import { getCampaignExecutions } from '@/actions/campaign-execution';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') ?? '1');
    const limit = Number(searchParams.get('limit') ?? '50');

    const result = await getCampaignExecutions(id, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/campaigns/[id]/executions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}
