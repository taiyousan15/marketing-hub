import { z } from "zod";

// ====================
// Enums
// ====================

export const VideoTypeSchema = z.enum(["YOUTUBE", "VIMEO", "UPLOAD"]);
export const ScheduleTypeSchema = z.enum([
  "JUST_IN_TIME",
  "RECURRING",
  "SPECIFIC_DATES",
  "ON_DEMAND",
]);
export const WebinarStatusSchema = z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]);
export const ChatMessageTypeSchema = z.enum([
  "COMMENT",
  "QUESTION",
  "REACTION",
  "TESTIMONIAL",
]);
export const OfferActionTypeSchema = z.enum([
  "EXTERNAL_LINK",
  "EMAIL_FORM",
  "LINE_FRIEND",
  "STRIPE_CHECKOUT",
  "DOWNLOAD",
  "CUSTOM",
]);
export const PopupPositionSchema = z.enum(["CENTER", "BOTTOM_RIGHT", "BOTTOM_LEFT"]);
export const RewardTriggerTypeSchema = z.enum([
  "WATCH_TIME",
  "KEYWORD",
  "TIMED_INPUT",
  "POLL_ANSWER",
  "QUIZ_CORRECT",
]);
export const RewardDeliveryTypeSchema = z.enum([
  "DOWNLOAD",
  "EMAIL",
  "LINE",
  "COUPON",
  "UNLOCK_CONTENT",
  "TAG_ADD",
]);
export const ABTestAlgorithmSchema = z.enum([
  "RANDOM",
  "EPSILON_GREEDY",
  "THOMPSON_SAMPLING",
  "UCB1",
]);
export const NotificationChannelSchema = z.enum(["EMAIL", "LINE", "BOTH"]);

// ====================
// Webinar Schemas
// ====================

export const CreateWebinarSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(200, "タイトルは200文字以内で入力してください"),
  description: z
    .string()
    .max(5000, "説明は5000文字以内で入力してください")
    .optional()
    .nullable(),
  thumbnail: z.string().url("有効なURLを入力してください").optional().nullable(),
  videoUrl: z.string().url("有効な動画URLを入力してください"),
  videoType: VideoTypeSchema.optional(),
  videoDuration: z
    .number()
    .int("動画時間は整数で入力してください")
    .min(1, "動画時間は1秒以上である必要があります")
    .max(86400, "動画時間は24時間（86400秒）以内である必要があります"),
  scheduleType: ScheduleTypeSchema.default("JUST_IN_TIME"),
  justInTimeDelayMinutes: z
    .number()
    .int()
    .min(0, "遅延時間は0分以上である必要があります")
    .max(10080, "遅延時間は1週間（10080分）以内である必要があります")
    .default(15),
  recurringSchedule: z
    .object({
      days: z.array(z.number().int().min(0).max(6)),
      times: z.array(z.string().regex(/^\d{2}:\d{2}$/, "HH:MM形式で入力してください")),
      timezone: z.string().default("Asia/Tokyo"),
    })
    .optional()
    .nullable(),
  specificDates: z.array(z.string().datetime()).optional().nullable(),
  fakeAttendeesEnabled: z.boolean().default(true),
  fakeAttendeesMin: z
    .number()
    .int()
    .min(0, "最小参加者数は0以上である必要があります")
    .max(10000, "最小参加者数は10000以内である必要があります")
    .default(50),
  fakeAttendeesMax: z
    .number()
    .int()
    .min(1, "最大参加者数は1以上である必要があります")
    .max(50000, "最大参加者数は50000以内である必要があります")
    .default(200),
  simulatedChatEnabled: z.boolean().default(true),
  userChatEnabled: z.boolean().default(false),
  replayEnabled: z.boolean().default(true),
  replayExpiresAfterHours: z
    .number()
    .int()
    .min(1, "リプレイ有効期限は1時間以上である必要があります")
    .max(8760, "リプレイ有効期限は1年（8760時間）以内である必要があります")
    .optional()
    .nullable(),
  funnelId: z.string().cuid().optional().nullable(),
  tenantId: z.string().optional(),
});

// Refinementは別途チェック
export const CreateWebinarSchemaWithRefinement = CreateWebinarSchema.refine(
  (data) => data.fakeAttendeesMin <= data.fakeAttendeesMax,
  {
    message: "最小参加者数は最大参加者数以下である必要があります",
    path: ["fakeAttendeesMin"],
  }
);

