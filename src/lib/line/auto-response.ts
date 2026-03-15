import { replyMessage } from "@/lib/line/client";
import { prisma } from "@/lib/db/prisma";
import { Message } from "@line/bot-sdk";

interface AutoResponseRule {
  id: string;
  keyword: string;
  matchType: "exact" | "contains" | "startsWith" | "regex";
  replyType: "text" | "flex" | "image" | "video" | "sticker";
  replyContent: {
    text?: string;
    altText?: string;
    contents?: unknown;
    originalContentUrl?: string;
    previewImageUrl?: string;
    packageId?: string;
    stickerId?: string;
  };
}

/**
 * LINEメッセージに対して自動応答を処理する
 */
export async function processAutoResponse(
  tenantId: string,
  replyToken: string,
  messageText: string,
  contactId: string
): Promise<void> {
  try {
    const rules = await getAutoResponseRules(tenantId);
    const matchedRule = findMatchingRule(rules, messageText);

    if (!matchedRule) {
      return;
    }

    const messages = buildReplyMessages(matchedRule);
    if (messages.length > 0) {
      await replyMessage(replyToken, messages);
    }

    await logAutoResponse(tenantId, contactId, matchedRule.id, messageText);
  } catch (error) {
    console.error("Auto-response processing error:", error);
  }
}

function findMatchingRule(
  rules: AutoResponseRule[],
  text: string
): AutoResponseRule | null {
  for (const rule of rules) {
    const lowerText = text.toLowerCase();
    const lowerKeyword = rule.keyword.toLowerCase();

    switch (rule.matchType) {
      case "exact":
        if (lowerText === lowerKeyword) return rule;
        break;
      case "contains":
        if (lowerText.includes(lowerKeyword)) return rule;
        break;
      case "startsWith":
        if (lowerText.startsWith(lowerKeyword)) return rule;
        break;
      case "regex":
        try {
          const regex = new RegExp(rule.keyword, "i");
          if (regex.test(text)) return rule;
        } catch {
          // Invalid regex pattern, skip
        }
        break;
    }
  }
  return null;
}

function buildReplyMessages(rule: AutoResponseRule): Message[] {
  const { replyType, replyContent } = rule;

  switch (replyType) {
    case "text":
      if (replyContent.text) {
        return [{ type: "text", text: replyContent.text }];
      }
      break;
    case "flex":
      if (replyContent.contents) {
        return [{
          type: "flex",
          altText: replyContent.altText || "メッセージ",
          contents: replyContent.contents as import("@line/bot-sdk").FlexContainer,
        }];
      }
      break;
    case "image":
      if (replyContent.originalContentUrl) {
        return [{
          type: "image",
          originalContentUrl: replyContent.originalContentUrl,
          previewImageUrl: replyContent.previewImageUrl || replyContent.originalContentUrl,
        }];
      }
      break;
    case "video":
      if (replyContent.originalContentUrl && replyContent.previewImageUrl) {
        return [{
          type: "video",
          originalContentUrl: replyContent.originalContentUrl,
          previewImageUrl: replyContent.previewImageUrl,
        }];
      }
      break;
    case "sticker":
      if (replyContent.packageId && replyContent.stickerId) {
        return [{
          type: "sticker",
          packageId: replyContent.packageId,
          stickerId: replyContent.stickerId,
        }];
      }
      break;
  }

  return [];
}

async function getAutoResponseRules(
  tenantId: string
): Promise<AutoResponseRule[]> {
  const rules = await prisma.lineAutoReply.findMany({
    where: { tenantId, isActive: true },
    orderBy: { priority: "desc" },
  });

  return rules.map((rule) => ({
    id: rule.id,
    keyword: rule.keyword,
    matchType: rule.matchType as AutoResponseRule["matchType"],
    replyType: rule.replyType as AutoResponseRule["replyType"],
    replyContent: rule.replyContent as AutoResponseRule["replyContent"],
  }));
}

async function logAutoResponse(
  tenantId: string,
  contactId: string,
  ruleId: string,
  messageText: string
): Promise<void> {
  try {
    await prisma.messageHistory.create({
      data: {
        tenantId,
        contactId,
        channel: "LINE",
        direction: "OUTBOUND",
        content: JSON.stringify({ autoReplyRuleId: ruleId, triggerMessage: messageText }),
        senderType: "SYSTEM",
        status: "SENT",
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error logging auto-response:", error);
  }
}
