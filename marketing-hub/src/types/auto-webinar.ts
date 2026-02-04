/**
 * Auto Webinar System - TypeScript型定義
 */

import type {
  AutoWebinarScheduleType,
  AutoWebinarStatus,
  AutoWebinarRegStatus,
  SimChatMessageType,
  OfferActionType,
  VideoType,
  ABTestStatus,
  ABTestAlgorithm,
  WebinarRewardType,
  WebinarRewardDeliveryType,
  WebinarNotificationType,
  NotificationChannel,
  NotificationStatus,
} from "@prisma/client";

// ==================== ウェビナー ====================

export interface AutoWebinar {
  id: string;
  tenantId: string;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  videoUrl: string;
  videoType: VideoType;
  videoDuration: number;
  scheduleType: AutoWebinarScheduleType;
  justInTimeDelayMinutes: number;
  recurringSchedule?: RecurringSchedule | null;
  specificDates?: Date[] | null;
  fakeAttendeesEnabled: boolean;
  fakeAttendeesMin: number;
  fakeAttendeesMax: number;
  simulatedChatEnabled: boolean;
  userChatEnabled: boolean;
  replayEnabled: boolean;
  replayExpiresAfterHours?: number | null;
  status: AutoWebinarStatus;
  funnelId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringSchedule {
  days: number[]; // 0-6 (日-土)
  times: string[]; // ["15:00", "19:00"]
  timezone: string;
}

// ==================== チャットメッセージ ====================

export interface ChatMessage {
  id: string;
  appearAtSeconds: number;
  senderName: string;
  senderAvatar?: string | null;
  content: string;
  messageType: SimChatMessageType;
  reactions?: {
    likes?: number;
    hearts?: number;
  };
}

export interface ChatMessageCreate {
  webinarId: string;
  appearAtSeconds: number;
  senderName: string;
  senderAvatar?: string | null;
  content: string;
  messageType: SimChatMessageType;
  order: number;
}

// ==================== オファー ====================

export interface TimedOffer {
  id: string;
  webinarId: string;
  appearAtSeconds: number;
  hideAtSeconds?: number | null;
  title: string;
  description?: string | null;
  buttonText: string;
  buttonUrl: string;
  actionType: OfferActionType;
  // アクションタイプ別の設定
  emailFormTitle?: string | null;
  emailFormTagId?: string | null;
  emailSuccessMessage?: string | null;
  lineAddUrl?: string | null;
  lineLiffId?: string | null;
  stripePriceId?: string | null;
  stripeSuccessUrl?: string | null;
  stripeCancelUrl?: string | null;
  downloadUrl?: string | null;
  downloadFileName?: string | null;
  // 緊急性演出
  countdownEnabled: boolean;
  countdownSeconds?: number | null;
  limitedSeats?: number | null;
  // 表示設定
  popupPosition: string;
  // 統計
  clickCount: number;
  conversionCount: number;
  formSubmitCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== セッション ====================

export interface WebinarSession {
  id: string;
  webinarId: string;
  contactId?: string | null;
  registrationId?: string | null;
  sessionToken: string;
  isReplay: boolean;
  startedAt: Date;
  endedAt?: Date | null;
  maxWatchedSeconds: number;
  completionPercent: number;
  offersClicked?: string[] | null;
}

export interface SessionBehaviorAnalysis {
  watchPercentage: number;
  completionPercent: number;
  isHighlyEngaged: boolean;
  isModeratelyEngaged: boolean;
  isLowEngaged: boolean;
  clickedAnyOffer: boolean;
  clickedMultipleOffers: boolean;
  offersClickedCount: number;
  segment: "hot" | "warm" | "cold" | "bounced";
}

// ==================== 登録 ====================

export interface WebinarRegistration {
  id: string;
  webinarId: string;
  contactId: string;
  scheduledStartAt: Date;
  replayAccessToken?: string | null;
  replayExpiresAt?: Date | null;
  status: AutoWebinarRegStatus;
  registeredAt: Date;
  attendedAt?: Date | null;
}

// ==================== A/Bテスト ====================

export interface OfferABTest {
  id: string;
  webinarId: string;
  offerId: string;
  name: string;
  description?: string | null;
  status: ABTestStatus;
  algorithm: ABTestAlgorithm;
  confidenceLevel: number;
  minSampleSize: number;
  minConversions: number;
  autoOptimize: boolean;
  autoOptimizeAfter?: number | null;
  winnerId?: string | null;
  winnerDeclaredAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  variants: ABTestVariant[];
}

export interface ABTestVariant {
  id: string;
  testId: string;
  name: string;
  description?: string | null;
  isControl: boolean;
  // オファー内容オーバーライド
  title?: string | null;
  offerDescription?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
  countdownEnabled?: boolean | null;
  countdownSeconds?: number | null;
  limitedSeats?: number | null;
  popupPosition?: string | null;
  // 割り当て比率
  weight: number;
  // 統計
  impressions: number;
  clicks: number;
  conversions: number;
  clickRate?: number | null;
  conversionRate?: number | null;
}

// ==================== 特典 ====================

export interface WebinarReward {
  id: string;
  webinarId: string;
  name: string;
  description?: string | null;
  rewardType: WebinarRewardType;
  // 条件
  watchTimeSeconds?: number | null;
  triggerKeywords?: string[] | null;
  appearAtSeconds?: number | null;
  inputDeadlineSeconds?: number | null;
  inputFields?: RewardInputField[] | null;
  // 配布方法
  deliveryType: WebinarRewardDeliveryType;
  // 配布内容
  downloadUrl?: string | null;
  couponCode?: string | null;
  emailTemplateId?: string | null;
  lineMessage?: string | null;
  unlockContentId?: string | null;
  tagId?: string | null;
  // ポップアップ設定
  popupTitle?: string | null;
  popupDescription?: string | null;
  popupButtonText: string;
  popupPosition: string;
  // 制限
  maxClaims?: number | null;
  currentClaims: number;
  isActive: boolean;
  order: number;
}

export interface RewardInputField {
  name: string;
  type: "text" | "email" | "tel" | "number";
  required: boolean;
  label: string;
  placeholder?: string;
}

// ==================== 通知 ====================

export interface WebinarNotificationSettings {
  id: string;
  webinarId: string;
  isEnabled: boolean;
  reminder30MinEnabled: boolean;
  reminder5MinEnabled: boolean;
  reminder1MinEnabled: boolean;
  startingNowEnabled: boolean;
  replayAvailableEnabled: boolean;
  replayExpiringEnabled: boolean;
  replayExpiringHours: number;
  defaultChannel: NotificationChannel;
  // カスタムメッセージ
  reminder30MinSubject?: string | null;
  reminder30MinBody?: string | null;
  reminder5MinSubject?: string | null;
  reminder5MinBody?: string | null;
  startingNowSubject?: string | null;
  startingNowBody?: string | null;
  replaySubject?: string | null;
  replayBody?: string | null;
}

export interface ScheduledNotification {
  id: string;
  webinarId: string;
  registrationId: string;
  contactId: string;
  notificationType: WebinarNotificationType;
  scheduledAt: Date;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt?: Date | null;
  failedAt?: Date | null;
  errorMessage?: string | null;
  emailMessageId?: string | null;
  lineMessageId?: string | null;
}

// ==================== 分岐ロジック ====================

export interface BranchingCondition {
  type: "watch_time" | "offer_clicked" | "engagement" | "quiz_answer" | "custom";
  operator: "gte" | "lte" | "eq" | "ne" | "contains";
  value: string | number | boolean;
  metadata?: Record<string, any>;
}

export interface BranchingRule {
  id: string;
  name: string;
  conditions: BranchingCondition[];
  logicalOperator: "AND" | "OR";
  trueAction: BranchingAction;
  falseAction: BranchingAction;
}

export interface BranchingAction {
  type: "redirect" | "show_offer" | "send_email" | "add_tag" | "webhook";
  config: Record<string, any>;
}

// ==================== AIチャット生成 ====================

export interface AIChatGenerationRequest {
  messageCount?: number;
  messageTypes?: SimChatMessageType[];
  topic?: string;
  tone?: "friendly" | "professional" | "enthusiastic";
}

export interface AIChatGenerationResponse {
  success: boolean;
  messagesCreated: number;
  messages: ChatMessage[];
}

// ==================== API レスポンス ====================

export interface WebinarListResponse {
  webinars: AutoWebinar[];
  total: number;
}

export interface WebinarDetailResponse {
  webinar: AutoWebinar & {
    chatMessages: ChatMessage[];
    timedOffers: TimedOffer[];
    registrations: WebinarRegistration[];
    _count: {
      chatMessages: number;
      timedOffers: number;
      registrations: number;
      sessions: number;
    };
  };
}

export interface SessionUpdateRequest {
  sessionToken: string;
  currentPosition?: number;
  offerClicked?: string;
  completionPercent?: number;
}

export interface SessionSyncResponse {
  chat: {
    messages: ChatMessage[];
  };
  offers: TimedOffer[];
  playback: {
    isEnded: boolean;
    currentPosition: number;
  };
}

// ==================== コンポーネントProps ====================

export interface WebinarPlayerProps {
  videoUrl: string;
  videoType: VideoType;
  videoDuration: number;
  currentPosition: number;
  isLive: boolean;
  isReplay: boolean;
  onPositionUpdate: (position: number) => void;
  className?: string;
}

export interface ChatSimulationProps {
  messages: ChatMessage[];
  currentPosition: number;
  className?: string;
  autoScroll?: boolean;
}

export interface ParticipantCounterProps {
  min: number;
  max: number;
  progress: number; // 0-1
  className?: string;
}

export interface TimedOfferPopupProps {
  offer: TimedOffer;
  onClose: () => void;
  onButtonClick: (offerId: string) => void;
  position?: "bottom-right" | "bottom-left" | "center";
}

export interface TimedOffersContainerProps {
  offers: TimedOffer[];
  currentPosition: number;
  videoDuration: number;
  onOfferClick: (offerId: string) => void;
}
