# MarketingHub + LPRO 統合システム設計書

**作成日**: 2026年2月1日

---

## 1. 統合システム全体像

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MarketingHub 統合プラットフォーム                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   フロントエンド   │  │    管理画面      │  │  公開ページ      │             │
│  │   (Next.js 15)   │  │  (ダッシュボード)  │  │  (LP/ファネル)   │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│  ─────────┴────────────────────┴────────────────────┴───────────────────    │
│                              API Layer (tRPC)                               │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         コアモジュール                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐            │   │
│  │  │  コンタクト管理  │ │  タグ/セグメント │ │  スコアリング   │            │   │
│  │  │  (既存)        │ │  (既存)        │ │  (既存)        │            │   │
│  │  └───────────────┘ └───────────────┘ └───────────────┘            │   │
│  │                                                                     │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐            │   │
│  │  │  キャンペーン   │ │  ファネル      │ │  商品/決済     │            │   │
│  │  │  (既存)        │ │  (既存)        │ │  (既存)        │            │   │
│  │  └───────────────┘ └───────────────┘ └───────────────┘            │   │
│  │                                                                     │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐            │   │
│  │  │  会員サイト    │ │  予約/イベント  │ │  アフィリエイト │            │   │
│  │  │  (既存)        │ │  (既存)        │ │  (既存)        │            │   │
│  │  └───────────────┘ └───────────────┘ └───────────────┘            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    LPRO機能モジュール (新規追加)                       │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐            │   │
│  │  │ LINEアカウント │ │  振り分け      │ │  BAN検知/救出  │            │   │
│  │  │ 管理 (500+)   │ │  システム      │ │  システム      │            │   │
│  │  └───────────────┘ └───────────────┘ └───────────────┘            │   │
│  │                                                                     │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐            │   │
│  │  │ ユーザー分布   │ │  ヘルスチェック │ │  切り替え履歴  │            │   │
│  │  │ ダッシュボード │ │  モニタリング   │ │  トラッキング  │            │   │
│  │  └───────────────┘ └───────────────┘ └───────────────┘            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        配信エンジン                                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│  │  │  LINE   │ │  メール  │ │   SMS   │ │ Webhook │ │   AI    │     │   │
│  │  │ 配信    │ │  配信   │ │  配信   │ │  連携   │ │ 最適化  │     │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘     │   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────┐    │   │
│  │  │              Inngest (ジョブキュー/スケジューラ)             │    │   │
│  │  └───────────────────────────────────────────────────────────┘    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         データレイヤー                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐  │   │
│  │  │                    PostgreSQL + Prisma                       │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  │                                                                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                  │   │
│  │  │   Upstash   │ │  Vercel KV  │ │  Cloudflare │                  │   │
│  │  │   (Redis)   │ │  (Cache)    │ │  (R2/CDN)   │                  │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 機能統合マップ

### 2.1 既存機能 × LPRO機能の連携

| 既存機能 | LPRO機能 | 統合効果 |
|----------|----------|----------|
| **Contact** | LineAccountContact | 1ユーザー→複数LINEアカウント対応 |
| **Campaign (LINE_STEP)** | LineScenario | 500アカウント同時配信 |
| **Funnel** | DistributionUrl | LP→自動振り分け統合 |
| **Tag/Segment** | 振り分け条件 | タグ別に振り分け先変更 |
| **MessageHistory** | LineDeliveryLog | 全アカウント配信履歴統合 |
| **AutomationRule** | KeywordResponse | キーワード応答+自動化連携 |

