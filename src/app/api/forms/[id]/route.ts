import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const form = await prisma.form.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      fields: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          type: true,
          label: true,
          placeholder: true,
          required: true,
          options: true,
          order: true,
        },
      },
    },
  });

  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  }

  return NextResponse.json(form);
}
