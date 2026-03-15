/**
 * MCP Tool Definitions
 * 全ツールのスキーマ定義（inputSchema）
 */

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: "object"
    properties: Record<string, unknown>
    required?: string[]
  }
}

export const TOOLS: MCPTool[] = [
  // ============================================================
  // コンタクト管理 (5)
  // ============================================================
  {
    name: "contacts_list",
    description: "連絡先（リード・顧客）の一覧を取得する。名前・メール検索、タグフィルタ対応。",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "取得件数 (最大100)", default: 20 },
        search: { type: "string", description: "名前またはメールで検索" },
        tag: { type: "string", description: "タグ名でフィルタ" },
      },
    },
  },
  {
    name: "contacts_create",
    description: "新しい連絡先を作成する。既存のメールアドレスの場合は既存データを返す。",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "メールアドレス" },
        name: { type: "string", description: "名前" },
        phone: { type: "string", description: "電話番号" },
      },
      required: ["email"],
    },
  },
  {
    name: "contacts_search",
    description: "連絡先をメールアドレスで部分一致検索する",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "検索するメールアドレス（部分一致）" },
      },
      required: ["email"],
    },
  },
  {
    name: "contacts_update",
    description: "連絡先の情報を更新する",
    inputSchema: {
      type: "object",
      properties: {
        contactId: { type: "string", description: "連絡先ID" },
        name: { type: "string", description: "名前" },
        phone: { type: "string", description: "電話番号" },
        lifecycleStage: { type: "string", description: "ライフサイクルステージ" },
      },
      required: ["contactId"],
    },
  },
  {
    name: "contacts_add_tag",
    description: "連絡先にタグを追加する",
    inputSchema: {
      type: "object",
      properties: {
        contactId: { type: "string", description: "連絡先ID" },
        tagName: { type: "string", description: "タグ名（存在しなければ自動作成）" },
      },
      required: ["contactId", "tagName"],
    },
  },

  // ============================================================
  // タグ管理 (2)
  // ============================================================
  {
    name: "tags_list",
    description: "タグの一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "タグ名で検索" },
      },
    },
  },
  {
    name: "tags_create",
    description: "新しいタグを作成する",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "タグ名" },
        color: { type: "string", description: "色コード (#FFFFFF形式)" },
      },
      required: ["name"],
    },
  },

  // ============================================================
  // キャンペーン (3)
  // ============================================================
  {
    name: "campaigns_list",
    description: "メール/LINE/SMSキャンペーンの一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"],
          description: "ステータスでフィルタ",
        },
        type: {
          type: "string",
          enum: ["EMAIL_STEP", "EMAIL_BROADCAST", "LINE_STEP", "LINE_BROADCAST", "SMS_BROADCAST"],
          description: "種別でフィルタ",
        },
        limit: { type: "number", description: "取得件数 (最大50)", default: 20 },
      },
    },
  },
  {
    name: "campaigns_get",
    description: "キャンペーンの詳細情報をステップ付きで取得する",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "キャンペーンID" },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "campaigns_update_status",
    description: "キャンペーンのステータスを変更する（有効化・一時停止・アーカイブ）",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "キャンペーンID" },
        status: {
          type: "string",
          enum: ["ACTIVE", "PAUSED", "ARCHIVED"],
          description: "新しいステータス",
        },
      },
      required: ["campaignId", "status"],
    },
  },

  // ============================================================
  // 商品・注文・サブスクリプション (4)
  // ============================================================
  {
    name: "products_list",
    description: "商品・サービスの一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["ONE_TIME", "SUBSCRIPTION", "PAYMENT_PLAN"],
          description: "商品タイプでフィルタ",
        },
        isActive: { type: "boolean", description: "アクティブな商品のみ", default: true },
        limit: { type: "number", description: "取得件数 (最大50)", default: 20 },
      },
    },
  },
  {
    name: "orders_list",
    description: "注文の一覧を取得する。売上データの確認に使用。",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"],
          description: "ステータスでフィルタ",
        },
        contactId: { type: "string", description: "連絡先IDでフィルタ" },
        limit: { type: "number", description: "取得件数 (最大100)", default: 20 },
      },
    },
  },
  {
    name: "orders_get",
    description: "注文の詳細情報を取得する",
    inputSchema: {
      type: "object",
      properties: {
        orderId: { type: "string", description: "注文ID" },
      },
      required: ["orderId"],
    },
  },
  {
    name: "subscriptions_list",
    description: "サブスクリプション（定期課金）の一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["ACTIVE", "PAST_DUE", "CANCELED", "UNPAID", "PAUSED"],
          description: "ステータスでフィルタ",
        },
        limit: { type: "number", description: "取得件数 (最大50)", default: 20 },
      },
    },
  },

  // ============================================================
  // CRMパイプライン (4)
  // ============================================================
  {
    name: "pipeline_list",
    description: "CRMパイプラインとステージの一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "deals_list",
    description: "商談（ディール）の一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        pipelineId: { type: "string", description: "パイプラインIDでフィルタ" },
        status: { type: "string", enum: ["OPEN", "WON", "LOST"], description: "ステータスでフィルタ" },
        limit: { type: "number", description: "取得件数 (最大50)", default: 20 },
      },
    },
  },
  {
    name: "deals_create",
    description: "新しい商談を作成する",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "商談タイトル" },
        pipelineId: { type: "string", description: "パイプラインID" },
        stageId: { type: "string", description: "ステージID" },
        contactId: { type: "string", description: "関連する連絡先ID" },
        amount: { type: "number", description: "金額" },
        currency: { type: "string", description: "通貨コード", default: "JPY" },
      },
      required: ["title", "pipelineId", "stageId"],
    },
  },
  {
    name: "deals_update",
    description: "商談のステージやステータスを更新する",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "string", description: "商談ID" },
        stageId: { type: "string", description: "移動先ステージID" },
        status: { type: "string", enum: ["OPEN", "WON", "LOST"], description: "ステータス" },
        amount: { type: "number", description: "金額" },
      },
      required: ["dealId"],
    },
  },

  // ============================================================
  // イベント (3)
  // ============================================================
  {
    name: "events_list",
    description: "イベント・セミナー・ウェビナーの一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELED"],
          description: "ステータスでフィルタ",
        },
        type: {
          type: "string",
          enum: ["SEMINAR", "CONSULTATION", "WEBINAR", "LIVESTREAM"],
          description: "種別でフィルタ",
        },
        limit: { type: "number", description: "取得件数 (最大50)", default: 10 },
      },
    },
  },
  {
    name: "events_create",
    description: "新しいイベントを作成する",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "イベント名" },
        type: {
          type: "string",
          enum: ["SEMINAR", "CONSULTATION", "WEBINAR", "LIVESTREAM"],
          description: "イベント種別",
        },
        startAt: { type: "string", description: "開始日時 (ISO 8601形式)" },
        endAt: { type: "string", description: "終了日時 (ISO 8601形式)" },
        isOnline: { type: "boolean", description: "オンライン開催かどうか", default: true },
        description: { type: "string", description: "説明" },
        capacity: { type: "number", description: "定員" },
      },
      required: ["name", "type", "startAt", "endAt"],
    },
  },
  {
    name: "event_registrations_list",
    description: "イベント参加登録の一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        eventId: { type: "string", description: "イベントID" },
        status: {
          type: "string",
          enum: ["REGISTERED", "CONFIRMED", "ATTENDED", "NO_SHOW", "CANCELED"],
          description: "参加ステータスでフィルタ",
        },
      },
      required: ["eventId"],
    },
  },

  // ============================================================
  // ファネル (2)
  // ============================================================
  {
    name: "funnels_list",
    description: "セールスファネルの一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "取得件数 (最大20)", default: 10 },
      },
    },
  },
  {
    name: "funnels_get",
    description: "ファネルの詳細情報（ページ・ステップ・PV・コンバージョン）を取得する",
    inputSchema: {
      type: "object",
      properties: {
        funnelId: { type: "string", description: "ファネルID" },
      },
      required: ["funnelId"],
    },
  },

  // ============================================================
  // フォーム (2)
  // ============================================================
  {
    name: "forms_list",
    description: "フォームの一覧を取得する（回答数付き）",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["DRAFT", "PUBLISHED", "CLOSED"], description: "ステータスでフィルタ" },
        limit: { type: "number", description: "取得件数 (最大20)", default: 10 },
      },
    },
  },
  {
    name: "form_submissions_list",
    description: "フォームの回答一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        formId: { type: "string", description: "フォームID" },
        limit: { type: "number", description: "取得件数 (最大100)", default: 20 },
      },
      required: ["formId"],
    },
  },

  // ============================================================
  // 動画管理 (1)
  // ============================================================
  {
    name: "videos_list",
    description: "動画コンテンツの一覧を取得する（ゲートリード数付き）",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"], description: "ステータスでフィルタ" },
        limit: { type: "number", description: "取得件数 (最大20)", default: 10 },
      },
    },
  },

  // ============================================================
  // 会員サイト・コース (3)
  // ============================================================
  {
    name: "courses_list",
    description: "会員サイト・オンラインコースの一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        isPublished: { type: "boolean", description: "公開済みのみ" },
        limit: { type: "number", description: "取得件数 (最大20)", default: 10 },
      },
    },
  },
  {
    name: "courses_get",
    description: "コースの詳細情報（レッスン一覧・受講者数付き）を取得する",
    inputSchema: {
      type: "object",
      properties: {
        courseId: { type: "string", description: "コースID" },
      },
      required: ["courseId"],
    },
  },
  {
    name: "enrollments_list",
    description: "コース受講者の一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        courseId: { type: "string", description: "コースID" },
        limit: { type: "number", description: "取得件数 (最大100)", default: 20 },
      },
      required: ["courseId"],
    },
  },

  // ============================================================
  // 自動化・ジャーニー (3)
  // ============================================================
  {
    name: "automation_rules_list",
    description: "自動化ルールの一覧を取得する（トリガー・アクション付き）",
    inputSchema: {
      type: "object",
      properties: {
        isActive: { type: "boolean", description: "有効なルールのみ" },
        limit: { type: "number", description: "取得件数 (最大20)", default: 10 },
      },
    },
  },
  {
    name: "automation_executions_list",
    description: "自動化ルールの実行履歴を取得する",
    inputSchema: {
      type: "object",
      properties: {
        ruleId: { type: "string", description: "ルールIDでフィルタ" },
        status: { type: "string", enum: ["SUCCESS", "FAILED", "SKIPPED"], description: "ステータスでフィルタ" },
        limit: { type: "number", description: "取得件数 (最大50)", default: 20 },
      },
    },
  },
  {
    name: "journeys_list",
    description: "カスタマージャーニーの一覧を取得する（ノード数付き）",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"], description: "ステータスでフィルタ" },
        limit: { type: "number", description: "取得件数 (最大20)", default: 10 },
      },
    },
  },

  // ============================================================
  // セグメント (1)
  // ============================================================
  {
    name: "segments_list",
    description: "オーディエンスセグメントの一覧を取得する（メンバー数付き）",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "取得件数 (最大20)", default: 10 },
      },
    },
  },

  // ============================================================
  // LINE連携 (2)
  // ============================================================
  {
    name: "line_projects_list",
    description: "LINEプロジェクトの一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "line_accounts_list",
    description: "LINE公式アカウントの一覧を取得する（友だち数付き）",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "プロジェクトIDでフィルタ" },
      },
    },
  },

  // ============================================================
  // Meta広告 (1)
  // ============================================================
  {
    name: "meta_ads_report",
    description: "Meta広告（Facebook/Instagram）のパフォーマンスレポートを取得する",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "過去何日間のデータか", default: 30 },
        accountId: { type: "string", description: "広告アカウントIDでフィルタ" },
      },
    },
  },

  // ============================================================
  // アフィリエイト (3)
  // ============================================================
  {
    name: "partners_list",
    description: "アフィリエイトパートナーの一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["PENDING", "ACTIVE", "SUSPENDED"], description: "ステータスでフィルタ" },
        limit: { type: "number", description: "取得件数 (最大50)", default: 20 },
      },
    },
  },
  {
    name: "affiliate_conversions_list",
    description: "アフィリエイトコンバージョンの一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        partnerId: { type: "string", description: "パートナーIDでフィルタ" },
        status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "PAID"], description: "ステータスでフィルタ" },
        limit: { type: "number", description: "取得件数 (最大100)", default: 20 },
      },
    },
  },
  {
    name: "affiliate_stats",
    description: "アフィリエイトプログラム全体の統計を取得する",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "過去何日間のデータか", default: 30 },
      },
    },
  },

  // ============================================================
  // ライブ配信・ウェビナー (2)
  // ============================================================
  {
    name: "livestreams_list",
    description: "ライブ配信の一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["SCHEDULED", "LIVE", "COMPLETED", "CANCELED"],
          description: "ステータスでフィルタ",
        },
        limit: { type: "number", description: "取得件数 (最大20)", default: 10 },
      },
    },
  },
  {
    name: "auto_webinars_list",
    description: "自動ウェビナー（エバーグリーン）の一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"],
          description: "ステータスでフィルタ",
        },
        limit: { type: "number", description: "取得件数 (最大20)", default: 10 },
      },
    },
  },

  // ============================================================
  // 分析・レポート (4)
  // ============================================================
  {
    name: "analytics_summary",
    description: "マーケティング指標の総合サマリーを取得する（コンタクト数・注文数・売上・イベントなど）",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "過去何日間のデータか", default: 30 },
      },
    },
  },
  {
    name: "analytics_revenue",
    description: "売上・収益の分析データを取得する",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "過去何日間のデータか", default: 30 },
      },
    },
  },
  {
    name: "analytics_utm",
    description: "UTMパラメータ別の流入分析データを取得する",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "過去何日間のデータか", default: 30 },
        limit: { type: "number", description: "上位何件を取得するか", default: 10 },
      },
    },
  },

  // ============================================================
  // グローバル検索 (1)
  // ============================================================
  {
    name: "search_global",
    description: "連絡先・イベント・ファネル・商品・コースを横断検索する",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "検索キーワード" },
        limit: { type: "number", description: "各カテゴリの取得件数", default: 5 },
      },
      required: ["query"],
    },
  },

  // ============================================================
  // メッセージ送信 (4)
  // ============================================================
  {
    name: "email_send",
    description: "連絡先にメールを送信する（個別 or 複数指定）",
    inputSchema: {
      type: "object",
      properties: {
        contactIds: {
          type: "array",
          items: { type: "string" },
          description: "送信先の連絡先IDリスト",
        },
        subject: { type: "string", description: "メール件名" },
        html: { type: "string", description: "メール本文（HTML）" },
        text: { type: "string", description: "メール本文（プレーンテキスト）" },
      },
      required: ["contactIds", "subject"],
    },
  },
  {
    name: "line_send",
    description: "LINEメッセージを送信する（個別 or 複数指定）。LINE連携済みの連絡先にのみ送信可能。",
    inputSchema: {
      type: "object",
      properties: {
        contactIds: {
          type: "array",
          items: { type: "string" },
          description: "送信先の連絡先IDリスト",
        },
        message: { type: "string", description: "送信するテキストメッセージ" },
      },
      required: ["contactIds", "message"],
    },
  },
  {
    name: "sms_send",
    description: "SMSメッセージを送信する（個別 or 複数指定）。電話番号が登録済みの連絡先にのみ送信可能。",
    inputSchema: {
      type: "object",
      properties: {
        contactIds: {
          type: "array",
          items: { type: "string" },
          description: "送信先の連絡先IDリスト",
        },
        message: { type: "string", description: "送信するSMSメッセージ（70文字推奨）" },
      },
      required: ["contactIds", "message"],
    },
  },
  {
    name: "message_send_by_tag",
    description: "指定タグの全連絡先にメッセージを一斉送信する。チャネル（EMAIL/LINE/SMS）を指定。",
    inputSchema: {
      type: "object",
      properties: {
        tagName: { type: "string", description: "送信対象のタグ名" },
        channel: {
          type: "string",
          enum: ["EMAIL", "LINE", "SMS"],
          description: "送信チャネル",
        },
        subject: { type: "string", description: "メール件名（EMAIL時のみ必須）" },
        message: { type: "string", description: "送信メッセージ（LINE/SMS時のメッセージ本文、またはメールのHTML）" },
      },
      required: ["tagName", "channel", "message"],
    },
  },

  // ============================================================
  // メッセージ履歴・開封追跡 (2)
  // ============================================================
  {
    name: "messages_list",
    description: "メッセージ送信履歴を取得する。開封・クリック状況、未開封者のフィルタリングが可能。",
    inputSchema: {
      type: "object",
      properties: {
        contactId: { type: "string", description: "連絡先IDでフィルタ" },
        campaignId: { type: "string", description: "キャンペーンIDでフィルタ" },
        channel: { type: "string", enum: ["EMAIL", "LINE", "SMS"], description: "チャネルでフィルタ" },
        status: {
          type: "string",
          enum: ["PENDING", "SENT", "DELIVERED", "OPENED", "CLICKED", "BOUNCED", "FAILED"],
          description: "ステータスでフィルタ（例: OPENEDで開封済みのみ）",
        },
        notOpened: {
          type: "boolean",
          description: "trueにすると未開封のメッセージのみ取得（openedAtがnullのSENT/DELIVERED）",
        },
        limit: { type: "number", description: "取得件数 (最大100)", default: 50 },
      },
    },
  },
  {
    name: "messages_open_report",
    description: "キャンペーンまたは期間の開封・クリックレポートを取得する。開封率・クリック率・未開封者リスト付き。",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "キャンペーンIDでフィルタ" },
        days: { type: "number", description: "過去何日間のデータか", default: 7 },
        channel: { type: "string", enum: ["EMAIL", "LINE", "SMS"], description: "チャネルでフィルタ" },
      },
    },
  },

  // ============================================================
  // イベントリマインダー (1)
  // ============================================================
  {
    name: "event_send_reminder",
    description: "イベント申込者にリマインドメール/LINEを送信する。未送信者のみ・全員を選択可能。",
    inputSchema: {
      type: "object",
      properties: {
        eventId: { type: "string", description: "イベントID" },
        channel: { type: "string", enum: ["EMAIL", "LINE", "SMS"], description: "送信チャネル", default: "EMAIL" },
        subject: { type: "string", description: "メール件名（EMAIL時のみ）" },
        message: { type: "string", description: "リマインドメッセージ" },
        onlyUnreminded: { type: "boolean", description: "trueにするとリマインド未送信者のみ", default: true },
      },
      required: ["eventId", "message"],
    },
  },

  // ============================================================
  // 条件タグ付与 (1)
  // ============================================================
  {
    name: "contacts_bulk_tag",
    description: "条件に合致する連絡先に一括でタグを付与する。ライフサイクルステージ・スコア・日付・既存タグで条件指定可能。",
    inputSchema: {
      type: "object",
      properties: {
        tagName: { type: "string", description: "付与するタグ名（存在しなければ自動作成）" },
        conditions: {
          type: "object",
          description: "フィルタ条件（AND条件で全て適用）",
          properties: {
            lifecycleStage: { type: "string", description: "ライフサイクルステージ（SUBSCRIBER/LEAD/MQL/SQL/OPPORTUNITY/CUSTOMER/EVANGELIST）" },
            minScore: { type: "number", description: "最低スコア" },
            hasTag: { type: "string", description: "このタグが付いている連絡先" },
            notHasTag: { type: "string", description: "このタグが付いていない連絡先" },
            createdAfter: { type: "string", description: "この日時以降に作成（ISO 8601）" },
            createdBefore: { type: "string", description: "この日時以前に作成（ISO 8601）" },
            emailOptIn: { type: "boolean", description: "メール配信許可している連絡先" },
            hasLineUserId: { type: "boolean", description: "LINE連携済みの連絡先" },
          },
        },
      },
      required: ["tagName", "conditions"],
    },
  },

  // ============================================================
  // ファネルページ作成・更新 (2)
  // ============================================================
  {
    name: "funnel_page_create",
    description: "ファネルに新しいLP（ランディングページ）を追加する。コンポーネント配列でページ内容を指定。nanobanana2スキル等で生成したHTMLをcustom-htmlコンポーネントとして挿入可能。",
    inputSchema: {
      type: "object",
      properties: {
        funnelId: { type: "string", description: "ファネルID" },
        name: { type: "string", description: "ページ名" },
        slug: { type: "string", description: "URLスラッグ（例: lp-spring-2024）" },
        content: {
          type: "array",
          description: "ページコンポーネント配列。各要素は { componentType, props, order } 形式。componentType: hero/headline/text/cta-button/image/testimonial/feature/faq/video/countdown/custom-html 等",
          items: {
            type: "object",
            properties: {
              componentType: { type: "string", description: "コンポーネント種別" },
              props: { type: "object", description: "コンポーネントのプロパティ" },
              order: { type: "number", description: "表示順" },
            },
          },
        },
        seoTitle: { type: "string", description: "SEOタイトル" },
        seoDescription: { type: "string", description: "SEOディスクリプション" },
      },
      required: ["funnelId", "name", "slug", "content"],
    },
  },
  {
    name: "funnel_page_update",
    description: "既存のファネルページの内容を更新する。コンポーネント配列を上書き。",
    inputSchema: {
      type: "object",
      properties: {
        pageId: { type: "string", description: "ページID" },
        name: { type: "string", description: "ページ名" },
        content: {
          type: "array",
          description: "新しいページコンポーネント配列",
          items: {
            type: "object",
            properties: {
              componentType: { type: "string", description: "コンポーネント種別" },
              props: { type: "object", description: "コンポーネントのプロパティ" },
              order: { type: "number", description: "表示順" },
            },
          },
        },
        seoTitle: { type: "string", description: "SEOタイトル" },
        seoDescription: { type: "string", description: "SEOディスクリプション" },
      },
      required: ["pageId"],
    },
  },

  // ============================================================
  // タグ削除 (1)
  // ============================================================
  {
    name: "contacts_remove_tag",
    description: "連絡先からタグを削除する",
    inputSchema: {
      type: "object",
      properties: {
        contactId: { type: "string", description: "連絡先ID" },
        tagName: { type: "string", description: "削除するタグ名" },
      },
      required: ["contactId", "tagName"],
    },
  },

  // LINE連携拡張 (5)
  // ============================================================
  {
    name: "line_rich_menu_list",
    description: "LINEリッチメニューの一覧を取得する。セグメント条件やタブグループ情報を含む。",
    inputSchema: {
      type: "object",
      properties: {
        tabGroup: { type: "string", description: "タブグループ名でフィルタ" },
      },
    },
  },
  {
    name: "line_rich_menu_switch",
    description: "ユーザーのリッチメニューをタブグループ内で切り替える",
    inputSchema: {
      type: "object",
      properties: {
        lineUserId: { type: "string", description: "LINE User ID" },
        tabGroup: { type: "string", description: "タブグループ名" },
        tabOrder: { type: "number", description: "切り替え先のタブ番号 (0始まり)" },
      },
      required: ["lineUserId", "tabGroup"],
    },
  },
  {
    name: "line_auto_reply_list",
    description: "LINEキーワード自動応答ルールの一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        activeOnly: { type: "boolean", description: "有効なルールのみ取得", default: false },
      },
    },
  },
  {
    name: "line_auto_reply_create",
    description: "LINEキーワード自動応答ルールを作成する",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "ルール名" },
        keyword: { type: "string", description: "キーワード" },
        matchType: { type: "string", description: "マッチタイプ (exact/contains/startsWith/regex)", default: "contains" },
        replyText: { type: "string", description: "返信テキスト" },
        priority: { type: "number", description: "優先度 (高い値ほど優先)", default: 0 },
      },
      required: ["name", "keyword", "replyText"],
    },
  },
  {
    name: "line_segment_send",
    description: "セグメント条件に一致する連絡先にLINEメッセージを一斉配信する",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "送信するメッセージ" },
        tagName: { type: "string", description: "タグ名でフィルタ" },
        minScore: { type: "number", description: "最低スコアでフィルタ" },
        source: { type: "string", description: "流入元でフィルタ" },
      },
      required: ["message"],
    },
  },

  // LPビルダー (3)
  // ============================================================
  {
    name: "lp_component_list",
    description: "LPビルダーで使用可能なコンポーネント一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "カテゴリでフィルタ (basic/headline/content/video/form/button/line/payment/layout/social/other)" },
      },
    },
  },
  {
    name: "lp_template_list",
    description: "LPテンプレート一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "カテゴリでフィルタ (optin/sales/webinar/launch/consultation/membership/event)" },
      },
    },
  },
  {
    name: "lp_page_create_from_template",
    description: "テンプレートからLPページを作成する",
    inputSchema: {
      type: "object",
      properties: {
        funnelId: { type: "string", description: "ファネルID" },
        templateId: { type: "string", description: "テンプレートID" },
        pageName: { type: "string", description: "ページ名" },
        slug: { type: "string", description: "URLスラッグ" },
      },
      required: ["funnelId", "templateId", "pageName", "slug"],
    },
  },
  {
    name: "livestream_list",
    description: "ライブ配信の一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: { type: "string", description: "テナントID" },
        status: { type: "string", description: "ステータスでフィルタ (SCHEDULED/LIVE/COMPLETED/CANCELED)" },
        limit: { type: "number", description: "取得件数 (デフォルト20)" },
      },
      required: ["tenantId"],
    },
  },
  {
    name: "livestream_create",
    description: "新しいライブ配信をスケジュールする",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: { type: "string", description: "テナントID" },
        name: { type: "string", description: "ライブ配信名" },
        description: { type: "string", description: "説明" },
        startAt: { type: "string", description: "開始日時 (ISO 8601形式)" },
        eventId: { type: "string", description: "関連イベントID" },
        chatEnabled: { type: "boolean", description: "チャット有効 (デフォルトtrue)" },
        recordingEnabled: { type: "boolean", description: "録画有効 (デフォルトfalse)" },
      },
      required: ["tenantId", "name", "startAt"],
    },
  },
  {
    name: "livestream_update_status",
    description: "ライブ配信のステータスを更新する（開始/終了/キャンセル）",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: { type: "string", description: "テナントID" },
        livestreamId: { type: "string", description: "ライブ配信ID" },
        status: { type: "string", description: "新しいステータス (SCHEDULED/LIVE/COMPLETED/CANCELED)" },
      },
      required: ["tenantId", "livestreamId", "status"],
    },
  },
  {
    name: "livestream_chat_list",
    description: "ライブ配信のチャットメッセージ一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: { type: "string", description: "テナントID" },
        livestreamId: { type: "string", description: "ライブ配信ID" },
        limit: { type: "number", description: "取得件数 (デフォルト50)" },
      },
      required: ["tenantId", "livestreamId"],
    },
  },
  {
    name: "livestream_chat_send",
    description: "ライブ配信にシステムメッセージを送信する（お知らせ等）",
    inputSchema: {
      type: "object",
      properties: {
        tenantId: { type: "string", description: "テナントID" },
        livestreamId: { type: "string", description: "ライブ配信ID" },
        content: { type: "string", description: "メッセージ内容" },
        senderName: { type: "string", description: "送信者名 (デフォルト「システム」)" },
        messageType: { type: "string", description: "メッセージタイプ (デフォルトANNOUNCEMENT)" },
      },
      required: ["tenantId", "livestreamId", "content"],
    },
  },
]
