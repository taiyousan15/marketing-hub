import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { multicastMessage } from "@/lib/line/client";
import { Message, TextMessage, FlexMessage } from "@line/bot-sdk";

function getTenantId(request: NextRequest): string | null {
  return request.headers.get("x-tenant-id") || null;
}

interface SegmentCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "in" | "has_tag" | "not_has_tag";
  value: string | number | string[];
}

interface SegmentFilter {
  conditions: SegmentCondition[];
  logic: "AND" | "OR";
}

// POST: Send LINE message to contacts matching segment conditions
export async function POST(request: NextRequest) {
  const tenantId = getTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filter, messageType, messageContent } = body as {
      filter: SegmentFilter;
      messageType: "text" | "flex";
      messageContent: { text?: string; altText?: string; contents?: unknown };
    };

    if (!filter || !messageType || !messageContent) {
      return NextResponse.json(
        { error: "filter, messageType, and messageContent are required" },
        { status: 400 }
      );
    }

    const contacts = await findContactsBySegment(tenantId, filter);

    const lineUserIds = contacts
      .map((c) => c.lineUserId)
      .filter((id): id is string => id !== null);

    if (lineUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { sent: 0, message: "No matching contacts found" },
      });
    }

    const messages: Message[] = [];
    if (messageType === "text" && messageContent.text) {
      messages.push({ type: "text", text: messageContent.text } as TextMessage);
    } else if (messageType === "flex" && messageContent.contents) {
      messages.push({
        type: "flex",
        altText: messageContent.altText || "メッセージ",
        contents: messageContent.contents,
      } as FlexMessage);
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid message content" },
        { status: 400 }
      );
    }

    // Send in batches of 500 (LINE API limit)
    const batchSize = 500;
    let totalSent = 0;

    for (let i = 0; i < lineUserIds.length; i += batchSize) {
      const batch = lineUserIds.slice(i, i + batchSize);
      await multicastMessage(batch, messages);
      totalSent += batch.length;
    }

    // Record message history for each contact
    const historyData = contacts
      .filter((c) => c.lineUserId)
      .map((c) => ({
        tenantId,
        contactId: c.id,
        channel: "LINE" as const,
        direction: "OUTBOUND" as const,
        content: JSON.stringify(messageContent),
        senderType: "SYSTEM" as const,
        status: "SENT" as const,
        sentAt: new Date(),
      }));

    if (historyData.length > 0) {
      await prisma.messageHistory.createMany({ data: historyData });
    }

    return NextResponse.json({
      success: true,
      data: {
        sent: totalSent,
        total: lineUserIds.length,
        message: `Message sent to ${totalSent} contacts`,
      },
    });
  } catch (error) {
    console.error("Error sending segment message:", error);
    return NextResponse.json(
      { error: "Failed to send segment message" },
      { status: 500 }
    );
  }
}

async function findContactsBySegment(
  tenantId: string,
  filter: SegmentFilter
): Promise<Array<{ id: string; lineUserId: string | null; tags: Array<{ tag: { name: string } }> }>> {
  const baseWhere: Record<string, unknown> = {
    tenantId,
    lineUserId: { not: null },
    lineOptIn: true,
  };

  const tagConditions: Array<{ tagName: string; has: boolean }> = [];
  const fieldConditions: Array<Record<string, unknown>> = [];

  for (const condition of filter.conditions) {
    if (condition.operator === "has_tag") {
      tagConditions.push({ tagName: String(condition.value), has: true });
    } else if (condition.operator === "not_has_tag") {
      tagConditions.push({ tagName: String(condition.value), has: false });
    } else {
      const prismaCondition = buildPrismaCondition(condition);
      if (prismaCondition) {
        fieldConditions.push(prismaCondition);
      }
    }
  }

  if (fieldConditions.length > 0) {
    if (filter.logic === "OR") {
      baseWhere.OR = fieldConditions;
    } else {
      baseWhere.AND = fieldConditions;
    }
  }

  const contacts = await prisma.contact.findMany({
    where: baseWhere,
    select: {
      id: true,
      lineUserId: true,
      tags: { include: { tag: true } },
    },
  });

  if (tagConditions.length === 0) {
    return contacts;
  }

  // Filter by tag conditions in-memory
  return contacts.filter((contact) => {
    const contactTagNames = contact.tags.map((t) => t.tag.name);
    return tagConditions.every((tc) => {
      const hasTag = contactTagNames.includes(tc.tagName);
      return tc.has ? hasTag : !hasTag;
    });
  });
}

function buildPrismaCondition(
  condition: SegmentCondition
): Record<string, unknown> | null {
  const { field, operator, value } = condition;

  switch (operator) {
    case "equals":
      return { [field]: value };
    case "not_equals":
      return { [field]: { not: value } };
    case "contains":
      return { [field]: { contains: String(value), mode: "insensitive" } };
    case "greater_than":
      return { [field]: { gt: Number(value) } };
    case "less_than":
      return { [field]: { lt: Number(value) } };
    case "in":
      return { [field]: { in: Array.isArray(value) ? value : [value] } };
    default:
      return null;
  }
}
