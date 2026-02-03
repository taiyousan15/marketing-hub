/**
 * MCP Integration Index
 *
 * 全MCPクライアントのエクスポートとファクトリ関数
 */

// HubSpot Integration
export {
  HubSpotMCPClient,
  createHubSpotClient,
  type HubSpotContact,
  type HubSpotDeal,
  type HubSpotCampaign,
  type SyncResult
} from "./hubspot";

// Analytics Integration
export {
  AnalyticsMCPClient,
  createAnalyticsClient,
  type PageView,
  type TrafficSource,
  type UserBehavior,
  type ConversionFunnel,
  type RealtimeData,
  type AnalyticsReport
} from "./analytics";

// Sequenzy Integration
export {
  SequenzyMCPClient,
  createSequenzyClient,
  type EmailStep,
  type EmailVariant,
  type StepCondition,
  type StepStats,
  type Sequence,
  type SequenceTrigger,
  type SequenceSettings,
  type SequenceStats,
  type Subscriber,
  type OptimizationSuggestion
} from "./sequenzy";

// 統合MCPマネージャー
export interface MCPConfig {
  hubspot?: {
    apiKey: string;
  };
  analytics?: {
    googleAnalyticsId?: string;
  };
  sequenzy?: {
    enabled: boolean;
  };
}

export class MCPManager {
  private hubspotClient?: InstanceType<typeof import("./hubspot").HubSpotMCPClient>;
  private analyticsClient?: InstanceType<typeof import("./analytics").AnalyticsMCPClient>;
  private sequenzyClient?: InstanceType<typeof import("./sequenzy").SequenzyMCPClient>;

  constructor(config: MCPConfig) {
    if (config.hubspot?.apiKey) {
      const { createHubSpotClient } = require("./hubspot");
      this.hubspotClient = createHubSpotClient(config.hubspot.apiKey);
    }

    if (config.analytics) {
      const { createAnalyticsClient } = require("./analytics");
      this.analyticsClient = createAnalyticsClient(config.analytics);
    }

    if (config.sequenzy?.enabled) {
      const { createSequenzyClient } = require("./sequenzy");
      this.sequenzyClient = createSequenzyClient();
    }
  }

  getHubSpot() {
    return this.hubspotClient;
  }

  getAnalytics() {
    return this.analyticsClient;
  }

  getSequenzy() {
    return this.sequenzyClient;
  }

  // すべてのMCPツールを統合して返す
  getAllTools() {
    const tools = [];

    if (this.hubspotClient) {
      tools.push(...this.hubspotClient.getTools());
    }

    if (this.analyticsClient) {
      tools.push(...this.analyticsClient.getTools());
    }

    if (this.sequenzyClient) {
      tools.push(...this.sequenzyClient.getTools());
    }

    return tools;
  }
}

// ファクトリ関数
export function createMCPManager(config: MCPConfig): MCPManager {
  return new MCPManager(config);
}
