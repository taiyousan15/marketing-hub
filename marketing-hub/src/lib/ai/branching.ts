/**
 * AI分岐ロジックエンジン
 * ユーザー行動に基づいてステップメッセージの分岐を自動決定
 */

import { claude, isAIConfigured } from "./claude";
import type { ScoreResult } from "./scoring";
import type { RFMScore, RFMSegment } from "../analytics/rfm";

// 分岐条件の定義
export type BranchConditionType =
  | "SCORE_THRESHOLD"
  | "TAG_PRESENT"
  | "TAG_ABSENT"
  | "ACTION_TAKEN"
  | "ACTION_NOT_TAKEN"
  | "TIME_ELAPSED"
  | "RFM_SEGMENT"
  | "AI_DECISION"
  | "RANDOM_SPLIT";

// 分岐条件
export interface BranchCondition {
  type: BranchConditionType;
  config: {
    // SCORE_THRESHOLD
    scoreType?: "lead" | "engagement" | "churn";
    threshold?: number;
    comparison?: "greater" | "less" | "equal";

    // TAG_PRESENT / TAG_ABSENT
    tagId?: string;
    tagName?: string;

    // ACTION_TAKEN / ACTION_NOT_TAKEN
    actionType?: string;
    withinDays?: number;

    // TIME_ELAPSED
    days?: number;
    hours?: number;

    // RFM_SEGMENT
    segments?: RFMSegment[];

    // RANDOM_SPLIT
    percentage?: number;

    // AI_DECISION
    aiPrompt?: string;
  };
}

// 分岐ノード
export interface BranchNode {
  id: string;
  name: string;
  conditions: BranchCondition[];
  logicalOperator: "AND" | "OR";
  nextNodeId?: string;
  actions: BranchAction[];
}

// 分岐アクション
export interface BranchAction {
  type:
    | "SEND_MESSAGE"
    | "ADD_TAG"
    | "REMOVE_TAG"
    | "UPDATE_SCORE"
    | "WAIT"
    | "END_SEQUENCE"
    | "JUMP_TO_NODE"
    | "NOTIFY";
  config: {
    messageTemplateId?: string;
    channel?: "LINE" | "EMAIL";
    tagId?: string;
    scoreChange?: number;
    waitDays?: number;
    waitHours?: number;
    nodeId?: string;
    notificationMessage?: string;
  };
}

// シーケンス定義
export interface Sequence {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: string;
    conditions?: BranchCondition[];
  };
  nodes: BranchNode[];
  startNodeId: string;
  isActive: boolean;
  aiEnabled: boolean;
}

// コンタクトコンテキスト
export interface ContactContext {
  contactId: string;
  tags: string[];
  score: ScoreResult;
  rfm?: RFMScore;
  recentActions: Array<{
    type: string;
    timestamp: Date;
    data?: Record<string, unknown>;
  }>;
  currentSequence?: {
    sequenceId: string;
    currentNodeId: string;
    startedAt: Date;
  };
  metadata?: Record<string, unknown>;
}

/**
 * 分岐条件を評価
 */
