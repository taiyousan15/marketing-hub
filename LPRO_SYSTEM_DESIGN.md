# LPRO同等システム - 完全設計書

**作成日**: 2026年2月1日
**分析元**: https://lpro-pm3.com/manage/ (42画面を解析)

---

## 1. LPROの機能マップ（実際の画面から抽出）

### 1.1 ユーザー管理
| 画面 | URL | 機能 |
|------|-----|------|
| ユーザー一覧 | member | 全ユーザーの一覧・検索 |
| グループ設定 | member_group | ユーザーをグループ分け |
| ランク設定 | member_rank | ユーザーランク（VIP等） |
| ラベル設定 | member_tag | タグ付け機能 |
| 検索一括処理 | lumping | 条件検索→一括アクション |
| 検索ショートカット | lumping_shortcut | よく使う検索条件を保存 |

### 1.2 LINE公式アカウント管理（核心機能）
| 画面 | URL | 機能 |
|------|-----|------|
| LINE連携 | line_mapi | **500アカウント管理** |
| LINE連携一括処理 | line_mapi_lumping | 複数アカウント一括操作 |
| LINE連携インポート | line_mapi_import | アカウント一括登録 |
| ユーザー分布 | line_push_member_view | **アカウント別ユーザー数/日別推移** |
| 配信数レポート | line_push_counter | アカウント別配信実績 |
| 切り替え履歴 | line_mapi_change_history | **BAN救出の履歴** |
| リッチメニュー管理 | line_richmenu | リッチメニュー設定 |

### 1.3 メッセージ配信
| 画面 | URL | 機能 |
|------|-----|------|
| メッセージ自動シナリオ | auto_info_group | ステップメール（メール） |
| メッセージ一斉配信 | reserve_mail | 一斉メール配信 |
| メッセージ定時配信 | reserve_daily_mail | 毎日定時配信 |
| 配信文テンプレート | reserve_mail_template | テンプレート管理 |

### 1.4 LINE配信
| 画面 | URL | 機能 |
|------|-----|------|
| シナリオ 時間経過型 | auto_line_mail_group?type=1 | 登録からX日後に配信 |
| シナリオ スケジュール型 | auto_line_mail_group?type=2 | 特定日時に配信 |
| 一斉配信 | line_mail | LINE一斉配信 |
| 定時配信 | line_daily_mail | LINE毎日定時 |
| キーワード自動返信 | linechat_response | トリガーワード応答 |
| 配信履歴 | line_mail_history | 配信ログ |

### 1.5 チャット対応
| 画面 | URL | 機能 |
|------|-----|------|
| トーク応対 | linechat_message_frame | リアルタイムチャット |
| トークキャラ設定 | linechat_char | 応対者のキャラクター |
| トーク応対履歴 | member_linechat | チャット履歴 |

### 1.6 カスタムアクション
| 画面 | URL | 機能 |
|------|-----|------|
| カスタムアクション | custom_action | URL別アクション設定 |
| カスタムアクション集計 | custom_action_view | アクション効果測定 |

### 1.7 レポート・集計
| 画面 | URL | 機能 |
|------|-----|------|
| 全体集計 | access_year_view | 年間サマリー |
| メッセージシナリオ効果 | auto_info_view | メールシナリオ効果 |
| ダイレクトシナリオ効果 | auto_line_mail_view | LINEシナリオ効果 |

### 1.8 管理
| 画面 | URL | 機能 |
|------|-----|------|
| 運用サービス管理 | site_domains2 | ドメイン・サイト設定 |
| ログインスタッフ管理 | staff | 管理者アカウント |

---

## 2. LPROのコアアルゴリズム（解析結果）

### 2.1 アカウント状態管理

```
状態フラグ:
├── status: 有効(1), 予備無効(2), 一時無効(3), 完全無効(4)
├── fail_flag: OK(1), Fail(2) → BAN検知
├── webhook_flag: OK(1), NG(2) → Webhook正常性
├── token_flag: 取得済み(1), NoToken(2) → API接続状態
└── rand_exclude_flag: 候補(1), 除外(2) → 振り分け対象
```

### 2.2 ユーザー振り分けロジック

