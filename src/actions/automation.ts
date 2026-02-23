import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Execute pending automations (called by cron)
// ---------------------------------------------------------------------------

export async function executePendingAutomations() {
  const pendingExecutions = await prisma.automationExecution.findMany({
    where: { status: "PENDING" },
    include: {
      rule: {
        include: {
          actions: { orderBy: { order: "asc" } },
        },
      },
    },
    take: 50,
    orderBy: { triggeredAt: "asc" },
  });

  const results: Array<{
    executionId: string;
    status: "COMPLETED" | "FAILED";
    error?: string;
  }> = [];

  for (const execution of pendingExecutions) {
    try {
      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: { status: "IN_PROGRESS" },
      });

      for (const action of execution.rule.actions) {
        await executeAction(action, execution.contactId);
      }

      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      results.push({ executionId: execution.id, status: "COMPLETED" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: "FAILED",
          errorMessage,
          completedAt: new Date(),
        },
      });

      results.push({
        executionId: execution.id,
        status: "FAILED",
        error: errorMessage,
      });
    }
  }

  return {
    processed: results.length,
    completed: results.filter((r) => r.status === "COMPLETED").length,
    failed: results.filter((r) => r.status === "FAILED").length,
    details: results,
  };
}

// ---------------------------------------------------------------------------
// Action executor
// ---------------------------------------------------------------------------

interface ActionRecord {
  type: string;
  config: unknown;
}

async function executeAction(action: ActionRecord, contactId: string) {
  const config = (action.config ?? {}) as Record<string, unknown>;

  switch (action.type) {
    case "ADD_TAG": {
      const tagName = config.tagName as string | undefined;
      if (!tagName) break;
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { tenantId: true },
      });
      if (!contact) break;
      const tag = await prisma.tag.findFirst({
        where: { tenantId: contact.tenantId, name: tagName },
      });
      if (tag) {
        await prisma.contactTag.upsert({
          where: {
            contactId_tagId: { contactId, tagId: tag.id },
          },
          create: { contactId, tagId: tag.id },
          update: {},
        });
      }
      break;
    }

    case "REMOVE_TAG": {
      const tagName = config.tagName as string | undefined;
      if (!tagName) break;
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { tenantId: true },
      });
      if (!contact) break;
      const tag = await prisma.tag.findFirst({
        where: { tenantId: contact.tenantId, name: tagName },
      });
      if (tag) {
        await prisma.contactTag.deleteMany({
          where: { contactId, tagId: tag.id },
        });
      }
      break;
    }

    case "UPDATE_SCORE": {
      const scoreChange = (config.scoreChange as number) ?? 0;
      const existing = await prisma.contactScore.findUnique({
        where: { contactId },
      });
      if (existing) {
        await prisma.contactScore.update({
          where: { contactId },
          data: { totalScore: existing.totalScore + scoreChange },
        });
      }
      break;
    }

    case "WEBHOOK": {
      const url = config.url as string | undefined;
      if (!url) break;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          actionType: action.type,
          config,
          timestamp: new Date().toISOString(),
        }),
      });
      break;
    }

    case "SEND_EMAIL":
    case "SEND_LINE_MESSAGE":
    case "AI_GENERATE_MESSAGE":
    case "NOTIFY_OPERATOR":
    case "START_SEQUENCE":
    case "STOP_SEQUENCE":
    case "MOVE_TO_SEGMENT":
      // These actions require external service integration.
      // Log and skip for now — will be wired to step-delivery engine.
      break;

    default:
      break;
  }
}
