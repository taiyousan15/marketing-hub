/**
 * AIトリガーエンジン
 * ユーザー行動を検出し、適切なアクションを決定する
 */

import { claude, isAIConfigured } from "./claude";

// トリガータイプの定義
export type TriggerType =
  | "LINE_FRIEND_ADDED"
  | "EMAIL_SUBSCRIBED"
  | "PAGE_VIEWED"
  | "PRODUCT_VIEWED"
  | "CART_ABANDONED"
  | "PURCHASE_COMPLETED"
  | "MESSAGE_OPENED"
  | "LINK_CLICKED"
  | "FORM_SUBMITTED"
  | "TAG_ADDED"
  | "SCORE_CHANGED"
  | "INACTIVE_DAYS";

// トリガーイベントの定義
export interface TriggerEvent {
  type: TriggerType;
  contactId: string;
  tenantId: string;
  data: Record<string, unknown>;
  timestamp: Date;
  metadata?: {
    source?: string;
    sessionId?: string;
    deviceType?: string;
    location?: string;
  };
}

// トリガー条件の定義
export interface TriggerCondition {
  id: string;
  name: string;
  type: TriggerType;
  conditions: {
    field: string;
    operator: "equals" | "contains" | "greater_than" | "less_than" | "in" | "not_in";
    value: unknown;
  }[];
  logicalOperator: "AND" | "OR";
}

// アクションの定義
export interface TriggerAction {
  type: "SEND_LINE" | "SEND_EMAIL" | "ADD_TAG" | "REMOVE_TAG" | "UPDATE_SCORE" | "START_SEQUENCE" | "STOP_SEQUENCE" | "NOTIFY_OPERATOR" | "WEBHOOK";
  config: Record<string, unknown>;
  delay?: {
    value: number;
    unit: "minutes" | "hours" | "days";
  };
}

// 自動化ルールの定義
export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggers: TriggerCondition[];
  actions: TriggerAction[];
  aiAssisted: boolean;
  aiConfig?: {
    analyzeBehavior: boolean;
    personalizeMessage: boolean;
    predictBestTime: boolean;
    suggestNextAction: boolean;
  };
}

// トリガー評価結果
export interface TriggerEvaluationResult {
  triggered: boolean;
  matchedRules: AutomationRule[];
  suggestedActions: TriggerAction[];
  aiInsights?: {
    sentiment?: string;
    intent?: string;
    urgency?: "low" | "medium" | "high";
    recommendedApproach?: string;
  };
}

/**
 * トリガー条件を評価する
 */
export function evaluateCondition(
  event: TriggerEvent,
  condition: TriggerCondition
): boolean {
  if (event.type !== condition.type) {
    return false;
  }

  const results = condition.conditions.map((cond) => {
    const value = getNestedValue(event.data, cond.field);

    switch (cond.operator) {
      case "equals":
        return value === cond.value;
      case "contains":
        return String(value).includes(String(cond.value));
      case "greater_than":
        return Number(value) > Number(cond.value);
      case "less_than":
        return Number(value) < Number(cond.value);
      case "in":
        return Array.isArray(cond.value) && cond.value.includes(value);
      case "not_in":
        return Array.isArray(cond.value) && !cond.value.includes(value);
      default:
        return false;
    }
  });

  return condition.logicalOperator === "AND"
    ? results.every(Boolean)
    : results.some(Boolean);
}

/**
 * ネストされたオブジェクトから値を取得
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current: unknown, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * AIを使用してトリガーイベントを分析
 */
export async function analyzeEventWithAI(
  event: TriggerEvent,
  contactHistory: Array<{ type: string; timestamp: Date; data?: unknown }>
): Promise<{
  intent: string;
  sentiment: string;
  urgency: "low" | "medium" | "high";
  recommendedApproach: string;
  suggestedMessage?: string;
}> {
  if (!isAIConfigured) {
    return {
      intent: "unknown",
      sentiment: "neutral",
      urgency: "medium",
      recommendedApproach: "標準的なフォローアップを行う",
    };
  }

  const prompt = `
以下のユーザー行動データを分析し、マーケティング自動化の観点から評価してください。

【現在のイベント】
タイプ: ${event.type}
データ: ${JSON.stringify(event.data)}
日時: ${event.timestamp.toISOString()}

【過去の行動履歴（最新10件）】
${contactHistory.slice(0, 10).map((h) => `- ${h.type} (${h.timestamp.toISOString()})`).join("\n")}

以下のJSON形式で回答してください：
{
  "intent": "ユーザーの意図（例: 購入検討、情報収集、サポート要求など）",
  "sentiment": "感情状態（positive/neutral/negative）",
  "urgency": "緊急度（low/medium/high）",
  "recommendedApproach": "推奨アプローチ（日本語で具体的に）",
  "suggestedMessage": "送信すべきメッセージの提案（日本語、任意）"
}
`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.error("AI analysis error:", error);
  }

  return {
    intent: "unknown",
    sentiment: "neutral",
    urgency: "medium",
    recommendedApproach: "標準的なフォローアップを行う",
  };
}

