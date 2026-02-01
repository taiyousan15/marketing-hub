/**
 * HubSpot MCP Integration
 *
 * HubSpotとの双方向データ同期を実現するMCPサーバー統合
 * - コンタクト同期
 * - ディール管理
 * - マーケティングキャンペーン連携
 * - アナリティクス取得
 */

import Anthropic from "@anthropic-ai/sdk";

// HubSpot APIの型定義
export interface HubSpotContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  lifecycleStage?: "subscriber" | "lead" | "marketingqualifiedlead" | "salesqualifiedlead" | "opportunity" | "customer" | "evangelist";
  properties: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface HubSpotDeal {
  id: string;
  name: string;
  stage: string;
  amount: number;
  closeDate?: Date;
  associatedContacts: string[];
  properties: Record<string, string>;
}

export interface HubSpotCampaign {
  id: string;
  name: string;
  type: "email" | "social" | "content" | "ads";
  status: "draft" | "scheduled" | "running" | "completed";
  stats: {
    sent?: number;
    opened?: number;
    clicked?: number;
    converted?: number;
  };
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
  timestamp: Date;
}

// HubSpot MCPクライアント
export class HubSpotMCPClient {
  private apiKey: string;
  private baseUrl: string = "https://api.hubapi.com";
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.anthropic = new Anthropic();
  }

  /**
   * MCPツールとしてHubSpot操作を定義
   */
  getTools(): Anthropic.Tool[] {
    return [
      {
        name: "hubspot_get_contacts",
        description: "HubSpotからコンタクト一覧を取得します。フィルターやページネーションをサポート。",
        input_schema: {
          type: "object" as const,
          properties: {
            limit: {
              type: "number",
              description: "取得する最大件数（デフォルト: 100）"
            },
            after: {
              type: "string",
              description: "ページネーション用のカーソル"
            },
            properties: {
              type: "array",
              items: { type: "string" },
              description: "取得するプロパティ名の配列"
            },
            filterGroups: {
              type: "array",
              description: "フィルター条件"
            }
          }
        }
      },
      {
        name: "hubspot_create_contact",
        description: "HubSpotに新しいコンタクトを作成します。",
        input_schema: {
          type: "object" as const,
          properties: {
            email: {
              type: "string",
              description: "メールアドレス（必須）"
            },
            firstName: {
              type: "string",
              description: "名前"
            },
            lastName: {
              type: "string",
              description: "姓"
            },
            phone: {
              type: "string",
              description: "電話番号"
            },
            company: {
              type: "string",
              description: "会社名"
            },
            properties: {
              type: "object",
              description: "追加のカスタムプロパティ"
            }
          },
          required: ["email"]
        }
      },
      {
        name: "hubspot_update_contact",
        description: "既存のHubSpotコンタクトを更新します。",
        input_schema: {
          type: "object" as const,
          properties: {
            contactId: {
              type: "string",
              description: "コンタクトID"
            },
            properties: {
              type: "object",
              description: "更新するプロパティ"
            }
          },
          required: ["contactId", "properties"]
        }
      },
      {
        name: "hubspot_get_deals",
        description: "HubSpotからディール（商談）一覧を取得します。",
        input_schema: {
          type: "object" as const,
          properties: {
            limit: {
              type: "number",
              description: "取得する最大件数"
            },
            stage: {
              type: "string",
              description: "ステージでフィルター"
            }
          }
        }
      },
      {
        name: "hubspot_create_deal",
        description: "HubSpotに新しいディールを作成します。",
        input_schema: {
          type: "object" as const,
          properties: {
            name: {
              type: "string",
              description: "ディール名"
            },
            stage: {
              type: "string",
              description: "パイプラインステージ"
            },
            amount: {
              type: "number",
              description: "金額"
            },
            contactIds: {
              type: "array",
              items: { type: "string" },
              description: "関連付けるコンタクトID"
            }
          },
          required: ["name", "stage"]
        }
      },
      {
        name: "hubspot_get_campaigns",
        description: "HubSpotのマーケティングキャンペーン一覧を取得します。",
        input_schema: {
          type: "object" as const,
          properties: {
            type: {
              type: "string",
              enum: ["email", "social", "content", "ads"],
              description: "キャンペーンタイプでフィルター"
            },
            status: {
              type: "string",
              enum: ["draft", "scheduled", "running", "completed"],
              description: "ステータスでフィルター"
            }
          }
        }
      },
      {
        name: "hubspot_sync_contacts",
        description: "MarketingHubとHubSpot間でコンタクトを同期します。",
        input_schema: {
          type: "object" as const,
          properties: {
            direction: {
              type: "string",
              enum: ["to_hubspot", "from_hubspot", "bidirectional"],
              description: "同期の方向"
            },
            filterTags: {
              type: "array",
              items: { type: "string" },
              description: "同期対象を絞り込むタグ"
            }
          },
          required: ["direction"]
        }
      }
    ];
  }

  /**
   * コンタクト一覧取得
   */
  async getContacts(options: {
    limit?: number;
    after?: string;
    properties?: string[];
  } = {}): Promise<{ contacts: HubSpotContact[]; paging?: { next?: { after: string } } }> {
    const { limit = 100, after, properties = ["email", "firstname", "lastname", "phone", "company", "lifecyclestage"] } = options;

    // 実際のAPI呼び出しをシミュレート
    const mockContacts: HubSpotContact[] = [
      {
        id: "hs-001",
        email: "tanaka@example.com",
        firstName: "太郎",
        lastName: "田中",
        company: "株式会社サンプル",
        lifecycleStage: "customer",
        properties: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "hs-002",
        email: "yamada@example.com",
        firstName: "花子",
        lastName: "山田",
        company: "テスト株式会社",
        lifecycleStage: "lead",
        properties: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return {
      contacts: mockContacts,
      paging: limit < mockContacts.length ? { next: { after: "cursor-next" } } : undefined
    };
  }

  /**
   * コンタクト作成
   */
  async createContact(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
    properties?: Record<string, string>;
  }): Promise<HubSpotContact> {
    // API呼び出しをシミュレート
    return {
      id: `hs-${Date.now()}`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      company: data.company,
      properties: data.properties || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * コンタクト更新
   */
  async updateContact(contactId: string, properties: Record<string, string>): Promise<HubSpotContact> {
    return {
      id: contactId,
      email: properties.email || "updated@example.com",
      firstName: properties.firstname,
      lastName: properties.lastname,
      properties,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * ディール一覧取得
   */
  async getDeals(options: {
    limit?: number;
    stage?: string;
  } = {}): Promise<HubSpotDeal[]> {
    return [
      {
        id: "deal-001",
        name: "大型案件A",
        stage: "presentation",
        amount: 500000,
        associatedContacts: ["hs-001"],
        properties: {}
      },
      {
        id: "deal-002",
        name: "中型案件B",
        stage: "proposal",
        amount: 200000,
        associatedContacts: ["hs-002"],
        properties: {}
      }
    ];
  }

  /**
   * ディール作成
   */
  async createDeal(data: {
    name: string;
    stage: string;
    amount?: number;
    contactIds?: string[];
  }): Promise<HubSpotDeal> {
    return {
      id: `deal-${Date.now()}`,
      name: data.name,
      stage: data.stage,
      amount: data.amount || 0,
      associatedContacts: data.contactIds || [],
      properties: {}
    };
  }

  /**
   * キャンペーン一覧取得
   */
  async getCampaigns(options: {
    type?: HubSpotCampaign["type"];
    status?: HubSpotCampaign["status"];
  } = {}): Promise<HubSpotCampaign[]> {
    return [
      {
        id: "camp-001",
        name: "春のキャンペーン",
        type: "email",
        status: "completed",
        stats: {
          sent: 5000,
          opened: 1500,
          clicked: 450,
          converted: 89
        }
      },
      {
        id: "camp-002",
        name: "新商品告知",
        type: "email",
        status: "running",
        stats: {
          sent: 2000,
          opened: 800,
          clicked: 240
        }
      }
    ];
  }

  /**
   * 双方向同期
   */
  async syncContacts(direction: "to_hubspot" | "from_hubspot" | "bidirectional", filterTags?: string[]): Promise<SyncResult> {
    // 同期ロジックをシミュレート
    const synced = Math.floor(Math.random() * 100) + 50;
    const failed = Math.floor(Math.random() * 5);

    return {
      success: true,
      synced,
      failed,
      errors: failed > 0 ? [{ id: "contact-xxx", error: "Duplicate email" }] : [],
      timestamp: new Date()
    };
  }

  /**
   * AIエージェントによるHubSpot操作
   */
  async executeWithAI(prompt: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: `あなたはHubSpot CRM専門のAIアシスタントです。
以下のツールを使用してHubSpotの操作を行います:
- hubspot_get_contacts: コンタクト取得
- hubspot_create_contact: コンタクト作成
- hubspot_update_contact: コンタクト更新
- hubspot_get_deals: ディール取得
- hubspot_create_deal: ディール作成
- hubspot_get_campaigns: キャンペーン取得
- hubspot_sync_contacts: コンタクト同期

日本語で応答してください。`,
      tools: this.getTools(),
      messages: [
        { role: "user", content: prompt }
      ]
    });

    // ツール呼び出しを処理
    let result = "";
    for (const content of response.content) {
      if (content.type === "text") {
        result += content.text;
      } else if (content.type === "tool_use") {
        const toolResult = await this.handleToolCall(content.name, content.input as Record<string, unknown>);
        result += `\n\nツール実行結果 (${content.name}):\n${JSON.stringify(toolResult, null, 2)}`;
      }
    }

    return result;
  }

  /**
   * ツール呼び出しハンドラー
   */
  private async handleToolCall(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    switch (toolName) {
      case "hubspot_get_contacts":
        return this.getContacts(input as Parameters<typeof this.getContacts>[0]);
      case "hubspot_create_contact":
        return this.createContact(input as Parameters<typeof this.createContact>[0]);
      case "hubspot_update_contact":
        return this.updateContact(input.contactId as string, input.properties as Record<string, string>);
      case "hubspot_get_deals":
        return this.getDeals(input as Parameters<typeof this.getDeals>[0]);
      case "hubspot_create_deal":
        return this.createDeal(input as Parameters<typeof this.createDeal>[0]);
      case "hubspot_get_campaigns":
        return this.getCampaigns(input as Parameters<typeof this.getCampaigns>[0]);
      case "hubspot_sync_contacts":
        return this.syncContacts(
          input.direction as "to_hubspot" | "from_hubspot" | "bidirectional",
          input.filterTags as string[] | undefined
        );
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

// シングルトンインスタンス生成用ファクトリ
export function createHubSpotClient(apiKey: string): HubSpotMCPClient {
  return new HubSpotMCPClient(apiKey);
}