export function evaluateBranchCondition(
  condition: BranchCondition,
  context: ContactContext
): boolean {
  switch (condition.type) {
    case "SCORE_THRESHOLD": {
      const { scoreType, threshold, comparison } = condition.config;
      if (!scoreType || threshold === undefined || !comparison) return false;

      let score: number;
      switch (scoreType) {
        case "lead":
          score = context.score.leadScore;
          break;
        case "engagement":
          score = context.score.engagementScore;
          break;
        case "churn":
          score = context.score.churnScore;
          break;
        default:
          return false;
      }

      switch (comparison) {
        case "greater":
          return score > threshold;
        case "less":
          return score < threshold;
        case "equal":
          return score === threshold;
        default:
          return false;
      }
    }

    case "TAG_PRESENT": {
      const { tagId, tagName } = condition.config;
      if (tagId) return context.tags.includes(tagId);
      if (tagName) return context.tags.some((t) => t.toLowerCase() === tagName.toLowerCase());
      return false;
    }

    case "TAG_ABSENT": {
      const { tagId, tagName } = condition.config;
      if (tagId) return !context.tags.includes(tagId);
      if (tagName) return !context.tags.some((t) => t.toLowerCase() === tagName.toLowerCase());
      return true;
    }

    case "ACTION_TAKEN": {
      const { actionType, withinDays } = condition.config;
      if (!actionType) return false;

      const cutoffDate = new Date();
      if (withinDays) {
        cutoffDate.setDate(cutoffDate.getDate() - withinDays);
      } else {
        cutoffDate.setFullYear(2000); // 全期間
      }

      return context.recentActions.some(
        (a) => a.type === actionType && a.timestamp >= cutoffDate
      );
    }

    case "ACTION_NOT_TAKEN": {
      const { actionType, withinDays } = condition.config;
      if (!actionType) return true;

      const cutoffDate = new Date();
      if (withinDays) {
        cutoffDate.setDate(cutoffDate.getDate() - withinDays);
      } else {
        cutoffDate.setFullYear(2000);
      }

      return !context.recentActions.some(
        (a) => a.type === actionType && a.timestamp >= cutoffDate
      );
    }

    case "TIME_ELAPSED": {
      if (!context.currentSequence) return false;

      const { days, hours } = condition.config;
      const elapsedMs = Date.now() - context.currentSequence.startedAt.getTime();
      const elapsedHours = elapsedMs / (1000 * 60 * 60);

      const requiredHours = (days || 0) * 24 + (hours || 0);
      return elapsedHours >= requiredHours;
    }

    case "RFM_SEGMENT": {
      const { segments } = condition.config;
      if (!segments || !context.rfm) return false;
      return segments.includes(context.rfm.segment);
    }

    case "RANDOM_SPLIT": {
      const { percentage } = condition.config;
      if (percentage === undefined) return false;
      return Math.random() * 100 < percentage;
    }

    case "AI_DECISION":
      // AI決定は非同期で別途処理
      return true;

    default:
      return false;
  }
}

/**
 * 複数の分岐条件を評価
 */
export function evaluateBranchConditions(
  conditions: BranchCondition[],
  logicalOperator: "AND" | "OR",
  context: ContactContext
): boolean {
  const results = conditions.map((c) => evaluateBranchCondition(c, context));

  if (logicalOperator === "AND") {
    return results.every(Boolean);
  }
  return results.some(Boolean);
}

/**
 * 次に実行すべきノードを決定
 */
export function determineNextNode(
  currentNode: BranchNode,
  allNodes: BranchNode[],
  context: ContactContext
): BranchNode | null {
  // 現在のノードの条件を評価
  const conditionsMet = evaluateBranchConditions(
    currentNode.conditions,
    currentNode.logicalOperator,
    context
  );

  if (!conditionsMet) {
    return null;
  }

  // 次のノードを取得
  if (currentNode.nextNodeId) {
    return allNodes.find((n) => n.id === currentNode.nextNodeId) || null;
  }

  return null;
}

/**
 * AIを使用して最適な分岐を決定
 */
export async function determineAIBranch(
  availableBranches: Array<{ id: string; name: string; description?: string }>,
  context: ContactContext,
  additionalPrompt?: string
): Promise<{
  selectedBranchId: string;
  confidence: number;
  reasoning: string;
}> {
  if (!isAIConfigured || availableBranches.length === 0) {
    return {
      selectedBranchId: availableBranches[0]?.id || "",
      confidence: 0.5,
      reasoning: "AI未設定のためデフォルト分岐を選択",
    };
  }

  const prompt = `
マーケティングオートメーションの分岐を決定してください。

【顧客状態】
- リードスコア: ${context.score.leadScore}/100
- エンゲージメントスコア: ${context.score.engagementScore}/100
- 離脱リスク: ${context.score.churnScore}%
- ティア: ${context.score.tier}
- タグ: ${context.tags.join(", ") || "なし"}
${context.rfm ? `- RFMセグメント: ${context.rfm.segment}` : ""}

【最近のアクション】
${context.recentActions
  .slice(0, 5)
  .map((a) => `- ${a.type} (${a.timestamp.toLocaleDateString("ja-JP")})`)
  .join("\n")}

【選択可能な分岐】
${availableBranches
  .map((b, i) => `${i + 1}. ${b.name}${b.description ? `: ${b.description}` : ""}`)
  .join("\n")}

${additionalPrompt ? `【追加条件】\n${additionalPrompt}` : ""}

以下のJSON形式で回答してください：
{
  "selectedBranchId": "選択した分岐のID",
  "confidence": 0.0〜1.0の信頼度,
  "reasoning": "選択理由（日本語で簡潔に）"
}
`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        // IDの検証
        const validBranch = availableBranches.find(
          (b) => b.id === result.selectedBranchId || b.name === result.selectedBranchId
        );
        if (validBranch) {
          return {
            selectedBranchId: validBranch.id,
            confidence: result.confidence,
            reasoning: result.reasoning,
          };
        }
      }
    }
  } catch (error) {
    console.error("AI branch decision error:", error);
  }

  return {
    selectedBranchId: availableBranches[0].id,
    confidence: 0.5,
    reasoning: "AI分析に失敗したためデフォルト分岐を選択",
  };
}

