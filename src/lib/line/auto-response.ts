import { replyMessage } from "@/lib/line/client";

interface AutoResponseRule {
  id: string;
  keyword: string;
  matchType: "exact" | "contains" | "startsWith";
  replyMessage: string;
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
    // 自動応答ルールを取得（将来的にDBから取得）
    const rules = await getAutoResponseRules(tenantId);

    const matchedRule = findMatchingRule(rules, messageText);

    if (!matchedRule) {
      return;
    }

    // 自動応答メッセージを送信
    await replyMessage(replyToken, [
      {
        type: "text",
        text: matchedRule.replyMessage,
      },
    ]);

    // 自動応答ログを記録（将来実装）
    await logAutoResponse(tenantId, contactId, matchedRule.id, messageText);
  } catch (error) {
    // 自動応答のエラーはメイン処理に影響させない
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
    }
  }
  return null;
}

async function getAutoResponseRules(
  _tenantId: string
): Promise<AutoResponseRule[]> {
  // TODO: 将来的にDBのAutoResponseRuleテーブルから取得
  return [];
}

async function logAutoResponse(
  _tenantId: string,
  _contactId: string,
  _ruleId: string,
  _messageText: string
): Promise<void> {
  // TODO: 将来的にDBにログを保存
}
