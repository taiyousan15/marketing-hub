import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const form = await prisma.form.findUnique({
      where: { id },
      include: { fields: { orderBy: { order: 'asc' } } },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (form.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Form is not published' }, { status: 403 });
    }

    const body = await request.json();

    const schemaShape: Record<string, z.ZodTypeAny> = {};
    for (const field of form.fields) {
      let fieldSchema: z.ZodTypeAny = z.string();
      if (field.type === 'email') fieldSchema = z.string().email();
      if (field.type === 'date') fieldSchema = z.string();
      if (field.type === 'checkbox') fieldSchema = z.union([z.boolean(), z.array(z.string())]);
      if (!field.required) fieldSchema = fieldSchema.optional();
      schemaShape[field.id] = fieldSchema;
    }

    const schema = z.object(schemaShape);
    const validated = schema.parse(body.data ?? body);

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ??
      request.headers.get('x-real-ip') ??
      null;

    const submission = await prisma.formSubmission.create({
      data: {
        formId: id,
        data: validated as unknown as Prisma.InputJsonValue,
        ipAddress,
      },
    });

    const emailField = form.fields.find((f) => f.type === 'email');
    if (emailField && typeof validated[emailField.id] === 'string') {
      const email = validated[emailField.id] as string;
      const nameField = form.fields.find(
        (f) => f.type === 'text' && f.label.toLowerCase().includes('name')
      );
      const name = nameField ? (validated[nameField.id] as string | undefined) : undefined;

      const existingContact = await prisma.contact.findFirst({
        where: { tenantId: form.tenantId, email },
      });

      if (!existingContact) {
        await prisma.contact.create({
          data: {
            tenantId: form.tenantId,
            email,
            name: name ?? null,
            source: 'FORM',
            sourceDetail: { formId: id, formName: form.name },
          },
        });
      }
    }

    return NextResponse.json({ success: true, submissionId: submission.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('POST /api/forms/[id]/submit error:', error);
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
  }
}
