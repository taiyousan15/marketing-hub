import { NextRequest, NextResponse } from 'next/server';
import { getPipelines, createPipeline } from '@/actions/pipeline';

export async function GET() {
  try {
    const pipelines = await getPipelines();
    return NextResponse.json({ pipelines });
  } catch (error) {
    console.error('GET /api/pipeline error:', error);
    return NextResponse.json({ error: 'Failed to fetch pipelines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pipeline = await createPipeline({ name: body.name });
    return NextResponse.json({ pipeline }, { status: 201 });
  } catch (error) {
    console.error('POST /api/pipeline error:', error);
    return NextResponse.json({ error: 'Failed to create pipeline' }, { status: 500 });
  }
}