```
1. LP/広告 → 振り分けURL (lpro-pm3.com/r/XXXX)
2. 振り分けURL → アカウント選択アルゴリズム:
   - 条件1: status = 有効(1)
   - 条件2: fail_flag = OK(1)
   - 条件3: rand_exclude_flag = 候補(1)
   - 条件4: member_count < 閾値
3. 選択されたアカウントの友だち追加URLへリダイレクト
```

### 2.3 BAN検知・救出ロジック

```
BAN検知:
1. Webhook応答を監視
2. API呼び出し失敗を検知
3. fail_flag → Fail に更新
4. status → 一時無効(3) に変更

ユーザー救出:
1. BANアカウントのユーザーを抽出
2. 別アカ誘導 = する のアカウントを対象
3. 生存アカウント（status=有効, fail_flag=OK）へ移動
4. 切り替え履歴に記録
5. ユーザーに通知メッセージ送信
```

---

## 3. 実装する機能（LPRO同等+強化）

### 3.1 Phase 1: コア機能

| 機能 | LPRO | 新システム | 優位性 |
|------|------|-----------|--------|
| アカウント数 | 500 | **無制限** | 制限なし |
| 振り分け方式 | ランダム | **AI最適化** | 広告効果で最適配分 |
| BAN検知 | Webhook失敗 | **予測検知** | BAN前に警告 |
| 救出先 | LINE他アカ | **マルチチャネル** | メール/SMS/LINE |
| UI | iframe古め | **モダンSPA** | React/Next.js |

### 3.2 Phase 2: 強化機能

| 機能 | 説明 |
|------|------|
| AIメッセージ生成 | Claude APIでメッセージ自動作成 |
| A/Bテスト自動最適化 | 開封率で配信内容を自動調整 |
| リアルタイムダッシュボード | 全アカウント状態を可視化 |
| 予測分析 | ユーザー離脱予測・最適配信時間 |

---

## 4. データベース設計（Prisma Schema）

