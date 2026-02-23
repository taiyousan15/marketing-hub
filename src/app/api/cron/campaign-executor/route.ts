import { NextResponse } from 'next/server';
import { executeCampaigns } from '@/actions/campaign-execution';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  // Vercel Cron認証チェック
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await executeCampaigns();

    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
    const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

    return NextResponse.json({
      ok: true,
      campaigns: results.length,
      totalProcessed,
      totalSent,
      totalFailed,
      details: results,
    });
  } catch (error) {
    console.error('Campaign executor cron error:', error);
    return NextResponse.json(
      { error: 'Campaign execution failed' },
      { status: 500 }
    );
  }
}