export const UpdateWebinarSchema = CreateWebinarSchema.partial();

export const UpdateStatusSchema = z.object({
  status: WebinarStatusSchema,
});

// ====================
// Registration Schemas
// ====================

export const RegisterWebinarSchema = z.object({
  contactId: z.string().cuid().optional(),
  email: z
    .string()
    .email("有効なメールアドレスを入力してください")
    .max(254, "メールアドレスは254文字以内で入力してください")
    .optional(),
  phone: z
    .string()
    .regex(/^\+81[0-9]{10}$/, "有効な電話番号形式（E.164）を入力してください")
    .optional(),
  name: z
    .string()
    .max(100, "名前は100文字以内で入力してください")
    .optional()
    .nullable(),
  contactMethod: z.enum(["email", "sms"]).optional().default("email"),
  selectedTime: z.string().datetime().optional(),
}).refine(
  (data) => data.contactId || data.email || data.phone,
  {
    message: "contactId、email、phoneのいずれかは必須です",
    path: ["email"],
  }
);

// ====================
// Session Schemas
// ====================

export const StartSessionSchema = z.object({
  contactId: z.string().cuid().optional().nullable(),
  registrationId: z.string().cuid().optional().nullable(),
  isReplay: z.boolean().default(false),
});

export const UpdateSessionSchema = z.object({
  sessionToken: z.string().min(1, "セッショントークンは必須です"),
  currentPosition: z
    .number()
    .min(0, "再生位置は0以上である必要があります")
    .optional(),
  offerClicked: z.string().cuid().optional(),
});

// ====================
// Chat Message Schemas
// ====================

export const CreateChatMessageSchema = z.object({
  appearAtSeconds: z
    .number()
    .int()
    .min(0, "表示時間は0秒以上である必要があります"),
  senderName: z
    .string()
    .min(1, "送信者名は必須です")
    .max(50, "送信者名は50文字以内で入力してください"),
  senderAvatar: z.string().url().optional().nullable(),
  content: z
    .string()
    .min(1, "メッセージ内容は必須です")
    .max(500, "メッセージは500文字以内で入力してください"),
  messageType: ChatMessageTypeSchema.default("COMMENT"),
  order: z.number().int().min(0).default(0),
});

export const UpdateChatMessageSchema = CreateChatMessageSchema.partial().extend({
  id: z.string().cuid(),
});

export const BulkImportChatMessagesSchema = z.object({
  messages: z.array(CreateChatMessageSchema).max(1000, "一度にインポートできるメッセージは1000件までです"),
  overwrite: z.boolean().default(false),
});

// ====================
// Timed Offer Schemas
// ====================

export const CreateTimedOfferSchema = z.object({
  appearAtSeconds: z
    .number()
    .int()
    .min(0, "表示開始時間は0秒以上である必要があります"),
  hideAtSeconds: z
    .number()
    .int()
    .min(1, "表示終了時間は1秒以上である必要があります")
    .optional()
    .nullable(),
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください"),
  description: z
    .string()
    .max(1000, "説明は1000文字以内で入力してください")
    .optional()
    .nullable(),
  buttonText: z
    .string()
    .min(1, "ボタンテキストは必須です")
    .max(50, "ボタンテキストは50文字以内で入力してください")
    .default("今すぐ申し込む"),
  buttonUrl: z.string().url("有効なURLを入力してください"),
  actionType: OfferActionTypeSchema.default("EXTERNAL_LINK"),
  countdownEnabled: z.boolean().default(false),
  countdownSeconds: z
    .number()
    .int()
    .min(60, "カウントダウンは60秒以上である必要があります")
    .max(86400, "カウントダウンは24時間以内である必要があります")
    .optional()
    .nullable(),
  limitedSeats: z
    .number()
    .int()
    .min(1, "残席数は1以上である必要があります")
    .max(9999, "残席数は9999以内である必要があります")
    .optional()
    .nullable(),
  popupPosition: PopupPositionSchema.default("CENTER"),
  stripePriceId: z.string().optional().nullable(),
  liffId: z.string().optional().nullable(),
  emailFormFields: z
    .array(
      z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(["text", "email", "tel", "textarea"]),
        required: z.boolean().default(false),
      })
    )
    .optional()
    .nullable(),
  downloadUrl: z.string().url().optional().nullable(),
});