/**
 * 自動化ルールを評価してアクションを決定
 */
export async function evaluateTriggers(
  event: TriggerEvent,
  rules: AutomationRule[],
  contactHistory?: Array<{ type: string; timestamp: Date; data?: unknown }>
): Promise<TriggerEvaluationResult> {
  const matchedRules: AutomationRule[] = [];
  const suggestedActions: TriggerAction[] = [];

  // 各ルールを評価
  for (const rule of rules) {
    if (!rule.isActive) continue;

    const triggered = rule.triggers.some((trigger) =>
      evaluateCondition(event, trigger)
    );

    if (triggered) {
      matchedRules.push(rule);
      suggestedActions.push(...rule.actions);
    }
  }

  // AI分析を実行（AIアシスト有効なルールがある場合）
  let aiInsights: TriggerEvaluationResult["aiInsights"];

  if (matchedRules.some((r) => r.aiAssisted) && contactHistory) {
    const analysis = await analyzeEventWithAI(event, contactHistory);
    aiInsights = {
      sentiment: analysis.sentiment,
      intent: analysis.intent,
      urgency: analysis.urgency,
      recommendedApproach: analysis.recommendedApproach,
    };
  }

  return {
    triggered: matchedRules.length > 0,
    matchedRules,
    suggestedActions,
    aiInsights,
  };
}

/**
 * AIを使用してメッセージをパーソナライズ
 */
export async function personalizeMessage(
  templateMessage: string,
  contactData: {
    name?: string;
    email?: string;
    tags?: string[];
    score?: number;
    lastPurchase?: Date;
    totalPurchases?: number;
  },
  context?: {
    triggerType: TriggerType;
    productName?: string;
    campaignName?: string;
  }
): Promise<string> {
  if (!isAIConfigured) {
    // 基本的な変数置換のみ
    return templateMessage
      .replace(/\{\{name\}\}/g, contactData.name || "お客様")
      .replace(/\{\{email\}\}/g, contactData.email || "");
  }

  const prompt = `
以下のメッセージテンプレートを、顧客データに基づいてパーソナライズしてください。
自然な日本語で、親しみやすいトーンを維持してください。

【テンプレート】
${templateMessage}

【顧客データ】
- 名前: ${contactData.name || "不明"}
- タグ: ${contactData.tags?.join(", ") || "なし"}
- スコア: ${contactData.score || 0}
- 最終購入日: ${contactData.lastPurchase?.toLocaleDateString("ja-JP") || "未購入"}
- 購入回数: ${contactData.totalPurchases || 0}

【コンテキスト】
- トリガー: ${context?.triggerType || "不明"}
- 商品名: ${context?.productName || "なし"}
- キャンペーン: ${context?.campaignName || "なし"}

パーソナライズされたメッセージのみを返してください。
`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      return content.text.trim();
    }
  } catch (error) {
    console.error("Message personalization error:", error);
  }

  // フォールバック: 基本的な変数置換
  return templateMessage
    .replace(/\{\{name\}\}/g, contactData.name || "お客様")
    .replace(/\{\{email\}\}/g, contactData.email || "");
}

/**
 * 最適な送信時間を予測
 */
export async function predictBestSendTime(
  contactHistory: Array<{
    type: string;
    timestamp: Date;
    opened?: boolean;
    clicked?: boolean;
  }>
): Promise<{
  recommendedHour: number;
  recommendedDayOfWeek: number;
  confidence: number;
  reasoning: string;
}> {
  // 開封・クリックされたメッセージの時間帯を分析
  const engagedMessages = contactHistory.filter((h) => h.opened || h.clicked);

  if (engagedMessages.length < 3) {
    // データ不足時のデフォルト
    return {
      recommendedHour: 12,
      recommendedDayOfWeek: 2, // 火曜日
      confidence: 0.3,
      reasoning: "データ不足のため、一般的に効果が高い時間帯を推奨",
    };
  }

  // 時間帯ごとのエンゲージメント率を計算
  const hourCounts: Record<number, number> = {};
  const dayCounts: Record<number, number> = {};

  for (const msg of engagedMessages) {
    const hour = msg.timestamp.getHours();
    const day = msg.timestamp.getDay();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }

  // 最もエンゲージメントが高い時間帯と曜日を特定
  const bestHour = Object.entries(hourCounts).sort(
    ([, a], [, b]) => b - a
  )[0];
  const bestDay = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0];

  return {
    recommendedHour: parseInt(bestHour[0]),
    recommendedDayOfWeek: parseInt(bestDay[0]),
    confidence: Math.min(engagedMessages.length / 10, 1),
    reasoning: `過去${engagedMessages.length}件のエンゲージメントデータに基づく推奨`,
  };
}