### 2.2 データフロー

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ユーザー獲得フロー                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [広告/SNS] → [LP(Funnel)] → [振り分けURL] → [LINEアカウント選択]        │
│                                    │                │                   │
│                                    ▼                ▼                   │
│                            [アクセス記録]    [友だち追加URL]             │
│                            [広告コード保存]        │                    │
│                                                    ▼                   │
│                                           [Webhook受信]                 │
│                                                    │                    │
│                                    ┌───────────────┴───────────────┐   │
│                                    ▼                               ▼   │
│                            [Contact作成]              [LineAccountContact] │
│                            [タグ付与]                  [adCode紐付け]      │
│                            [シナリオ開始]              [分布カウント更新]   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           BAN検知・救出フロー                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [定期ヘルスチェック] ──────────────────────────────────────────────────  │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│  │ API呼び出し  │ ──▶ │ 応答チェック │ ──▶ │ 結果記録    │              │
│  └─────────────┘     └─────────────┘     └─────────────┘              │
│                              │                                          │
│                    ┌────────┴────────┐                                 │
│                    ▼                 ▼                                  │
│              [正常応答]          [エラー/タイムアウト]                    │
│                    │                 │                                  │
│                    ▼                 ▼                                  │
│            [healthScore維持]   [healthScore減少]                        │
│                                      │                                  │
│                              ┌───────┴───────┐                         │
│                              ▼               ▼                          │
│                      [WARNING発報]    [BAN判定 (score<30)]              │
│                                              │                          │
│                                              ▼                          │
│                                    [failFlag = true]                    │
│                                    [status = TEMP_DISABLED]             │
│                                              │                          │
│                                              ▼                          │
│                                    [ユーザー救出処理開始]                 │
│                                              │                          │
│                    ┌─────────────────────────┴──────────────────────┐  │
│                    ▼                         ▼                       ▼  │
│            [生存アカウント選択]      [救出メッセージ送信]      [履歴記録]  │
│                    │                         │                          │
│                    ▼                         ▼                          │
│            [SwitchHistory作成]       [メール/SMS通知]                    │
│                                      (マルチチャネル)                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 統合データモデル

### 3.1 既存モデルの拡張

```prisma
// Contact モデルを拡張
model Contact {
  // ... 既存フィールド ...

  // LPRO統合: 複数LINEアカウント対応
  lineAccountContacts  LineAccountContact[]
  switchHistories      SwitchHistory[]

  // 現在のプライマリLINEアカウント
  primaryLineAccountId String?
  primaryLineAccount   LineAccount? @relation("PrimaryAccount", fields: [primaryLineAccountId], references: [id])
}

// Tenant モデルを拡張
model Tenant {
  // ... 既存フィールド ...

  // LPRO統合
  lineAccounts        LineAccount[]
  distributionUrls    DistributionUrl[]
  lineScenarios       LineScenario[]
  keywordResponses    KeywordResponse[]
}

// Funnel モデルを拡張
model Funnel {
  // ... 既存フィールド ...

  // LPRO統合: 振り分けURL連携
  distributionUrlId   String?
  distributionUrl     DistributionUrl? @relation(fields: [distributionUrlId], references: [id])

  // 振り分け設定
  useDistribution     Boolean @default(false)
}
```

### 3.2 新規LPROモデル（既存と連携）

```prisma
model LineAccount {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])

  // LINE公式アカウント情報
  basicId         String
  displayName     String
  channelId       String?
  channelSecret   String?
  accessToken     String?

  // 状態管理
  status          LineAccountStatus @default(ACTIVE)
  failFlag        Boolean  @default(false)
  webhookFlag     Boolean  @default(true)
  tokenFlag       Boolean  @default(false)

  // 振り分け設定
  randExcludeFlag RandExcludeFlag @default(CANDIDATE)
  redirectEnabled Boolean  @default(true)

  // ユーザー数
  memberCount         Int  @default(0)
  memberNonblockCount Int  @default(0)
  maxCapacity         Int  @default(5000)

  // ヘルス
  lastHealthCheck DateTime?
  healthScore     Int      @default(100)
  banRiskLevel    String   @default("low")

  // リレーション
  contacts            LineAccountContact[]
  primaryContacts     Contact[] @relation("PrimaryAccount")
  switchHistoryFrom   SwitchHistory[] @relation("FromAccount")
  switchHistoryTo     SwitchHistory[] @relation("ToAccount")
  distributions       AccountDistribution[]
  healthLogs          AccountHealthLog[]
  deliveryLogs        LineDeliveryLog[]

  @@index([tenantId])
  @@index([tenantId, status])
}

model LineAccountContact {
  id            String      @id @default(cuid())
  lineAccountId String
  lineAccount   LineAccount @relation(fields: [lineAccountId], references: [id])
  contactId     String
  contact       Contact     @relation(fields: [contactId], references: [id])

  lineUserId    String
  displayName   String?
  isBlocked     Boolean  @default(false)
  isFollowing   Boolean  @default(true)

  // 流入トラッキング（既存Contactと連携）
  adCode        String?
  sourceUrl     String?
  funnelId      String?  // どのファネル経由か

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([lineAccountId, lineUserId])
  @@index([contactId])
  @@index([adCode])
}

model DistributionUrl {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  code        String   @unique
  name        String

  // 振り分け設定
  algorithm   DistributionAlgorithm @default(RANDOM)
  adCode      String?

  // ファネル連携
  funnels     Funnel[]

  // 統計
  accessCount Int      @default(0)
  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([code])
}
```

