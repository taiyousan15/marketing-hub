'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/tenant';

const formFieldSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'radio', 'date']),
  label: z.string().min(1),
  placeholder: z.string().optional().nullable(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional().nullable(),
  order: z.number().int().min(0),
});

export async function getForms() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const forms = await prisma.form.findMany({
    where: { tenantId: user.tenantId },
    include: {
      _count: { select: { submissions: true, fields: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return forms;
}

export async function getForm(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const form = await prisma.form.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      fields: { orderBy: { order: 'asc' } },
      _count: { select: { submissions: true } },
    },
  });

  return form;
}

export async function createForm(data: { name: string; description?: string }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const form = await prisma.form.create({
    data: {
      tenantId: user.tenantId,
      name: data.name,
      description: data.description ?? null,
    },
  });

  revalidatePath('/forms');
  return form;
}

export async function updateFormFields(
  formId: string,
  fields: z.infer<typeof formFieldSchema>[]
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const form = await prisma.form.findFirst({
    where: { id: formId, tenantId: user.tenantId },
  });
  if (!form) throw new Error('Form not found');

  const validatedFields = z.array(formFieldSchema).parse(fields);

  await prisma.$transaction(async (tx) => {
    await tx.formField.deleteMany({ where: { formId } });

    for (const field of validatedFields) {
      await tx.formField.create({
        data: {
          formId,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder ?? null,
          required: field.required,
          options: (field.options as Prisma.InputJsonValue) ?? Prisma.DbNull,
          order: field.order,
        },
      });
    }
  });

  revalidatePath(`/forms/${formId}`);
}

export async function updateFormMeta(
  id: string,
  data: { name?: string; description?: string }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const form = await prisma.form.update({
    where: { id, tenantId: user.tenantId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });

  revalidatePath(`/forms/${id}`);
  return form;
}

export async function publishForm(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const form = await prisma.form.update({
    where: { id, tenantId: user.tenantId },
    data: { status: 'PUBLISHED' },
  });

  revalidatePath(`/forms/${id}`);
  return form;
}

export async function unpublishForm(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const form = await prisma.form.update({
    where: { id, tenantId: user.tenantId },
    data: { status: 'DRAFT' },
  });

  revalidatePath(`/forms/${id}`);
  return form;
}

export async function deleteForm(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.form.delete({
    where: { id, tenantId: user.tenantId },
  });

  revalidatePath('/forms');
}

export async function getFormSubmissions(formId: string, page = 1, limit = 50) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const form = await prisma.form.findFirst({
    where: { id: formId, tenantId: user.tenantId },
  });
  if (!form) throw new Error('Form not found');

  const [submissions, total] = await Promise.all([
    prisma.formSubmission.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.formSubmission.count({ where: { formId } }),
  ]);

  return { submissions, total, page, limit };
}