// Refinement付きスキーマ（作成時のみ使用）
export const CreateTimedOfferSchemaWithRefinement = CreateTimedOfferSchema.refine(
  (data) => {
    if (data.hideAtSeconds !== null && data.hideAtSeconds !== undefined) {
      return data.hideAtSeconds > data.appearAtSeconds;
    }
    return true;
  },
  {
    message: "表示終了時間は表示開始時間より後である必要があります",
    path: ["hideAtSeconds"],
  }
);

export const UpdateTimedOfferSchema = CreateTimedOfferSchema.partial().extend({
  id: z.string().cuid(),
});

// ====================
// Reward Schemas
// ====================

export const CreateRewardSchema = z.object({
  triggerType: RewardTriggerTypeSchema,
  triggerValue: z
    .string()
    .max(500, "トリガー値は500文字以内で入力してください")
    .optional()
    .nullable(),
  triggerSeconds: z
    .number()
    .int()
    .min(0, "トリガー時間は0秒以上である必要があります")
    .optional()
    .nullable(),
  deliveryType: RewardDeliveryTypeSchema,
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください"),
  description: z
    .string()
    .max(1000, "説明は1000文字以内で入力してください")
    .optional()
    .nullable(),
  deliveryValue: z
    .string()
    .max(2000, "配信値は2000文字以内で入力してください")
    .optional()
    .nullable(),
  inputLabel: z
    .string()
    .max(100, "入力ラベルは100文字以内で入力してください")
    .optional()
    .nullable(),
  inputPlaceholder: z
    .string()
    .max(100, "プレースホルダーは100文字以内で入力してください")
    .optional()
    .nullable(),
  inputValidation: z.string().optional().nullable(),
  options: z
    .array(z.string().max(200))
    .max(20, "選択肢は20個以内である必要があります")
    .optional()
    .nullable(),
  correctAnswer: z
    .string()
    .max(500, "正解は500文字以内で入力してください")
    .optional()
    .nullable(),
  maxClaims: z
    .number()
    .int()
    .min(1, "最大受取数は1以上である必要があります")
    .optional()
    .nullable(),
  isEnabled: z.boolean().default(true),
});

export const UpdateRewardSchema = CreateRewardSchema.partial().extend({
  id: z.string().cuid(),
});

export const ClaimRewardSchema = z.object({
  rewardId: z.string().cuid(),
  sessionToken: z.string().min(1, "セッショントークンは必須です"),
  userInput: z.string().max(1000, "入力は1000文字以内で入力してください").optional(),
  contactId: z.string().cuid().optional(),
});

// ====================
// A/B Test Schemas
// ====================

export const CreateABTestSchema = z.object({
  offerId: z.string().cuid("有効なオファーIDを指定してください"),
  name: z
    .string()
    .min(1, "テスト名は必須です")
    .max(100, "テスト名は100文字以内で入力してください"),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください")
    .optional()
    .nullable(),
  algorithm: ABTestAlgorithmSchema.default("RANDOM"),
  confidenceLevel: z
    .number()
    .min(0.8, "信頼水準は0.8以上である必要があります")
    .max(0.99, "信頼水準は0.99以下である必要があります")
    .default(0.95),
  minSampleSize: z
    .number()
    .int()
    .min(10, "最小サンプルサイズは10以上である必要があります")
    .max(100000, "最小サンプルサイズは100000以下である必要があります")
    .default(100),
  minConversions: z
    .number()
    .int()
    .min(1, "最小コンバージョン数は1以上である必要があります")
    .max(10000, "最小コンバージョン数は10000以下である必要があります")
    .default(10),
  autoOptimize: z.boolean().default(false),
  variants: z
    .array(
      z.object({
        name: z.string().max(50).optional(),
        title: z.string().max(100),
        description: z.string().max(1000).optional().nullable(),
        buttonText: z.string().max(50),
        buttonUrl: z.string().url(),
        countdownEnabled: z.boolean().optional(),
        countdownSeconds: z.number().int().min(0).optional().nullable(),
        limitedSeats: z.number().int().min(0).optional().nullable(),
        popupPosition: PopupPositionSchema.optional(),
        weight: z.number().int().min(1).max(100).default(50),
      })
    )
    .max(5, "バリアントは5つまでです"),
  tenantId: z.string().optional(),
});