---

## 4. 統合メニュー構成

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           管理画面メニュー                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📊 ダッシュボード                                                       │
│     ├── 全体サマリー                                                    │
│     ├── LINEアカウント状況（新規）                                       │
│     └── BAN警告・アラート（新規）                                        │
│                                                                         │
│  👥 コンタクト管理                                                       │
│     ├── コンタクト一覧（既存）                                           │
│     ├── グループ/ランク設定（新規：LPRO互換）                             │
│     ├── タグ管理（既存）                                                │
│     ├── セグメント（既存）                                              │
│     └── 検索一括処理（新規：LPRO互換）                                   │
│                                                                         │
│  📱 LINE管理（新規セクション）                                            │
│     ├── LINEアカウント一覧                                              │
│     ├── アカウント登録/インポート                                        │
│     ├── ユーザー分布                                                    │
│     ├── 切り替え履歴                                                    │
│     ├── ヘルスチェック状況                                              │
│     └── リッチメニュー管理（既存を移動）                                  │
│                                                                         │
│  🔗 振り分けシステム（新規セクション）                                     │
│     ├── 振り分けURL管理                                                 │
│     ├── 広告コード設定                                                  │
│     └── 振り分けレポート                                                │
│                                                                         │
│  📧 配信管理                                                            │
│     ├── キャンペーン一覧（既存）                                         │
│     ├── ステップ配信（既存＋LPRO拡張）                                   │
│     │   ├── メール                                                     │
│     │   ├── LINE（時間経過型）                                         │
│     │   └── LINE（スケジュール型）                                      │
│     ├── 一斉配信（既存）                                                │
│     ├── 定時配信（新規：LPRO互換）                                       │
│     ├── キーワード自動返信（新規）                                       │
│     └── 配信履歴（既存＋LPRO拡張）                                       │
│                                                                         │
│  💬 チャット対応（新規セクション）                                        │
│     ├── トーク一覧                                                      │
│     ├── トークキャラ設定                                                │
│     └── 対応履歴                                                        │
│                                                                         │
│  🎯 ファネル（既存）                                                     │
│     ├── ファネル一覧                                                    │
│     ├── ページ編集                                                      │
│     └── 振り分け連携設定（新規）                                         │
│                                                                         │
│  💰 商品/決済（既存）                                                    │
│                                                                         │
│  🎓 会員サイト（既存）                                                   │
│                                                                         │
│  📅 予約/イベント（既存）                                                │
│                                                                         │
│  🤝 アフィリエイト（既存）                                               │
│                                                                         │
│  📈 レポート                                                            │
│     ├── 全体集計（既存＋LPRO拡張）                                       │
│     ├── 配信効果（既存＋LPRO拡張）                                       │
│     ├── アカウント別レポート（新規）                                     │
│     └── 広告コード別レポート（新規）                                     │
│                                                                         │
│  ⚙️ 設定                                                                │
│     ├── テナント設定（既存）                                            │
│     ├── スタッフ管理（既存）                                            │
│     ├── LINE連携設定（既存→拡張）                                       │
│     └── Webhook設定（新規）                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. API統合設計

### 5.1 tRPCルーター構成