```prisma
// ==================== LINEアカウント管理 ====================

model LineAccount {
  id              String   @id @default(cuid())
  tenantId        String

  // LINE公式アカウント情報
  basicId         String   // @line-xxxxx
  displayName     String
  channelId       String?
  channelSecret   String?
  accessToken     String?

  // 状態管理（LPRO互換）
  status          LineAccountStatus @default(ACTIVE)
  failFlag        Boolean  @default(false)  // BAN検知
  webhookFlag     Boolean  @default(true)   // Webhook正常
  tokenFlag       Boolean  @default(false)  // トークン取得済み

  // 振り分け設定
  randExcludeFlag RandExcludeFlag @default(CANDIDATE)
  redirectEnabled Boolean  @default(true)   // 別アカ誘導

  // ユーザー数
  memberCount         Int  @default(0)  // 合計友だち数
  memberNonblockCount Int  @default(0)  // 有効友だち数
  maxCapacity         Int  @default(5000) // 最大収容人数

  // BAN検知用
  lastHealthCheck DateTime?
  healthScore     Int      @default(100)  // 0-100
  banRiskLevel    String   @default("low") // low/medium/high

  // メモ
  memo            String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // リレーション
  contacts        LineAccountContact[]
  switchHistoryFrom SwitchHistory[] @relation("FromAccount")
  switchHistoryTo   SwitchHistory[] @relation("ToAccount")
  distributions   AccountDistribution[]

  @@index([tenantId])
  @@index([tenantId, status])
  @@index([tenantId, failFlag])
}

enum LineAccountStatus {
  ACTIVE           // 有効
  STANDBY_DISABLED // 予備無効
  TEMP_DISABLED    // 一時無効
  FULLY_DISABLED   // 完全無効
}

enum RandExcludeFlag {
  NONE      // 指定なし
  CANDIDATE // 候補（振り分け対象）
  EXCLUDED  // 除外（振り分け対象外）
}

// アカウント⇔ユーザー紐付け
model LineAccountContact {
  id            String      @id @default(cuid())
  lineAccountId String
  lineAccount   LineAccount @relation(fields: [lineAccountId], references: [id])
  contactId     String

  // LINE情報
  lineUserId    String
  displayName   String?
  pictureUrl    String?

  // ステータス
  isBlocked     Boolean  @default(false)
  isFollowing   Boolean  @default(true)

  // 流入情報
  adCode        String?  // 広告コード
  sourceUrl     String?  // 流入元URL

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([lineAccountId, contactId])
  @@unique([lineAccountId, lineUserId])
  @@index([contactId])
  @@index([adCode])
}

// 切り替え履歴
model SwitchHistory {
  id              String      @id @default(cuid())
  tenantId        String
  contactId       String

  fromAccountId   String
  fromAccount     LineAccount @relation("FromAccount", fields: [fromAccountId], references: [id])
  toAccountId     String
  toAccount       LineAccount @relation("ToAccount", fields: [toAccountId], references: [id])

  reason          SwitchReason
  switchedAt      DateTime    @default(now())

  // 旧LINE情報
  oldLineUserId   String
  // 新LINE情報（再登録後に更新）
  newLineUserId   String?

  @@index([tenantId])
  @@index([contactId])
  @@index([switchedAt])
}

enum SwitchReason {
  BAN_DETECTED     // BAN検知による自動移動
  MANUAL           // 手動移動
  LOAD_BALANCING   // 負荷分散
  CAPACITY_REACHED // 容量上限
}

// アカウント別ユーザー分布（日別）
model AccountDistribution {
  id              String      @id @default(cuid())
  lineAccountId   String
  lineAccount     LineAccount @relation(fields: [lineAccountId], references: [id])

  date            DateTime    @db.Date

  // その日のユーザー数
  totalCount      Int  @default(0)
  activeCount     Int  @default(0)
  blockedCount    Int  @default(0)
  newCount        Int  @default(0)  // その日の新規

  @@unique([lineAccountId, date])
  @@index([date])
}

// ==================== 振り分けURL管理 ====================

model DistributionUrl {
  id          String   @id @default(cuid())
  tenantId    String

  code        String   @unique  // 短縮コード
  name        String

  // 振り分け設定
  algorithm   DistributionAlgorithm @default(RANDOM)

  // 広告トラッキング
  adCode      String?  // 広告コード（UTMなど）

  // アクセス数
  accessCount Int      @default(0)

  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([code])
  @@index([adCode])
}

enum DistributionAlgorithm {
  RANDOM          // ランダム
  ROUND_ROBIN     // 順番
  LEAST_USERS     // 最少ユーザー優先
  WEIGHTED        // 重み付け
  AI_OPTIMIZED    // AI最適化
}

// ==================== BAN検知・予測 ====================

model AccountHealthLog {
  id              String      @id @default(cuid())
  lineAccountId   String

  checkType       HealthCheckType
  status          HealthStatus

  // 詳細
  responseCode    Int?
  errorMessage    String?
  responseTimeMs  Int?

  checkedAt       DateTime    @default(now())

  @@index([lineAccountId])
  @@index([checkedAt])
}

enum HealthCheckType {
  WEBHOOK         // Webhook応答
  API_CALL        // API呼び出し
  MESSAGE_SEND    // メッセージ送信
  USER_INFO       // ユーザー情報取得
}

enum HealthStatus {
  OK
  WARNING
  ERROR
  TIMEOUT
}

// ==================== ステップ配信（LPRO互換） ====================

model LineScenario {
  id          String   @id @default(cuid())
  tenantId    String

  name        String
  description String?

  // シナリオタイプ（LPRO互換）
  type        ScenarioType

  // 有効/無効
  isActive    Boolean  @default(false)

  // 対象アカウント（null=全アカウント）
  targetAccountIds String[] @default([])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  steps       LineScenarioStep[]

  @@index([tenantId])
  @@index([tenantId, type])
}

enum ScenarioType {
  TIME_ELAPSED   // 時間経過型（登録からX日後）
  SCHEDULED      // スケジュール型（特定日時）
}

model LineScenarioStep {
  id          String       @id @default(cuid())
  scenarioId  String
  scenario    LineScenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)

  order       Int

  // タイミング
  delayDays   Int          @default(0)
  delayHours  Int          @default(0)
  delayMinutes Int         @default(0)
  sendTime    String?      // HH:mm

  // 特定日時（スケジュール型用）
  scheduledAt DateTime?

  // メッセージ内容
  messageType LineMessageType
  content     Json         // LINE Message API形式

  // 条件
  conditions  Json?        // 配信条件

  createdAt   DateTime     @default(now())

  @@index([scenarioId])
  @@index([scenarioId, order])
}

enum LineMessageType {
  TEXT
  IMAGE
  VIDEO
  AUDIO
  STICKER
  RICH_MENU
  FLEX
  TEMPLATE
}

// ==================== キーワード自動返信 ====================

model KeywordResponse {
  id          String   @id @default(cuid())
  tenantId    String

  // トリガー
  keyword     String
  matchType   MatchType @default(PARTIAL)

  // 応答
  messageType LineMessageType
  content     Json

  // 優先度
  priority    Int      @default(0)

  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([tenantId, keyword])
}

enum MatchType {
  EXACT    // 完全一致
  PARTIAL  // 部分一致
  REGEX    // 正規表現
}

// ==================== 配信履歴 ====================

model LineDeliveryLog {
  id              String   @id @default(cuid())
  tenantId        String
  lineAccountId   String

  // 配信種別
  deliveryType    DeliveryType
  scenarioId      String?

  // 配信先
  targetCount     Int
  sentCount       Int      @default(0)
  deliveredCount  Int      @default(0)
  openedCount     Int      @default(0)
  clickedCount    Int      @default(0)
  failedCount     Int      @default(0)

  // メッセージ内容
  messageType     LineMessageType
  content         Json

  // タイミング
  scheduledAt     DateTime?
  sentAt          DateTime?
  completedAt     DateTime?

  createdAt       DateTime @default(now())

  @@index([tenantId])
  @@index([lineAccountId])
  @@index([sentAt])
}

enum DeliveryType {
  BROADCAST       // 一斉配信
  SCHEDULED       // 定時配信
  SCENARIO        // シナリオ配信
  KEYWORD         // キーワード応答
  MANUAL          // 手動配信
}
```