/**
 * AIを使用してメッセージコンテンツを動的に生成
 */
export async function generateDynamicContent(
  templateContent: string,
  context: ContactContext,
  purpose: "nurturing" | "sales" | "retention" | "reengagement"
): Promise<string> {
  if (!isAIConfigured) {
    return templateContent;
  }

  const purposeInstructions: Record<string, string> = {
    nurturing: "顧客との関係構築を目的として、役立つ情報を提供",
    sales: "購入を促進するため、商品の魅力と緊急性を伝える",
    retention: "既存顧客を維持するため、感謝と特典を伝える",
    reengagement: "休眠顧客を呼び戻すため、新しい価値を提案",
  };

  const prompt = `
以下のメッセージテンプレートを顧客に合わせてパーソナライズしてください。

【目的】
${purposeInstructions[purpose]}

【テンプレート】
${templateContent}

【顧客情報】
- ティア: ${context.score.tier}
- リードスコア: ${context.score.leadScore}
- タグ: ${context.tags.join(", ") || "なし"}
${context.rfm ? `- セグメント: ${context.rfm.segment}` : ""}

【注意事項】
- 自然な日本語で
- LINEメッセージとして適切な長さ（200文字程度）
- 絵文字は控えめに

パーソナライズされたメッセージのみを返してください。
`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      return content.text.trim();
    }
  } catch (error) {
    console.error("Dynamic content generation error:", error);
  }

  return templateContent;
}

/**
 * シーケンス実行計画を生成
 */
export interface ExecutionPlan {
  actions: Array<{
    action: BranchAction;
    scheduledAt: Date;
    nodeId: string;
  }>;
  estimatedEndDate: Date;
  totalMessages: number;
}

export function generateExecutionPlan(
  sequence: Sequence,
  context: ContactContext,
  startDate: Date = new Date()
): ExecutionPlan {
  const actions: ExecutionPlan["actions"] = [];
  let currentDate = new Date(startDate);
  let currentNode = sequence.nodes.find((n) => n.id === sequence.startNodeId);
  const visitedNodes = new Set<string>();

  while (currentNode && !visitedNodes.has(currentNode.id)) {
    visitedNodes.add(currentNode.id);

    // 条件を評価
    const conditionsMet = evaluateBranchConditions(
      currentNode.conditions,
      currentNode.logicalOperator,
      context
    );

    if (conditionsMet) {
      for (const action of currentNode.actions) {
        // WAITアクションの場合は日時を進める
        if (action.type === "WAIT") {
          const days = action.config.waitDays || 0;
          const hours = action.config.waitHours || 0;
          currentDate = new Date(
            currentDate.getTime() + (days * 24 + hours) * 60 * 60 * 1000
          );
        } else {
          actions.push({
            action,
            scheduledAt: new Date(currentDate),
            nodeId: currentNode.id,
          });
        }
      }

      // 次のノードへ
      if (currentNode.nextNodeId) {
        currentNode = sequence.nodes.find((n) => n.id === currentNode!.nextNodeId);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  const messageActions = actions.filter(
    (a) => a.action.type === "SEND_MESSAGE"
  );

  return {
    actions,
    estimatedEndDate: currentDate,
    totalMessages: messageActions.length,
  };
}

/**
 * A/Bテストの分岐を管理
 */
export interface ABTestConfig {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    name: string;
    percentage: number;
    nodeId: string;
  }>;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  metrics: {
    conversions: Record<string, number>;
    clicks: Record<string, number>;
    opens: Record<string, number>;
  };
}

export function selectABTestVariant(
  test: ABTestConfig,
  contactId: string
): string {
  // コンタクトIDを使用して一貫した分岐を選択（同じユーザーは常に同じ分岐）
  const hash = Array.from(contactId + test.id).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  );
  const randomValue = (hash % 100) + Math.random() * 0.01;

  let cumulative = 0;
  for (const variant of test.variants) {
    cumulative += variant.percentage;
    if (randomValue < cumulative) {
      return variant.id;
    }
  }

  return test.variants[0].id;
}
