/**
 * Sequenzy MCP Integration
 *
 * ステップメール・シーケンス管理のMCPサーバー統合
 * - シーケンス作成・管理
 * - 自動配信スケジューリング
 * - パフォーマンス分析
 * - AI最適化
 */

import Anthropic from "@anthropic-ai/sdk";

// シーケンス関連の型定義
export interface EmailStep {
  id: string;
  order: number;
  subject: string;
  body: string;
  delay: {
    value: number;
    unit: "minutes" | "hours" | "days" | "weeks";
  };
  conditions?: StepCondition[];
  variants?: EmailVariant[];
  stats?: StepStats;
}

export interface EmailVariant {
  id: string;
  name: string;
  subject: string;
  body: string;
  weight: number; // 配信比率 (0-100)
}

export interface StepCondition {
  type: "opened" | "clicked" | "not_opened" | "not_clicked" | "tag" | "custom_field";
  value?: string;
  operator?: "equals" | "contains" | "greater_than" | "less_than";
}

export interface StepStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  bounced: number;
  openRate: number;
  clickRate: number;
}

export interface Sequence {
  id: string;
  name: string;
  description?: string;
  status: "draft" | "active" | "paused" | "completed";
  trigger: SequenceTrigger;
  steps: EmailStep[];
  settings: SequenceSettings;
  stats: SequenceStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface SequenceTrigger {
  type: "signup" | "tag_added" | "purchase" | "form_submit" | "manual" | "webhook" | "date";
  config: Record<string, unknown>;
}

export interface SequenceSettings {
  timezone: string;
  sendDays: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
  sendHours: { start: number; end: number }; // 0-23
  respectUnsubscribe: boolean;
  exitOnConversion: boolean;
  conversionGoal?: string;
}

export interface SequenceStats {
  enrolled: number;
  active: number;
  completed: number;
  exited: number;
  converted: number;
  conversionRate: number;
  avgCompletionTime: number; // 日数
}

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  status: "active" | "paused" | "completed" | "unsubscribed" | "bounced";
  currentStep: number;
  enrolledAt: Date;
  lastEmailAt?: Date;
  nextEmailAt?: Date;
  tags: string[];
  customFields: Record<string, unknown>;
}

export interface OptimizationSuggestion {
  type: "subject" | "timing" | "content" | "segmentation";
  step?: number;
  currentValue: string;
  suggestedValue: string;
  expectedImprovement: number; // パーセンテージ
  confidence: number; // 0-1
  reasoning: string;
}

