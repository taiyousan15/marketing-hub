"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

// バリデーションスキーマ
const contactSchema = z.object({
  name: z.string().min(1, "名前は必須です").max(100),
  email: z.string().email("有効なメールアドレスを入力してください").optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  lineUserId: z.string().max(50).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

const tagSchema = z.object({
  name: z.string().min(1, "タグ名は必須です").max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "有効な色コードを入力してください").optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

/**
 * コンタクト一覧取得
 */
export async function getContacts(options?: {
  search?: string;
  tagId?: string;
  limit?: number;
  offset?: number;
}) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("認証が必要です");
  }

  const { search, tagId, limit = 50, offset = 0 } = options || {};

  const where: {
    tenantId: string;
    OR?: Array<{ name?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" } }>;
    tags?: { some: { tagId: string } };
  } = {
    tenantId: user.tenantId,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (tagId) {
    where.tags = { some: { tagId } };
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.contact.count({ where }),
  ]);

  return {
    contacts: contacts.map((c) => ({
      ...c,
      tags: c.tags.map((t) => t.tag),
    })),
    total,
    hasMore: offset + contacts.length < total,
  };
}

/**
 * コンタクト詳細取得
 */
export async function getContact(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("認証が必要です");
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id,
      tenantId: user.tenantId,
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
      messageHistories: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!contact) {
    return null;
  }

  return {
    ...contact,
    tags: contact.tags.map((t) => t.tag),
  };
}

/**
 * コンタクト作成
 */
export async function createContact(data: ContactFormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("認証が必要です");
  }

  const validated = contactSchema.parse(data);

  // 重複チェック
  if (validated.email) {
    const existing = await prisma.contact.findFirst({
      where: {
        tenantId: user.tenantId,
        email: validated.email,
      },
    });
    if (existing) {
      throw new Error("このメールアドレスは既に登録されています");
    }
  }

  const contact = await prisma.contact.create({
    data: {
      tenantId: user.tenantId,
      ...validated,
    },
  });

  revalidatePath("/contacts");
  return contact;
}

/**
 * コンタクト更新
 */
export async function updateContact(id: string, data: Partial<ContactFormData>) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("認証が必要です");
  }

  const validated = contactSchema.partial().parse(data);

  // 重複チェック（メール変更時）
  if (validated.email) {
    const existing = await prisma.contact.findFirst({
      where: {
        tenantId: user.tenantId,
        email: validated.email,
        NOT: { id },
      },
    });
    if (existing) {
      throw new Error("このメールアドレスは既に登録されています");
    }
  }

  const contact = await prisma.contact.update({
    where: {
      id,
      tenantId: user.tenantId,
    },
    data: validated,
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  return contact;
}

/**
 * コンタクト削除
 */
export async function deleteContact(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("認証が必要です");
  }

  await prisma.contact.delete({
    where: {
      id,
      tenantId: user.tenantId,
    },
  });

  revalidatePath("/contacts");
}

/**
 * タグ一覧取得
 */
export async function getTags() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("認証が必要です");
  }

  return prisma.tag.findMany({
    where: { tenantId: user.tenantId },
    include: {
      _count: {
        select: { contacts: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * タグ作成
 */
export async function createTag(data: { name: string; color?: string }) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("認証が必要です");
  }

  const validated = tagSchema.parse(data);

  const tag = await prisma.tag.create({
    data: {
      tenantId: user.tenantId,
      ...validated,
      color: validated.color || "#6366f1",
    },
  });

  revalidatePath("/contacts");
  revalidatePath("/tags");
  return tag;
}

/**
 * コンタクトにタグを追加
 */
export async function addTagToContact(contactId: string, tagId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("認証が必要です");
  }

  // コンタクトとタグの所属確認
  const [contact, tag] = await Promise.all([
    prisma.contact.findFirst({ where: { id: contactId, tenantId: user.tenantId } }),
    prisma.tag.findFirst({ where: { id: tagId, tenantId: user.tenantId } }),
  ]);

  if (!contact || !tag) {
    throw new Error("コンタクトまたはタグが見つかりません");
  }

  await prisma.contactTag.upsert({
    where: {
      contactId_tagId: { contactId, tagId },
    },
    create: { contactId, tagId },
    update: {},
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
}

/**
 * コンタクトからタグを削除
 */
export async function removeTagFromContact(contactId: string, tagId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("認証が必要です");
  }

  await prisma.contactTag.delete({
    where: {
      contactId_tagId: { contactId, tagId },
    },
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
}
