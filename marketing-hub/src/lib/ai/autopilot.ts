/**
 * Autopilot System - Marketing Automation AI
 *
 * 完全自動化されたマーケティングAIシステム
 * - リアルタイム意思決定
 * - 自動キャンペーン最適化
 * - 予測に基づく先行アクション
 * - 統合ダッシュボード制御
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  type IntentAnalysisResult,
  calculateIntentScoreFromMessage,
  calculateIntentScoreFromBehaviors,
  determineIntentLevel,
  decideBranch
} from "./intent-analyzer";
import {
  type SentimentAnalysisResult,
  analyzeWithKeywords,
  analyzeSentimentTrend
} from "./sentiment-analyzer";
import { type ContentType, type ContentTone } from "./content-generator";
import { type PredictionInput } from "./predictive-engine";
import { selectVariant, type ABTest } from "./ab-optimizer";

// 予測結果の型定義
export interface CustomerPrediction {
  conversionProbability: number;
  churnRisk: number;
  predictedLTV: number;
  bestSendTime: string;
  bestChannel: "email" | "line" | "sms" | "push";
  nextBestAction: string;
}

// Autopilot設定
export interface AutopilotConfig {
  enabled: boolean;
  mode: "conservative" | "balanced" | "aggressive";
  automationLevel: "suggest" | "semi_auto" | "full_auto";
  budgetLimits: {
    dailyActions: number;
    monthlySpend: number;
  };
  priorityRules: PriorityRule[];
  safetyGuards: SafetyGuard[];
}

export interface PriorityRule {
  id: string;
  name: string;
  condition: {
    metric: string;
    operator: "gt" | "lt" | "eq" | "between";
    value: number | [number, number];
  };
  priority: 1 | 2 | 3 | 4 | 5;
  action: AutomatedAction;
}

export interface SafetyGuard {
  id: string;
  name: string;
  type: "rate_limit" | "budget_cap" | "approval_required" | "time_window";
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface AutomatedAction {
  type: "send_email" | "send_line" | "update_segment" | "trigger_workflow" |
        "adjust_ab_test" | "pause_campaign" | "escalate" | "notify";
  params: Record<string, unknown>;
}

// 意思決定ログ
export interface DecisionLog {
  id: string;
  timestamp: Date;
  trigger: string;
  analysis: {
    customerData: Record<string, unknown>;
    predictions: CustomerPrediction;
    sentiment?: SentimentAnalysisResult;
    intent?: IntentAnalysisResult;
  };
  decision: {
    action: AutomatedAction;
    reasoning: string;
    confidence: number;
    alternativeActions: AutomatedAction[];
  };
  status: "pending" | "approved" | "executed" | "rejected" | "failed";
  outcome?: {
    success: boolean;
    metrics: Record<string, number>;
    feedback?: string;
  };
}

// Autopilot状態
export interface AutopilotState {
  status: "running" | "paused" | "error";
  uptime: number; // 秒
  actionsToday: number;
  actionsPending: number;
  lastDecision?: DecisionLog;
  performance: {
    successRate: number;
    avgConfidence: number;
    totalActions: number;
  };
  alerts: AutopilotAlert[];
}

export interface AutopilotAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

// イベント型
export interface AutopilotEvent {
  type: "customer_action" | "threshold_breach" | "scheduled" | "external_trigger";
  source: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

// Autopilotメインクラス
export class AutopilotSystem {
  private anthropic: Anthropic;
  private config: AutopilotConfig;
  private state: AutopilotState;
  private decisionHistory: DecisionLog[] = [];
  private eventQueue: AutopilotEvent[] = [];

  constructor(config?: Partial<AutopilotConfig>) {
    this.anthropic = new Anthropic();

    this.config = {
      enabled: true,
      mode: "balanced",
      automationLevel: "semi_auto",
      budgetLimits: {
        dailyActions: 1000,
        monthlySpend: 100000
      },
      priorityRules: [],
      safetyGuards: [
        {
          id: "sg-1",
          name: "レート制限",
          type: "rate_limit",
          config: { maxPerHour: 100 },
          enabled: true
        },
        {
          id: "sg-2",
          name: "高額アクション承認",
          type: "approval_required",
          config: { thresholdAmount: 10000 },
          enabled: true
        }
      ],
      ...config
    };

    this.state = {
      status: "paused",
      uptime: 0,
      actionsToday: 0,
      actionsPending: 0,
      performance: {
        successRate: 0,
        avgConfidence: 0,
        totalActions: 0
      },
      alerts: []
    };
  }

  /**
   * Autopilotを開始
   */
  async start(): Promise<void> {
    this.state.status = "running";
    this.addAlert("info", "Autopilotシステムが開始されました");

    // イベントループを開始（実際の実装ではsetIntervalやWebSocket等を使用）
    console.log("Autopilot started");
  }

  /**
   * Autopilotを停止
   */
  async stop(): Promise<void> {
    this.state.status = "paused";
    this.addAlert("info", "Autopilotシステムが停止されました");
    console.log("Autopilot stopped");
  }

  /**
   * イベントを処理
   */
  async processEvent(event: AutopilotEvent): Promise<DecisionLog | null> {
    if (this.state.status !== "running") {
      console.log("Autopilot is not running, skipping event");
      return null;
    }

    // セーフティガードをチェック
    const guardViolation = this.checkSafetyGuards(event);
    if (guardViolation) {
      this.addAlert("warning", `セーフティガード発動: ${guardViolation}`);
      return null;
    }

    // 顧客データを収集
    const customerData = await this.gatherCustomerData(event);

    // 予測を実行（シンプルな予測ロジック）
    const predictions = this.generatePredictions(customerData);

    // 感情分析（メッセージがある場合）
    let sentiment: SentimentAnalysisResult | undefined;
    if (customerData.lastMessage) {
      const keywordAnalysis = analyzeWithKeywords(customerData.lastMessage as string);
      const sentimentType = keywordAnalysis.score > 60 ? "positive" : keywordAnalysis.score < 40 ? "negative" : "neutral";
      const message = customerData.lastMessage as string;

      sentiment = {
        sentiment: sentimentType,
        score: keywordAnalysis.score,
        confidence: 0.8,
        emotions: keywordAnalysis.emotions,
        churnSignal: {
          detected: keywordAnalysis.churnTriggers.length > 0,
          risk: keywordAnalysis.churnTriggers.length > 0
            ? keywordAnalysis.churnTriggers[0].risk
            : "low",
          triggers: keywordAnalysis.churnTriggers.map(t => t.trigger)
        },
        escalation: {
          recommended: keywordAnalysis.escalationTriggers.length > 0,
          reason: keywordAnalysis.escalationTriggers.length > 0
            ? keywordAnalysis.escalationTriggers[0].reason
            : undefined,
          priority: keywordAnalysis.escalationTriggers.length > 0
            ? keywordAnalysis.escalationTriggers[0].priority
            : "normal"
        },
        recommendedActions: keywordAnalysis.churnTriggers.length > 0
          ? ["フォローアップメールを送信", "カスタマーサクセスに通知"]
          : [],
        metadata: {
          analyzedAt: new Date(),
          messageLength: message.length,
          language: "ja"
        }
      };
    }

    // 購入意向分析
    let intent: IntentAnalysisResult | undefined;
    if (customerData.recentMessages) {
      const messages = customerData.recentMessages as string[];
      const lastMessage = messages[messages.length - 1] || "";
      const intentScore = calculateIntentScoreFromMessage(lastMessage);
      const intentLevel = determineIntentLevel(intentScore.score);

      intent = {
        purchaseIntent: {
          level: intentLevel,
          score: intentScore.score,
          confidence: 0.75,
          signals: intentScore.signals
        },
        barriers: {
          primary: null,
          secondary: [],
          details: ""
        },
        psychologyPhase: "product_aware",
        emotionalState: {
          sentiment: intentScore.score > 60 ? "positive" : intentScore.score < 40 ? "negative" : "neutral",
          emotions: intentScore.signals,
          urgency: intentScore.score > 70 ? "high" : intentScore.score > 40 ? "medium" : "low"
        },
        recommendedApproach: {
          strategy: intentLevel === "very_high" || intentLevel === "high"
            ? "クロージングに向けたアプローチ"
            : "ナーチャリング継続",
          messageType: intentLevel === "very_high" ? "offer" : "educational",
          keyPoints: intentScore.signals,
          avoidPoints: []
        },
        suggestedBranch: decideBranch({
          purchaseIntent: { level: intentLevel, score: intentScore.score, confidence: 0.75, signals: intentScore.signals },
          barriers: { primary: null, secondary: [], details: "" },
          psychologyPhase: "product_aware",
          emotionalState: { sentiment: "neutral", emotions: [], urgency: "medium" },
          recommendedApproach: { strategy: "", messageType: "", keyPoints: [], avoidPoints: [] },
          suggestedBranch: ""
        }).branchId
      };
    }

    // AI意思決定
    const decision = await this.makeDecision({
      event,
      customerData,
      predictions,
      sentiment,
      intent
    });

    // 意思決定ログを作成
    const decisionLog: DecisionLog = {
      id: `dec-${Date.now()}`,
      timestamp: new Date(),
      trigger: `${event.type}:${event.source}`,
      analysis: {
        customerData,
        predictions,
        sentiment,
        intent
      },
      decision,
      status: this.config.automationLevel === "full_auto" ? "executed" : "pending"
    };

    this.decisionHistory.push(decisionLog);
    this.state.lastDecision = decisionLog;
    this.state.actionsPending++;

    // 完全自動モードの場合は即座に実行
    if (this.config.automationLevel === "full_auto") {
      await this.executeAction(decisionLog);
    }

    return decisionLog;
  }

  /**
   * AI意思決定エンジン
   */
  private async makeDecision(context: {
    event: AutopilotEvent;
    customerData: Record<string, unknown>;
    predictions: CustomerPrediction;
    sentiment?: SentimentAnalysisResult;
    intent?: IntentAnalysisResult;
  }): Promise<{
    action: AutomatedAction;
    reasoning: string;
    confidence: number;
    alternativeActions: AutomatedAction[];
  }> {
    const systemPrompt = `あなたはマーケティングオートメーションの意思決定AIです。
顧客データ、予測結果、感情分析、購入意向分析に基づいて最適なアクションを決定してください。

現在のモード: ${this.config.mode}
自動化レベル: ${this.config.automationLevel}

以下の形式でJSONレスポンスを返してください:
{
  "action": {
    "type": "アクションタイプ",
    "params": { "パラメータ": "値" }
  },
  "reasoning": "決定の理由（日本語）",
  "confidence": 0.0-1.0の信頼度,
  "alternativeActions": [
    { "type": "代替アクションタイプ", "params": {} }
  ]
}

利用可能なアクションタイプ:
- send_email: メール送信
- send_line: LINE送信
- update_segment: セグメント更新
- trigger_workflow: ワークフロー開始
- adjust_ab_test: A/Bテスト調整
- pause_campaign: キャンペーン一時停止
- escalate: 人間にエスカレート
- notify: 通知送信`;

    const userPrompt = `以下のデータに基づいて最適なアクションを決定してください:

## イベント
タイプ: ${context.event.type}
ソース: ${context.event.source}
データ: ${JSON.stringify(context.event.data, null, 2)}

## 予測結果
コンバージョン確率: ${(context.predictions.conversionProbability * 100).toFixed(1)}%
チャーンリスク: ${(context.predictions.churnRisk * 100).toFixed(1)}%
予測LTV: ¥${context.predictions.predictedLTV.toLocaleString()}
推奨チャネル: ${context.predictions.bestChannel}
推奨送信時間: ${context.predictions.bestSendTime}
次のベストアクション: ${context.predictions.nextBestAction}

${context.sentiment ? `## 感情分析
感情: ${context.sentiment.sentiment} (スコア: ${context.sentiment.score})
検出された感情: ${context.sentiment.emotions.map(e => `${e.type}(${(e.intensity * 100).toFixed(0)}%)`).join(', ')}
チャーンリスク: ${context.sentiment.churnSignal?.risk || 'N/A'}
${context.sentiment.churnSignal?.triggers?.length ? `チャーントリガー: ${context.sentiment.churnSignal.triggers.join(', ')}` : ''}
` : ''}

${context.intent ? `## 購入意向分析
意向レベル: ${context.intent.purchaseIntent.level}
購入シグナル: ${context.intent.purchaseIntent.signals.join(', ')}
推奨アプローチ: ${context.intent.recommendedApproach.strategy}
推奨ブランチ: ${context.intent.suggestedBranch}
` : ''}

最適なアクションをJSON形式で返してください。`;

    const response = await this.anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        { role: "user", content: systemPrompt + "\n\n" + userPrompt }
      ]
    });

    // レスポンスからJSONを抽出
    const textContent = response.content.find(c => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return this.getDefaultDecision();
    }

    try {
      // JSONを抽出（コードブロックがある場合も対応）
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse AI decision:", e);
    }

    return this.getDefaultDecision();
  }

  /**
   * デフォルトの意思決定を返す
   */
  private getDefaultDecision(): {
    action: AutomatedAction;
    reasoning: string;
    confidence: number;
    alternativeActions: AutomatedAction[];
  } {
    return {
      action: {
        type: "notify",
        params: { message: "判断を保留しました。手動確認が必要です。" }
      },
      reasoning: "AI分析が完了できなかったため、手動確認を推奨します。",
      confidence: 0.3,
      alternativeActions: []
    };
  }

  /**
   * 予測を生成
   */
  private generatePredictions(customerData: Record<string, unknown>): CustomerPrediction {
    // シンプルな予測ロジック（実際の実装ではMLモデルを使用）
    const behaviors = (customerData.behaviors as Array<{ action: string }>) || [];
    const hasRecentPurchase = behaviors.some(b => b.action === "purchase");
    const hasCartActivity = behaviors.some(b => b.action === "add_to_cart");

    return {
      conversionProbability: hasCartActivity ? 0.65 : hasRecentPurchase ? 0.3 : 0.15,
      churnRisk: hasRecentPurchase ? 0.1 : 0.4,
      predictedLTV: hasRecentPurchase ? 85000 : 25000,
      bestSendTime: "10:00",
      bestChannel: "email",
      nextBestAction: hasCartActivity
        ? "カート放棄リマインドを送信"
        : hasRecentPurchase
        ? "クロスセル提案を送信"
        : "ナーチャリングメールを送信"
    };
  }

  /**
   * アクションを実行
   */
  async executeAction(decisionLog: DecisionLog): Promise<void> {
    try {
      const action = decisionLog.decision.action;

      switch (action.type) {
        case "send_email":
          await this.executeSendEmail(action.params);
          break;
        case "send_line":
          await this.executeSendLine(action.params);
          break;
        case "update_segment":
          await this.executeUpdateSegment(action.params);
          break;
        case "trigger_workflow":
          await this.executeTriggerWorkflow(action.params);
          break;
        case "adjust_ab_test":
          await this.executeAdjustABTest(action.params);
          break;
        case "pause_campaign":
          await this.executePauseCampaign(action.params);
          break;
        case "escalate":
          await this.executeEscalate(action.params);
          break;
        case "notify":
          await this.executeNotify(action.params);
          break;
      }

      decisionLog.status = "executed";
      decisionLog.outcome = {
        success: true,
        metrics: {},
        feedback: "アクションが正常に実行されました"
      };

      this.state.actionsToday++;
      this.state.actionsPending--;
      this.updatePerformanceMetrics(true);

    } catch (error) {
      decisionLog.status = "failed";
      decisionLog.outcome = {
        success: false,
        metrics: {},
        feedback: `エラー: ${error instanceof Error ? error.message : "Unknown error"}`
      };

      this.updatePerformanceMetrics(false);
      this.addAlert("critical", `アクション実行失敗: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // 各アクション実行メソッド
  private async executeSendEmail(params: Record<string, unknown>): Promise<void> {
    console.log("Executing: Send Email", params);
    // 実際のメール送信ロジック
  }

  private async executeSendLine(params: Record<string, unknown>): Promise<void> {
    console.log("Executing: Send LINE", params);
    // 実際のLINE送信ロジック
  }

  private async executeUpdateSegment(params: Record<string, unknown>): Promise<void> {
    console.log("Executing: Update Segment", params);
    // セグメント更新ロジック
  }

  private async executeTriggerWorkflow(params: Record<string, unknown>): Promise<void> {
    console.log("Executing: Trigger Workflow", params);
    // ワークフロー開始ロジック
  }

  private async executeAdjustABTest(params: Record<string, unknown>): Promise<void> {
    console.log("Executing: Adjust A/B Test", params);
    // A/Bテスト調整ロジック
  }

  private async executePauseCampaign(params: Record<string, unknown>): Promise<void> {
    console.log("Executing: Pause Campaign", params);
    // キャンペーン一時停止ロジック
  }

  private async executeEscalate(params: Record<string, unknown>): Promise<void> {
    console.log("Executing: Escalate", params);
    // エスカレーションロジック
    this.addAlert("warning", `エスカレーション: ${params.reason || "手動確認が必要です"}`);
  }

  private async executeNotify(params: Record<string, unknown>): Promise<void> {
    console.log("Executing: Notify", params);
    // 通知ロジック
  }

  /**
   * 顧客データを収集
   */
  private async gatherCustomerData(event: AutopilotEvent): Promise<Record<string, unknown>> {
    // 実際の実装ではデータベースやAPIから取得
    return {
      customerId: event.data.customerId || "unknown",
      email: event.data.email || "",
      name: event.data.name || "",
      lastMessage: event.data.message,
      recentMessages: event.data.messages || [],
      behaviors: event.data.behaviors || [],
      profile: event.data.profile || {},
      ...event.data
    };
  }

  /**
   * セーフティガードをチェック
   */
  private checkSafetyGuards(event: AutopilotEvent): string | null {
    for (const guard of this.config.safetyGuards) {
      if (!guard.enabled) continue;

      switch (guard.type) {
        case "rate_limit":
          const maxPerHour = guard.config.maxPerHour as number;
          if (this.getRecentActionsCount(60 * 60 * 1000) >= maxPerHour) {
            return `レート制限: 1時間あたり${maxPerHour}アクションを超過`;
          }
          break;

        case "budget_cap":
          if (this.state.actionsToday >= this.config.budgetLimits.dailyActions) {
            return `予算上限: 1日あたり${this.config.budgetLimits.dailyActions}アクションを超過`;
          }
          break;
      }
    }

    return null;
  }

  /**
   * 最近のアクション数を取得
   */
  private getRecentActionsCount(timeWindowMs: number): number {
    const cutoff = Date.now() - timeWindowMs;
    return this.decisionHistory.filter(
      d => d.timestamp.getTime() > cutoff && d.status === "executed"
    ).length;
  }

  /**
   * パフォーマンス指標を更新
   */
  private updatePerformanceMetrics(success: boolean): void {
    const executed = this.decisionHistory.filter(d => d.status === "executed" || d.status === "failed");
    const successful = executed.filter(d => d.outcome?.success);

    this.state.performance = {
      successRate: executed.length > 0 ? successful.length / executed.length : 0,
      avgConfidence: executed.length > 0
        ? executed.reduce((sum, d) => sum + d.decision.confidence, 0) / executed.length
        : 0,
      totalActions: executed.length
    };
  }

  /**
   * アラートを追加
   */
  private addAlert(severity: "info" | "warning" | "critical", message: string): void {
    this.state.alerts.unshift({
      id: `alert-${Date.now()}`,
      severity,
      message,
      timestamp: new Date(),
      acknowledged: false
    });

    // 最新100件のみ保持
    if (this.state.alerts.length > 100) {
      this.state.alerts = this.state.alerts.slice(0, 100);
    }
  }

  /**
   * 状態を取得
   */
  getState(): AutopilotState {
    return { ...this.state };
  }

  /**
   * 設定を取得
   */
  getConfig(): AutopilotConfig {
    return { ...this.config };
  }

  /**
   * 設定を更新
   */
  updateConfig(updates: Partial<AutopilotConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * 意思決定履歴を取得
   */
  getDecisionHistory(options: {
    limit?: number;
    status?: DecisionLog["status"];
  } = {}): DecisionLog[] {
    let history = [...this.decisionHistory];

    if (options.status) {
      history = history.filter(d => d.status === options.status);
    }

    if (options.limit) {
      history = history.slice(-options.limit);
    }

    return history;
  }

  /**
   * 保留中のアクションを承認
   */
  async approveAction(decisionId: string): Promise<boolean> {
    const decision = this.decisionHistory.find(d => d.id === decisionId);
    if (!decision || decision.status !== "pending") {
      return false;
    }

    decision.status = "approved";
    await this.executeAction(decision);
    return true;
  }

  /**
   * 保留中のアクションを拒否
   */
  rejectAction(decisionId: string, reason?: string): boolean {
    const decision = this.decisionHistory.find(d => d.id === decisionId);
    if (!decision || decision.status !== "pending") {
      return false;
    }

    decision.status = "rejected";
    decision.outcome = {
      success: false,
      metrics: {},
      feedback: reason || "手動で拒否されました"
    };

    this.state.actionsPending--;
    return true;
  }

  /**
   * ダッシュボード用サマリーを取得
   */
  getDashboardSummary(): {
    status: AutopilotState["status"];
    actionsToday: number;
    successRate: number;
    pendingApprovals: number;
    recentDecisions: DecisionLog[];
    alerts: AutopilotAlert[];
    recommendations: string[];
  } {
    return {
      status: this.state.status,
      actionsToday: this.state.actionsToday,
      successRate: this.state.performance.successRate,
      pendingApprovals: this.decisionHistory.filter(d => d.status === "pending").length,
      recentDecisions: this.decisionHistory.slice(-10).reverse(),
      alerts: this.state.alerts.filter(a => !a.acknowledged).slice(0, 5),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * 推奨事項を生成
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // パフォーマンスに基づく推奨
    if (this.state.performance.successRate < 0.8) {
      recommendations.push("アクション成功率が80%を下回っています。自動化ルールの見直しを推奨します。");
    }

    // 保留アクションに関する推奨
    if (this.state.actionsPending > 10) {
      recommendations.push(`${this.state.actionsPending}件のアクションが承認待ちです。確認してください。`);
    }

    // モードに関する推奨
    if (this.config.mode === "conservative" && this.state.performance.successRate > 0.95) {
      recommendations.push("高い成功率を維持しています。「バランス」モードへの移行を検討してください。");
    }

    return recommendations;
  }
}

// ファクトリ関数
export function createAutopilot(config?: Partial<AutopilotConfig>): AutopilotSystem {
  return new AutopilotSystem(config);
}
