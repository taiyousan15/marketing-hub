import { NextRequest, NextResponse } from 'next/server';
import { getForms, createForm } from '@/actions/forms';

export async function GET() {
  try {
    const forms = await getForms();
    return NextResponse.json({ forms });
  } catch (error) {
    console.error('GET /api/forms error:', error);
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const form = await createForm({ name: body.name, description: body.description });
    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    console.error('POST /api/forms error:', error);
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
  }
}
