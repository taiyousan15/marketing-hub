/**
 * キャンペーン関連の型定義
 */

export type CampaignType =
  | "EMAIL_STEP"
  | "EMAIL_BROADCAST"
  | "LINE_STEP"
  | "LINE_BROADCAST"
  | "LINE_SEGMENT"
  | "SMS";

export type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";

export type StepType = "MESSAGE" | "WAIT" | "CONDITION" | "ACTION";

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  segmentId?: string | null;
  useOptimalSendTime: boolean;
  minScoreThreshold?: number | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  steps?: CampaignStep[];
  _count?: {
    contacts: number;
  };
}

export interface CampaignStep {
  id: string;
  campaignId: string;
  order: number;
  type: StepType;
  delayDays: number;
  delayHours: number;
  delayMinutes: number;
  sendTime?: string | null;
  subject?: string | null;
  content: StepContent;
  conditions?: StepCondition[] | null;
  trueBranchOrder?: number | null;
  falseBranchOrder?: number | null;
  createdAt: string;
  updatedAt: string;
}

// ステップコンテンツ
export type StepContent =
  | MessageContent
  | WaitContent
  | ConditionContent
  | ActionContent;

export interface MediaItem {
  url: string;
  source: "upload" | "url" | "ai";
  model?: string;
  prompt?: string;
  mimeType?: string;
  name?: string;
}

export interface MessageContent {
  type: "text" | "flex" | "image" | "video";
  // Text (up to 5 blocks)
  texts?: string[];
  text?: string; // legacy / maps to texts[0]
  // Flex
  altText?: string;
  contents?: unknown;
  // Image (multiple)
  images?: MediaItem[];
  imageUrl?: string; // legacy
  // Video
  video?: MediaItem;
  videoUrl?: string; // legacy
  videoResolution?: "480p" | "720p" | "1080p" | "4k";
  videoFormat?: "mp4" | "webm" | "mov";
}

export interface WaitContent {
  type: "wait";
  description?: string;
}

export interface ConditionContent {
  type: "condition";
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean;
  trueBranch?: number; // step order to go if true
  falseBranch?: number; // step order to go if false
}

export interface ActionContent {
  type: "add_tag" | "remove_tag" | "update_score" | "start_campaign" | "webhook";
  tagId?: string;
  scoreField?: string;
  scoreValue?: number;
  campaignId?: string;
  webhookUrl?: string;
  webhookPayload?: Record<string, unknown>;
}

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equals"
  | "less_than_or_equals"
  | "is_empty"
  | "is_not_empty";

export interface StepCondition {
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean;
}

// フォーム用の型
export interface CampaignFormData {
  name: string;
  type: CampaignType;
  segmentId?: string;
  useOptimalSendTime: boolean;
  minScoreThreshold?: number;
}

export interface StepFormData {
  type: StepType;
  delayDays: number;
  delayHours: number;
  delayMinutes: number;
  sendTime?: string;
  subject?: string;
  content: StepContent;
  conditions?: StepCondition[];
  trueBranchOrder?: number;
  falseBranchOrder?: number;
}

// API レスポンス
export interface CampaignsResponse {
  campaigns: Campaign[];
  total: number;
}

export interface CampaignResponse {
  campaign: Campaign;
}

export interface StepsResponse {
  steps: CampaignStep[];
}