export const UpdateABTestSchema = z.object({
  testId: z.string().cuid(),
  action: z.enum(["start", "pause", "complete"]).optional(),
  winnerId: z.string().cuid().optional(),
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  algorithm: ABTestAlgorithmSchema.optional(),
  confidenceLevel: z.number().min(0.8).max(0.99).optional(),
  minSampleSize: z.number().int().min(10).max(100000).optional(),
  minConversions: z.number().int().min(1).max(10000).optional(),
  autoOptimize: z.boolean().optional(),
  tenantId: z.string().optional(),
}).refine(
  (data) => {
    if (data.action === "complete" && !data.winnerId) {
      return false;
    }
    return true;
  },
  {
    message: "テスト完了時は勝者IDが必須です",
    path: ["winnerId"],
  }
);

// ====================
// Notification Schemas
// ====================

export const UpdateNotificationSettingsSchema = z.object({
  isEnabled: z.boolean().optional(),
  reminder30MinEnabled: z.boolean().optional(),
  reminder5MinEnabled: z.boolean().optional(),
  reminder1MinEnabled: z.boolean().optional(),
  startingNowEnabled: z.boolean().optional(),
  replayAvailableEnabled: z.boolean().optional(),
  replayExpiringEnabled: z.boolean().optional(),
  replayExpiringHours: z
    .number()
    .int()
    .min(1)
    .max(168)
    .optional(),
  defaultChannel: NotificationChannelSchema.optional(),
  reminder30MinSubject: z.string().max(100).optional().nullable(),
  reminder30MinBody: z.string().max(2000).optional().nullable(),
  reminder5MinSubject: z.string().max(100).optional().nullable(),
  reminder5MinBody: z.string().max(2000).optional().nullable(),
  startingNowSubject: z.string().max(100).optional().nullable(),
  startingNowBody: z.string().max(2000).optional().nullable(),
  replaySubject: z.string().max(100).optional().nullable(),
  replayBody: z.string().max(2000).optional().nullable(),
  tenantId: z.string().optional(),
});

export const SendTestNotificationSchema = z.object({
  notificationType: z.enum([
    "REMINDER_30MIN",
    "REMINDER_5MIN",
    "REMINDER_1MIN",
    "STARTING_NOW",
    "REPLAY_AVAILABLE",
    "REPLAY_EXPIRING",
    "CUSTOM",
  ]),
  contactId: z.string().cuid(),
  channel: NotificationChannelSchema.optional(),
  tenantId: z.string().optional(),
});

// ====================
// Type exports
// ====================

export type CreateWebinarInput = z.infer<typeof CreateWebinarSchemaWithRefinement>;
export type UpdateWebinarInput = z.infer<typeof UpdateWebinarSchema>;
export type RegisterWebinarInput = z.infer<typeof RegisterWebinarSchema>;
export type StartSessionInput = z.infer<typeof StartSessionSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
export type CreateChatMessageInput = z.infer<typeof CreateChatMessageSchema>;
export type UpdateChatMessageInput = z.infer<typeof UpdateChatMessageSchema>;
export type CreateTimedOfferInput = z.infer<typeof CreateTimedOfferSchemaWithRefinement>;
export type UpdateTimedOfferInput = z.infer<typeof UpdateTimedOfferSchema>;
export type CreateRewardInput = z.infer<typeof CreateRewardSchema>;
export type UpdateRewardInput = z.infer<typeof UpdateRewardSchema>;
export type ClaimRewardInput = z.infer<typeof ClaimRewardSchema>;
export type CreateABTestInput = z.infer<typeof CreateABTestSchema>;
export type UpdateABTestInput = z.infer<typeof UpdateABTestSchema>;
export type UpdateNotificationSettingsInput = z.infer<typeof UpdateNotificationSettingsSchema>;
export type SendTestNotificationInput = z.infer<typeof SendTestNotificationSchema>;

// ====================
// Helper function
// ====================

/**
 * バリデーションエラーをフォーマットして返す
 */
export function formatValidationErrors(error: z.ZodError) {
  return {
    error: "Validation failed",
    details: error.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })),
  };
}