```typescript
// src/server/routers/_app.ts

export const appRouter = router({
  // 既存ルーター
  tenant: tenantRouter,
  contact: contactRouter,
  tag: tagRouter,
  segment: segmentRouter,
  campaign: campaignRouter,
  funnel: funnelRouter,
  product: productRouter,
  order: orderRouter,
  course: courseRouter,
  event: eventRouter,
  partner: partnerRouter,
  automation: automationRouter,

  // LPRO統合ルーター（新規）
  lineAccount: lineAccountRouter,      // LINEアカウント管理
  distribution: distributionRouter,    // 振り分けシステム
  lineScenario: lineScenarioRouter,    // LINEステップ配信
  keywordResponse: keywordResponseRouter, // キーワード応答
  lineChat: lineChatRouter,            // チャット対応
  healthCheck: healthCheckRouter,      // ヘルスチェック
  rescue: rescueRouter,                // ユーザー救出
  lineReport: lineReportRouter,        // LINEレポート
});
```

### 5.2 主要API

```typescript
// LINEアカウント管理
lineAccount.list()           // アカウント一覧
lineAccount.create()         // アカウント追加
lineAccount.import()         // 一括インポート
lineAccount.updateStatus()   // 状態更新
lineAccount.healthCheck()    // ヘルスチェック実行

// 振り分けシステム
distribution.createUrl()     // 振り分けURL作成
distribution.redirect()      // リダイレクト処理
distribution.stats()         // 振り分け統計

// ユーザー救出
rescue.detectBan()           // BAN検知
rescue.executeRescue()       // 救出実行
rescue.notifyUsers()         // ユーザー通知

// レポート
lineReport.userDistribution() // ユーザー分布
lineReport.deliveryStats()    // 配信統計
lineReport.adCodeStats()      // 広告コード別統計
```

---

## 6. 実装フェーズ

### Phase 1: 基盤統合（1週間）
- [ ] Prismaスキーマ拡張
- [ ] 既存Contact/Tenantとの連携
- [ ] tRPCルーター追加

### Phase 2: LINEアカウント管理（1週間）
- [ ] アカウント一覧UI
- [ ] アカウント登録/インポート
- [ ] 状態管理

### Phase 3: 振り分けシステム（1週間）
- [ ] 振り分けURL管理
- [ ] リダイレクトAPI
- [ ] ファネル連携

### Phase 4: BAN対策（1週間）
- [ ] ヘルスチェック自動化
- [ ] BAN検知ロジック
- [ ] ユーザー救出機能

### Phase 5: 配信機能拡張（1週間）
- [ ] 全アカウント同時配信
- [ ] キーワード自動返信
- [ ] 配信履歴統合

### Phase 6: レポート/ダッシュボード（1週間）
- [ ] ユーザー分布画面
- [ ] アカウント状況ダッシュボード
- [ ] 広告コード別レポート

---

## 7. 技術仕様

| コンポーネント | 技術 | 用途 |
|--------------|------|------|
| Frontend | Next.js 15 + React 19 | SPA |
| Styling | TailwindCSS + shadcn/ui | UI |
| API | tRPC + Zod | 型安全API |
| Database | PostgreSQL + Prisma | データ永続化 |
| Auth | Clerk | 認証 |
| Queue | Inngest | ジョブ管理 |
| Cache | Upstash Redis | キャッシュ |
| LINE | @line/bot-sdk | LINE連携 |
| Email | Resend | メール配信 |
| SMS | Twilio | SMS配信 |
| AI | Claude API | メッセージ生成/最適化 |
| Monitoring | Vercel Cron + Upstash | ヘルスチェック |

---

## 8. まとめ

既存MarketingHubとLPRO機能を統合することで：

### 既存機能の強化
- **Contact**: 1ユーザーが複数LINEアカウントに存在可能に
- **Campaign**: 500+アカウントへの同時配信対応
- **Funnel**: LP→自動振り分け→LINE友だち追加の一気通貫

### 新規機能の追加
- **LINEアカウント管理**: 無制限アカウント登録
- **振り分けシステム**: AI最適化振り分け
- **BAN対策**: 予測検知 + 自動救出
- **マルチチャネル救出**: LINE→メール/SMSフォールバック

### ビジネス価値
- **広告効果最大化**: 広告コード別の振り分け最適化
- **リスク軽減**: BAN予測で事前対応
- **ユーザー維持**: 救出機能で離脱防止
- **運用効率化**: 一元管理で作業削減