// ==================== Class-based API for Testing ====================

/**
 * Trigger for class-based API (compatible with tests)
 */
export interface Trigger {
  id: string;
  name: string;
  type: TriggerType;
  enabled: boolean;
  conditions: Array<{
    field: string;
    operator: "gt" | "lt" | "eq" | "contains" | "in";
    value: unknown;
  }>;
  actions: Array<{
    type: string;
    template?: string;
    delay?: number;
  }>;
}

/**
 * TriggerEngine Class - Object-oriented wrapper for functional API
 *
 * This class provides a stateful, object-oriented interface for trigger management,
 * making it compatible with class-based tests while maintaining the underlying
 * functional implementation.
 */
export class TriggerEngine {
  private triggers: Map<string, Trigger> = new Map();
  private executionStats: Map<string, { executionCount: number; successCount: number }> = new Map();

  /**
   * Register a new trigger
   */
  registerTrigger(trigger: Trigger): void {
    this.triggers.set(trigger.id, trigger);
    this.executionStats.set(trigger.id, { executionCount: 0, successCount: 0 });
  }

  /**
   * Get all triggers
   */
  getTriggers(): Trigger[] {
    return Array.from(this.triggers.values());
  }

  /**
   * Disable a trigger
   */
  disableTrigger(triggerId: string): void {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.enabled = false;
    }
  }

  /**
   * Remove a trigger
   */
  removeTrigger(triggerId: string): void {
    this.triggers.delete(triggerId);
    this.executionStats.delete(triggerId);
  }

  /**
   * Process an event against all registered triggers
   */
  async processEvent(event: TriggerEvent): Promise<Array<{
    triggerId: string;
    triggered: boolean;
    aiAnalysis?: unknown;
    personalizedContent?: string;
    optimizedSendTime?: unknown;
  }>> {
    const results = [];

    for (const trigger of this.triggers.values()) {
      if (!trigger.enabled) {
        results.push({ triggerId: trigger.id, triggered: false });
        continue;
      }

      // Convert test trigger format to TriggerCondition format
      const condition: TriggerCondition = {
        id: trigger.id,
        name: trigger.name,
        type: trigger.type,
        conditions: trigger.conditions.map(c => ({
          field: c.field,
          operator: this.mapOperator(c.operator),
          value: c.value,
        })),
        logicalOperator: "AND",
      };

      const triggered = evaluateCondition(event, condition);

      const stats = this.executionStats.get(trigger.id)!;
      stats.executionCount++;
      if (triggered) {
        stats.successCount++;
      }

      results.push({ triggerId: trigger.id, triggered });
    }

    return results;
  }

  /**
   * Evaluate a single condition
   */
  evaluateCondition(
    condition: { field: string; operator: string; value: unknown },
    data: Record<string, unknown>
  ): boolean {
    const value = data[condition.field];

    switch (condition.operator) {
      case "gt":
        return Number(value) > Number(condition.value);
      case "lt":
        return Number(value) < Number(condition.value);
      case "eq":
        return value === condition.value;
      case "contains":
        if (Array.isArray(value)) {
          return value.includes(condition.value);
        }
        return String(value).includes(String(condition.value));
      case "in":
        return Array.isArray(condition.value) && condition.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * Get execution statistics for a trigger
   */
  getStats(triggerId: string): { executionCount: number; successRate: number } {
    const stats = this.executionStats.get(triggerId);
    if (!stats) {
      return { executionCount: 0, successRate: 0 };
    }

    return {
      executionCount: stats.executionCount,
      successRate: stats.executionCount > 0 ? stats.successCount / stats.executionCount : 0,
    };
  }

  private mapOperator(op: string): "equals" | "contains" | "greater_than" | "less_than" | "in" | "not_in" {
    const mapping: Record<string, "equals" | "contains" | "greater_than" | "less_than" | "in" | "not_in"> = {
      eq: "equals",
      gt: "greater_than",
      lt: "less_than",
      contains: "contains",
      in: "in",
    };
    return mapping[op] || "equals";
  }
}