// Sequenzy MCPクライアント
export class SequenzyMCPClient {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic();
  }

  /**
   * MCPツール定義
   */
  getTools(): Anthropic.Tool[] {
    return [
      {
        name: "sequenzy_list_sequences",
        description: "シーケンス（ステップメール）一覧を取得します。",
        input_schema: {
          type: "object" as const,
          properties: {
            status: {
              type: "string",
              enum: ["draft", "active", "paused", "completed", "all"],
              description: "ステータスでフィルター"
            },
            limit: {
              type: "number",
              description: "取得件数"
            }
          }
        }
      },
      {
        name: "sequenzy_get_sequence",
        description: "特定のシーケンスの詳細を取得します。",
        input_schema: {
          type: "object" as const,
          properties: {
            sequenceId: {
              type: "string",
              description: "シーケンスID"
            }
          },
          required: ["sequenceId"]
        }
      },
      {
        name: "sequenzy_create_sequence",
        description: "新しいシーケンスを作成します。",
        input_schema: {
          type: "object" as const,
          properties: {
            name: {
              type: "string",
              description: "シーケンス名"
            },
            description: {
              type: "string",
              description: "説明"
            },
            triggerType: {
              type: "string",
              enum: ["signup", "tag_added", "purchase", "form_submit", "manual", "webhook", "date"],
              description: "トリガータイプ"
            },
            triggerConfig: {
              type: "object",
              description: "トリガー設定"
            }
          },
          required: ["name", "triggerType"]
        }
      },
      {
        name: "sequenzy_add_step",
        description: "シーケンスにステップ（メール）を追加します。",
        input_schema: {
          type: "object" as const,
          properties: {
            sequenceId: {
              type: "string",
              description: "シーケンスID"
            },
            subject: {
              type: "string",
              description: "メール件名"
            },
            body: {
              type: "string",
              description: "メール本文（HTML対応）"
            },
            delayValue: {
              type: "number",
              description: "前ステップからの待機時間"
            },
            delayUnit: {
              type: "string",
              enum: ["minutes", "hours", "days", "weeks"],
              description: "待機時間の単位"
            },
            conditions: {
              type: "array",
              description: "配信条件"
            }
          },
          required: ["sequenceId", "subject", "body", "delayValue", "delayUnit"]
        }
      },
      {
        name: "sequenzy_update_step",
        description: "既存のステップを更新します。",
        input_schema: {
          type: "object" as const,
          properties: {
            sequenceId: {
              type: "string",
              description: "シーケンスID"
            },
            stepId: {
              type: "string",
              description: "ステップID"
            },
            subject: {
              type: "string",
              description: "新しい件名"
            },
            body: {
              type: "string",
              description: "新しい本文"
            },
            delay: {
              type: "object",
              description: "新しい待機設定"
            }
          },
          required: ["sequenceId", "stepId"]
        }
      },
      {
        name: "sequenzy_activate",
        description: "シーケンスをアクティブ化（配信開始）します。",
        input_schema: {
          type: "object" as const,
          properties: {
            sequenceId: {
              type: "string",
              description: "シーケンスID"
            }
          },
          required: ["sequenceId"]
        }
      },
      {
        name: "sequenzy_pause",
        description: "シーケンスを一時停止します。",
        input_schema: {
          type: "object" as const,
          properties: {
            sequenceId: {
              type: "string",
              description: "シーケンスID"
            }
          },
          required: ["sequenceId"]
        }
      },
      {
        name: "sequenzy_get_subscribers",
        description: "シーケンスの購読者一覧を取得します。",
        input_schema: {
          type: "object" as const,
          properties: {
            sequenceId: {
              type: "string",
              description: "シーケンスID"
            },
            status: {
              type: "string",
              enum: ["active", "paused", "completed", "unsubscribed", "bounced", "all"],
              description: "ステータスでフィルター"
            },
            limit: {
              type: "number",
              description: "取得件数"
            }
          },
          required: ["sequenceId"]
        }
      },
      {
        name: "sequenzy_enroll_subscriber",
        description: "購読者をシーケンスに登録します。",
        input_schema: {
          type: "object" as const,
          properties: {
            sequenceId: {
              type: "string",
              description: "シーケンスID"
            },
            email: {
              type: "string",
              description: "メールアドレス"
            },
            name: {
              type: "string",
              description: "名前"
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "タグ"
            },
            customFields: {
              type: "object",
              description: "カスタムフィールド"
            }
          },
          required: ["sequenceId", "email"]
        }
      },
      {
        name: "sequenzy_get_stats",
        description: "シーケンスのパフォーマンス統計を取得します。",
        input_schema: {
          type: "object" as const,
          properties: {
            sequenceId: {
              type: "string",
              description: "シーケンスID"
            },
            dateRange: {
              type: "object",
              properties: {
                start: { type: "string" },
                end: { type: "string" }
              },
              description: "期間指定"
            }
          },
          required: ["sequenceId"]
        }
      },
      {
        name: "sequenzy_ai_optimize",
        description: "AIによるシーケンス最適化提案を取得します。",
        input_schema: {
          type: "object" as const,
          properties: {
            sequenceId: {
              type: "string",
              description: "シーケンスID"
            },
            optimizationGoal: {
              type: "string",
              enum: ["open_rate", "click_rate", "conversion", "engagement"],
              description: "最適化目標"
            }
          },
          required: ["sequenceId"]
        }
      },
      {
        name: "sequenzy_ai_generate_email",
        description: "AIでメールコンテンツを生成します。",
        input_schema: {
          type: "object" as const,
          properties: {
            purpose: {
              type: "string",
              description: "メールの目的"
            },
            tone: {
              type: "string",
              enum: ["formal", "friendly", "casual", "urgent", "empathetic"],
              description: "トーン"
            },
            productInfo: {
              type: "string",
              description: "商品・サービス情報"
            },
            targetAudience: {
              type: "string",
              description: "ターゲット層"
            },
            previousEmails: {
              type: "array",
              items: { type: "string" },
              description: "シーケンス内の前のメール件名（文脈用）"
            }
          },
          required: ["purpose"]
        }
      }
    ];
  }

  /**
   * シーケンス一覧取得
   */
  async listSequences(options: {
    status?: string;
    limit?: number;
  } = {}): Promise<Sequence[]> {
    return [
      {
        id: "seq-001",
        name: "ウェルカムシーケンス",
        description: "新規登録者向けのオンボーディングメール",
        status: "active",
        trigger: { type: "signup", config: {} },
        steps: [
          {
            id: "step-1",
            order: 1,
            subject: "ようこそ！始め方ガイド",
            body: "<p>ご登録ありがとうございます...</p>",
            delay: { value: 0, unit: "minutes" },
            stats: { sent: 1500, delivered: 1480, opened: 890, clicked: 320, unsubscribed: 5, bounced: 20, openRate: 60.1, clickRate: 21.6 }
          },
          {
            id: "step-2",
            order: 2,
            subject: "次のステップ：プロフィール設定",
            body: "<p>プロフィールを完成させましょう...</p>",
            delay: { value: 2, unit: "days" },
            stats: { sent: 1400, delivered: 1390, opened: 756, clicked: 245, unsubscribed: 3, bounced: 10, openRate: 54.4, clickRate: 17.6 }
          }
        ],
        settings: {
          timezone: "Asia/Tokyo",
          sendDays: ["mon", "tue", "wed", "thu", "fri"],
          sendHours: { start: 9, end: 18 },
          respectUnsubscribe: true,
          exitOnConversion: true,
          conversionGoal: "profile_complete"
        },
        stats: {
          enrolled: 1500,
          active: 320,
          completed: 980,
          exited: 150,
          converted: 680,
          conversionRate: 45.3,
          avgCompletionTime: 7.2
        },
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        id: "seq-002",
        name: "購入後フォローアップ",
        description: "購入者へのお礼とレビュー依頼",
        status: "active",
        trigger: { type: "purchase", config: {} },
        steps: [
          {
            id: "step-1",
            order: 1,
            subject: "ご購入ありがとうございます！",
            body: "<p>お買い上げいただきありがとうございます...</p>",
            delay: { value: 0, unit: "minutes" },
            stats: { sent: 890, delivered: 885, opened: 712, clicked: 156, unsubscribed: 2, bounced: 5, openRate: 80.5, clickRate: 17.6 }
          }
        ],
        settings: {
          timezone: "Asia/Tokyo",
          sendDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
          sendHours: { start: 0, end: 24 },
          respectUnsubscribe: true,
          exitOnConversion: false
        },
        stats: {
          enrolled: 890,
          active: 120,
          completed: 750,
          exited: 20,
          converted: 180,
          conversionRate: 20.2,
          avgCompletionTime: 14
        },
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * シーケンス詳細取得
   */
  async getSequence(sequenceId: string): Promise<Sequence | null> {
    const sequences = await this.listSequences();
    return sequences.find(s => s.id === sequenceId) || null;
  }

  /**
   * シーケンス作成
   */
  async createSequence(data: {
    name: string;
    description?: string;
    triggerType: SequenceTrigger["type"];
    triggerConfig?: Record<string, unknown>;
  }): Promise<Sequence> {
    return {
      id: `seq-${Date.now()}`,
      name: data.name,
      description: data.description,
      status: "draft",
      trigger: { type: data.triggerType, config: data.triggerConfig || {} },
      steps: [],
      settings: {
        timezone: "Asia/Tokyo",
        sendDays: ["mon", "tue", "wed", "thu", "fri"],
        sendHours: { start: 9, end: 18 },
        respectUnsubscribe: true,
        exitOnConversion: true
      },
      stats: {
        enrolled: 0,
        active: 0,
        completed: 0,
        exited: 0,
        converted: 0,
        conversionRate: 0,
        avgCompletionTime: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * ステップ追加
   */
  async addStep(data: {
    sequenceId: string;
    subject: string;
    body: string;
    delayValue: number;
    delayUnit: EmailStep["delay"]["unit"];
    conditions?: StepCondition[];
  }): Promise<EmailStep> {
    return {
      id: `step-${Date.now()}`,
      order: 1,
      subject: data.subject,
      body: data.body,
      delay: { value: data.delayValue, unit: data.delayUnit },
      conditions: data.conditions
    };
  }

  /**
   * ステップ更新
   */
  async updateStep(sequenceId: string, stepId: string, updates: Partial<EmailStep>): Promise<EmailStep> {
    return {
      id: stepId,
      order: 1,
      subject: updates.subject || "Updated Subject",
      body: updates.body || "<p>Updated body</p>",
      delay: updates.delay || { value: 1, unit: "days" }
    };
  }

  /**
   * シーケンスアクティブ化
   */
  async activateSequence(sequenceId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `シーケンス ${sequenceId} がアクティブ化されました`
    };
  }

  /**
   * シーケンス一時停止
   */
  async pauseSequence(sequenceId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `シーケンス ${sequenceId} が一時停止されました`
    };
  }

  /**
   * 購読者一覧取得
   */
  async getSubscribers(options: {
    sequenceId: string;
    status?: string;
    limit?: number;
  }): Promise<Subscriber[]> {
    return [
      {
        id: "sub-001",
        email: "tanaka@example.com",
        name: "田中太郎",
        status: "active",
        currentStep: 2,
        enrolledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lastEmailAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        nextEmailAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        tags: ["premium", "active"],
        customFields: { plan: "pro" }
      },
      {
        id: "sub-002",
        email: "yamada@example.com",
        name: "山田花子",
        status: "completed",
        currentStep: 5,
        enrolledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        lastEmailAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        tags: ["converted"],
        customFields: {}
      }
    ];
  }

  /**
   * 購読者登録
   */
  async enrollSubscriber(data: {
    sequenceId: string;
    email: string;
    name?: string;
    tags?: string[];
    customFields?: Record<string, unknown>;
  }): Promise<Subscriber> {
    return {
      id: `sub-${Date.now()}`,
      email: data.email,
      name: data.name,
      status: "active",
      currentStep: 1,
      enrolledAt: new Date(),
      nextEmailAt: new Date(),
      tags: data.tags || [],
      customFields: data.customFields || {}
    };
  }

  /**
   * 統計取得
   */
  async getStats(options: {
    sequenceId: string;
    dateRange?: { start: string; end: string };
  }): Promise<{
    sequence: SequenceStats;
    steps: Array<{ stepId: string; stats: StepStats }>;
    trends: Array<{ date: string; enrolled: number; completed: number; converted: number }>;
  }> {
    return {
      sequence: {
        enrolled: 1500,
        active: 320,
        completed: 980,
        exited: 150,
        converted: 680,
        conversionRate: 45.3,
        avgCompletionTime: 7.2
      },
      steps: [
        {
          stepId: "step-1",
          stats: { sent: 1500, delivered: 1480, opened: 890, clicked: 320, unsubscribed: 5, bounced: 20, openRate: 60.1, clickRate: 21.6 }
        },
        {
          stepId: "step-2",
          stats: { sent: 1400, delivered: 1390, opened: 756, clicked: 245, unsubscribed: 3, bounced: 10, openRate: 54.4, clickRate: 17.6 }
        }
      ],
      trends: [
        { date: "2025-01-25", enrolled: 45, completed: 32, converted: 15 },
        { date: "2025-01-26", enrolled: 52, completed: 38, converted: 18 },
        { date: "2025-01-27", enrolled: 48, completed: 35, converted: 16 },
        { date: "2025-01-28", enrolled: 61, completed: 42, converted: 22 },
        { date: "2025-01-29", enrolled: 55, completed: 40, converted: 19 },
        { date: "2025-01-30", enrolled: 58, completed: 41, converted: 20 },
        { date: "2025-01-31", enrolled: 50, completed: 36, converted: 17 }
      ]
    };
  }

  /**
   * AI最適化提案
   */
  async getOptimizationSuggestions(options: {
    sequenceId: string;
    optimizationGoal?: "open_rate" | "click_rate" | "conversion" | "engagement";
  }): Promise<OptimizationSuggestion[]> {
    return [
      {
        type: "subject",
        step: 2,
        currentValue: "次のステップ：プロフィール設定",
        suggestedValue: "🎯 3分で完了！プロフィール設定で特典ゲット",
        expectedImprovement: 18.5,
        confidence: 0.85,
        reasoning: "絵文字を含む件名の開封率が15-20%高い傾向があります。また、所要時間の明示が行動を促進します。"
      },
      {
        type: "timing",
        step: 1,
        currentValue: "即時送信",
        suggestedValue: "登録から15分後",
        expectedImprovement: 12.3,
        confidence: 0.78,
        reasoning: "即時送信よりも少し間を置いた方が開封率が高い傾向があります。ユーザーが落ち着いてメールを確認できるタイミングです。"
      },
      {
        type: "content",
        step: 2,
        currentValue: "テキスト中心のコンテンツ",
        suggestedValue: "ビジュアルを追加（手順の図解）",
        expectedImprovement: 24.8,
        confidence: 0.72,
        reasoning: "クリック率向上には視覚的な要素が効果的です。特に「やり方」を示すコンテンツでは図解が有効です。"
      },
      {
        type: "segmentation",
        currentValue: "全員に同じメール",
        suggestedValue: "既存顧客 vs 新規でメールを分岐",
        expectedImprovement: 15.2,
        confidence: 0.88,
        reasoning: "既存顧客と新規ユーザーでは最適なメッセージングが異なります。セグメント別の配信でエンゲージメントが向上します。"
      }
    ];
  }

  /**
   * AIメール生成
   */
  async generateEmail(options: {
    purpose: string;
    tone?: string;
    productInfo?: string;
    targetAudience?: string;
    previousEmails?: string[];
  }): Promise<{
    subject: string;
    subjectVariants: string[];
    body: string;
    preheader: string;
  }> {
    // AIによる生成をシミュレート
    return {
      subject: `【${options.purpose}】あなたへの特別なご案内`,
      subjectVariants: [
        `✨ ${options.purpose}のお知らせです`,
        `${options.purpose}：今すぐチェック！`,
        `【重要】${options.purpose}について`
      ],
      body: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
<p>いつもご利用いただきありがとうございます。</p>

<p>${options.purpose}についてお知らせいたします。</p>

${options.productInfo ? `<p>${options.productInfo}</p>` : ''}

<p>ぜひこの機会をお見逃しなく！</p>

<a href="#" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">詳細を見る</a>

<p style="margin-top: 24px; color: #666;">
今後ともよろしくお願いいたします。
</p>
</div>`,
      preheader: `${options.purpose}の詳細をご確認ください`
    };
  }

  /**
   * AIエージェントによるシーケンス操作
   */
  async executeWithAI(prompt: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: `あなたはステップメール・シーケンス管理の専門AIアシスタントです。
メールマーケティングの自動化、配信最適化、パフォーマンス分析を支援します。
ベストプラクティスに基づいた提案を行い、コンバージョン率向上を目指します。
日本語で応答してください。`,
      tools: this.getTools(),
      messages: [
        { role: "user", content: prompt }
      ]
    });

    let result = "";
    for (const content of response.content) {
      if (content.type === "text") {
        result += content.text;
      } else if (content.type === "tool_use") {
        const toolResult = await this.handleToolCall(content.name, content.input as Record<string, unknown>);
        result += `\n\n結果:\n${JSON.stringify(toolResult, null, 2)}`;
      }
    }

    return result;
  }

  /**
   * ツール呼び出しハンドラー
   */
  private async handleToolCall(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    switch (toolName) {
      case "sequenzy_list_sequences":
        return this.listSequences(input);
      case "sequenzy_get_sequence":
        return this.getSequence(input.sequenceId as string);
      case "sequenzy_create_sequence":
        return this.createSequence(input as Parameters<typeof this.createSequence>[0]);
      case "sequenzy_add_step":
        return this.addStep(input as Parameters<typeof this.addStep>[0]);
      case "sequenzy_update_step":
        return this.updateStep(
          input.sequenceId as string,
          input.stepId as string,
          input as Partial<EmailStep>
        );
      case "sequenzy_activate":
        return this.activateSequence(input.sequenceId as string);
      case "sequenzy_pause":
        return this.pauseSequence(input.sequenceId as string);
      case "sequenzy_get_subscribers":
        return this.getSubscribers(input as Parameters<typeof this.getSubscribers>[0]);
      case "sequenzy_enroll_subscriber":
        return this.enrollSubscriber(input as Parameters<typeof this.enrollSubscriber>[0]);
      case "sequenzy_get_stats":
        return this.getStats(input as Parameters<typeof this.getStats>[0]);
      case "sequenzy_ai_optimize":
        return this.getOptimizationSuggestions(input as Parameters<typeof this.getOptimizationSuggestions>[0]);
      case "sequenzy_ai_generate_email":
        return this.generateEmail(input as Parameters<typeof this.generateEmail>[0]);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

// ファクトリ関数
export function createSequenzyClient(): SequenzyMCPClient {
  return new SequenzyMCPClient();
}