---

## 5. API設計

### 5.1 振り分けAPI

```
GET /api/r/:code
→ 振り分けロジック実行
→ 最適なLINEアカウントの友だち追加URLへリダイレクト

POST /api/line/webhook/:accountId
→ LINE Webhook受信
→ ユーザー情報更新
→ キーワード自動返信
→ シナリオ開始
```

### 5.2 管理API

```
GET  /api/admin/line-accounts         # アカウント一覧
POST /api/admin/line-accounts         # アカウント追加
GET  /api/admin/line-accounts/:id     # アカウント詳細
PUT  /api/admin/line-accounts/:id     # アカウント更新
POST /api/admin/line-accounts/:id/health-check  # ヘルスチェック

GET  /api/admin/distribution          # ユーザー分布
GET  /api/admin/switch-history        # 切り替え履歴

POST /api/admin/rescue                # ユーザー救出実行
```

---

## 6. 実装スケジュール

### Phase 1: コア機能（2週間）
- [ ] データベーススキーマ追加
- [ ] LINEアカウント管理UI
- [ ] 振り分けURL生成・管理
- [ ] ユーザー分布ダッシュボード

### Phase 2: BAN対策（1週間）
- [ ] Webhook監視システム
- [ ] ヘルスチェック自動化
- [ ] BAN検知アラート
- [ ] ユーザー救出機能

### Phase 3: 配信機能（2週間）
- [ ] ステップ配信（時間経過型/スケジュール型）
- [ ] 一斉配信
- [ ] キーワード自動返信
- [ ] 配信履歴・レポート

### Phase 4: 強化機能（1週間）
- [ ] AI配信最適化
- [ ] BAN予測
- [ ] マルチチャネルフォールバック

---

## 7. 技術スタック

| レイヤー | 技術 |
|----------|------|
| Frontend | Next.js 15 + React 19 + TailwindCSS |
| Backend | Next.js API Routes + tRPC |
| Database | PostgreSQL + Prisma |
| Queue | Inngest (ステップ配信用) |
| LINE API | @line/bot-sdk |
| Monitoring | Upstash + Vercel Cron |
| AI | Anthropic Claude API |

---

## 8. まとめ

LPROの42画面を完全解析し、以下を実現する設計を作成しました：

1. **500アカウント→無制限** のアカウント管理
2. **ランダム振り分け→AI最適化** で広告効果最大化
3. **Webhook監視→予測検知** でBAN前に対応
4. **LINE救出→マルチチャネル** でメール/SMSへもフォールバック
5. **iframe UI→モダンSPA** で操作性向上

次のステップ：実装開始
