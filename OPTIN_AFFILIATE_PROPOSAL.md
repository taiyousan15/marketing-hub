# オプトインアフィリエイトシステム提案書

**作成日**: 2026年2月1日
**対象**: MarketingHub統合プラットフォーム

---

## 1. エグゼクティブサマリー

### 目的
LPからのメールアドレス/LINE登録に対して報酬を支払う「オプトインアフィリエイト」システムを実装し、顧客リスト獲得を加速させる。

### 調査結果の要約

| カテゴリ | 主要プラットフォーム | 特徴 |
|----------|---------------------|------|
| **日本市場** | MyASP, UTAGE | 2ティア報酬、無料オファー対応 |
| **グローバルネットワーク** | Awin, CJ Affiliate, Impact | 25,000+ブランド、CPL対応 |
| **SaaS向け** | Tapfiliate, FirstPromoter | 継続報酬、Stripe連携 |
| **エンタープライズ** | TUNE/HasOffers, Post Affiliate Pro | 高度なAPI、不正検知 |
| **MCP連携** | Affise MCP, PostAffiliatePro MCP | AI統合、リアルタイム分析 |

---

## 2. 世界のオプトインアフィリエイトシステム比較

### 2.1 日本市場（MyASP / UTAGE）

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      日本のオプトインアフィリエイト                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  【MyASP（マイスピー）】                                                  │
│  ├─ 料金: 月額3,300円〜                                                 │
│  ├─ 2ティア報酬: ✅ 対応                                                │
│  ├─ VIP報酬設定: ✅ アフィリエイターごとに報酬変更可                      │
│  ├─ 無料オファー: ✅ メール登録時に報酬発生可能                          │
│  ├─ 承認方式: 自動/手動選択可                                           │
│  ├─ API連携: ✅ 専用API提供                                            │
│  └─ 特徴: メール配信に特化、1時間5万通配信可能                           │
│                                                                         │
│  【UTAGE（ウタゲ）】                                                     │
│  ├─ 料金: 月額21,670円（スタンダード）                                   │
│  ├─ 2ティア報酬: ✅ 対応                                                │
│  ├─ 継続報酬: ✅ 月額30%の継続報酬                                      │
│  ├─ オプトイン対応: ✅ メール/LINE両対応                                 │
│  ├─ ファネル連携: ✅ LP→オプトイン→商品販売の一気通貫                    │
│  ├─ Webhook: ✅ MyASP等と連携可能                                       │
│  └─ 特徴: オールインワン、ファネル機能が強力                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 グローバルCPL/PPLネットワーク

| ネットワーク | 規模 | CPL対応 | 報酬相場 | 特徴 |
|-------------|------|---------|----------|------|
| **Awin** | 25,000+ブランド、180カ国 | ✅ | $5-30/リード | 世界最大級 |
| **CJ Affiliate** | 3,000+マーチャント | ✅ | $5-50/リード | 年間$16B取引 |
| **Impact** | 4,300+マーチャント | ✅ | 変動 | 無料トラッキング |
| **Perform[cb]** | 多数 | ✅ | $5-100/リード | 週払い対応 |
| **MyLead** | グローバル | ✅ | €1-50/リード | CPL特化 |

### 2.3 SaaS/サブスク向けプラットフォーム

| プラットフォーム | 料金 | 継続報酬 | 特徴 |
|-----------------|------|---------|------|
| **Tapfiliate** | $89/月〜 | ✅ | Stripe/Paddle連携、REST API |
| **FirstPromoter** | $49/月〜 | ✅ | SaaS特化、リカリング対応 |
| **Rewardful** | $29/月〜 | ✅ | Stripe特化、シンプル |
| **Post Affiliate Pro** | $97/月〜 | ✅ | 170+連携、多言語 |
| **TUNE/HasOffers** | $279/月〜 | ✅ | エンタープライズ向け |

### 2.4 MCP対応アフィリエイトツール

| MCP Server | 提供元 | 機能 |
|------------|--------|------|
| **Affise MCP** | Affise | AIパフォーマンスマーケティング |
| **PostAffiliatePro MCP** | FlowHunt | アフィリエイトデータ管理、API操作 |
| **Tapfiliate MCP** | Pipedream | リファラル追跡、コンバージョン管理 |
| **Google Analytics 4 MCP** | Stape | 200+ディメンション分析 |

---

## 3. 実装するオプトインアフィリエイト機能

### 3.1 コア機能

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    オプトインアフィリエイトシステム                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  【パートナー管理】                                                      │
│  ├─ パートナー登録/申請                                                 │
│  ├─ 審査・承認フロー                                                    │
│  ├─ ランク/ティア設定                                                   │
│  ├─ VIP報酬設定（個別単価）                                             │
│  └─ パートナーダッシュボード                                            │
│                                                                         │
│  【トラッキング】                                                        │
│  ├─ アフィリエイトリンク生成                                            │
│  ├─ クリック追跡                                                        │
│  ├─ コンバージョン追跡（メール/LINE登録）                                │
│  ├─ S2S/Postbackトラッキング                                           │
│  └─ Cookie + ファーストパーティデータ                                   │
│                                                                         │
│  【報酬管理】                                                           │
│  ├─ オプトイン報酬（メール登録時）                                       │
│  ├─ オプトイン報酬（LINE登録時）                                        │
│  ├─ 2ティア報酬（親パートナーへ）                                       │
│  ├─ 成約報酬（商品購入時）                                              │
│  ├─ 継続報酬（サブスク継続時）                                          │
│  └─ ボーナス報酬（成績優秀者）                                          │
│                                                                         │
│  【支払い】                                                             │
│  ├─ 報酬集計（月次）                                                    │
│  ├─ 承認フロー（自動/手動）                                             │
│  ├─ 最低支払額設定                                                      │
│  ├─ 支払い方法（銀行振込/PayPal）                                       │
│  └─ 支払い履歴                                                          │
│                                                                         │
│  【レポート】                                                           │
│  ├─ クリック/コンバージョン統計                                         │
│  ├─ パートナー別成績                                                    │
│  ├─ キャンペーン別効果                                                  │
│  ├─ 時間帯/日別分析                                                     │
│  └─ ROI計算                                                            │
│                                                                         │
│  【不正防止】                                                           │
│  ├─ 重複登録検知                                                        │
│  ├─ 不正クリック検知                                                    │
│  ├─ IP/デバイスフィンガープリント                                       │
│  ├─ 異常パターン検出                                                    │
│  └─ 手動審査フラグ                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 オプトイン報酬の発生タイミング

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         報酬発生タイミング                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  【メールオプトイン】                                                    │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│  │ LP訪問  │ → │ フォーム │ → │ 登録完了 │ → │ 報酬発生 │             │
│  │         │    │ 入力    │    │         │    │ ¥300-3000│            │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘             │
│       ↑                                                                │
│  アフィリエイトリンク経由                                                │
│                                                                         │
│  【LINEオプトイン】                                                      │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│  │ LP訪問  │ → │ 友だち  │ → │ Webhook │ → │ 報酬発生 │             │
│  │         │    │ 追加    │    │ 受信    │    │ ¥500-5000│            │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘             │
│       ↑                                                                │
│  振り分けURL経由（LPRO連携）                                             │
│                                                                         │
│  【2ティア報酬】                                                         │
│  ┌─────────┐         ┌─────────┐                                       │
│  │ 子パート │ 成約 →  │ 親パート │ ← 2ティア報酬（成約額の10%等）        │
│  │ ナー    │         │ ナー    │                                       │
│  └─────────┘         └─────────┘                                       │
│       │                                                                │
│       └── 紹介関係で紐付け                                              │
│                                                                         │
│  【成約報酬（商品購入）】                                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│  │オプトイン│ → │ ステップ │ → │ 商品購入 │ → │ 報酬発生 │             │
│  │ 登録    │    │ 配信    │    │         │    │ 購入額の │             │
│  └─────────┘    └─────────┘    └─────────┘    │ 10-50%  │             │
│                                              └─────────┘             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. データベース設計

```prisma
// ==================== パートナー（アフィリエイター）管理 ====================

model Partner {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])

  // 基本情報
  email           String
  name            String
  companyName     String?
  phone           String?

  // アフィリエイトコード
  code            String   @unique  // aff_xxxxx

  // 2ティア（親パートナー）
  parentPartnerId String?
  parentPartner   Partner? @relation("PartnerHierarchy", fields: [parentPartnerId], references: [id])
  childPartners   Partner[] @relation("PartnerHierarchy")

  // ランク/ティア
  rank            PartnerRank @default(STANDARD)

  // ステータス
  status          PartnerStatus @default(PENDING)
  approvedAt      DateTime?

  // 報酬設定
  defaultCommissionRate Int @default(30)  // パーセント

  // 支払い情報
  bankName        String?
  bankBranch      String?
  bankAccountType String?  // 普通/当座
  bankAccountNumber String?
  bankAccountName String?
  paypalEmail     String?

  // 統計（キャッシュ）
  totalClicks     Int @default(0)
  totalConversions Int @default(0)
  totalEarnings   Int @default(0)
  unpaidEarnings  Int @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // リレーション
  affiliateLinks  AffiliateLink[]
  conversions     Conversion[]
  commissions     Commission[]
  payouts         Payout[]

  @@unique([tenantId, email])
  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([parentPartnerId])
}

enum PartnerRank {
  STANDARD      // 通常
  SILVER        // シルバー
  GOLD          // ゴールド
  PLATINUM      // プラチナ
  VIP           // VIP（個別設定）
}

enum PartnerStatus {
  PENDING       // 申請中
  ACTIVE        // 有効
  SUSPENDED     // 停止
  REJECTED      // 却下
}

// ==================== アフィリエイトリンク ====================

model AffiliateLink {
  id              String   @id @default(cuid())
  partnerId       String
  partner         Partner  @relation(fields: [partnerId], references: [id])

  // リンク情報
  code            String   @unique  // 短縮コード
  targetUrl       String   // 遷移先URL

  // キャンペーン/オファー紐付け
  campaignId      String?
  funnelId        String?

  // カスタムパラメータ
  customParams    Json?    // UTMパラメータなど

  // 統計
  clickCount      Int @default(0)
  conversionCount Int @default(0)

  isActive        Boolean @default(true)

  createdAt       DateTime @default(now())

  // リレーション
  clicks          Click[]
  conversions     Conversion[]

  @@index([partnerId])
  @@index([code])
}

// ==================== クリック追跡 ====================

model Click {
  id              String   @id @default(cuid())
  affiliateLinkId String
  affiliateLink   AffiliateLink @relation(fields: [affiliateLinkId], references: [id])

  // クリックID（S2Sトラッキング用）
  clickId         String   @unique @default(cuid())

  // 訪問者情報
  ipAddress       String?
  userAgent       String?
  referer         String?

  // デバイス情報
  deviceType      String?  // desktop/mobile/tablet
  browser         String?
  os              String?

  // 地域
  country         String?
  region          String?
  city            String?

  // フィンガープリント（不正検知用）
  fingerprint     String?

  clickedAt       DateTime @default(now())

  // コンバージョン紐付け
  conversion      Conversion?

  @@index([affiliateLinkId])
  @@index([clickId])
  @@index([clickedAt])
}

// ==================== コンバージョン（成果） ====================

model Conversion {
  id              String   @id @default(cuid())
  tenantId        String

  affiliateLinkId String
  affiliateLink   AffiliateLink @relation(fields: [affiliateLinkId], references: [id])
  partnerId       String
  partner         Partner  @relation(fields: [partnerId], references: [id])

  // クリック紐付け
  clickId         String?  @unique
  click           Click?   @relation(fields: [clickId], references: [id])

  // コンバージョンタイプ
  type            ConversionType

  // 紐付け対象
  contactId       String?  // メール/LINE登録時
  orderId         String?  // 商品購入時

  // 金額（商品購入の場合）
  amount          Int?
  currency        String   @default("JPY")

  // ステータス
  status          ConversionStatus @default(PENDING)
  approvedAt      DateTime?
  rejectedAt      DateTime?
  rejectionReason String?

  // 不正フラグ
  isFraudSuspect  Boolean @default(false)
  fraudScore      Int?     // 0-100

  convertedAt     DateTime @default(now())

  // リレーション
  commissions     Commission[]

  @@index([tenantId])
  @@index([partnerId])
  @@index([affiliateLinkId])
  @@index([status])
  @@index([convertedAt])
}

enum ConversionType {
  EMAIL_OPTIN     // メール登録
  LINE_OPTIN      // LINE登録
  PURCHASE        // 商品購入
  SUBSCRIPTION    // サブスク開始
  RENEWAL         // サブスク更新
  CUSTOM          // カスタムイベント
}

enum ConversionStatus {
  PENDING         // 承認待ち
  APPROVED        // 承認済み
  REJECTED        // 却下
  CANCELLED       // キャンセル
}

// ==================== 報酬（コミッション） ====================

model Commission {
  id              String   @id @default(cuid())
  tenantId        String

  partnerId       String
  partner         Partner  @relation(fields: [partnerId], references: [id])
  conversionId    String
  conversion      Conversion @relation(fields: [conversionId], references: [id])

  // 報酬タイプ
  type            CommissionType

  // 金額
  amount          Int
  currency        String   @default("JPY")

  // 計算詳細
  rate            Int?     // パーセント（成約報酬の場合）
  baseAmount      Int?     // 計算元金額

  // 2ティア情報
  tier            Int      @default(1)  // 1=直接、2=2ティア
  sourcePartnerId String?  // 2ティアの場合、元パートナー

  // ステータス
  status          CommissionStatus @default(PENDING)

  // 支払い紐付け
  payoutId        String?
  payout          Payout?  @relation(fields: [payoutId], references: [id])

  createdAt       DateTime @default(now())
  approvedAt      DateTime?
  paidAt          DateTime?

  @@index([tenantId])
  @@index([partnerId])
  @@index([conversionId])
  @@index([status])
  @@index([payoutId])
}

enum CommissionType {
  OPTIN           // オプトイン報酬
  PURCHASE        // 成約報酬
  RECURRING       // 継続報酬
  TIER2           // 2ティア報酬
  BONUS           // ボーナス報酬
}

enum CommissionStatus {
  PENDING         // 確定待ち
  APPROVED        // 確定
  PAID            // 支払済
  CANCELLED       // キャンセル
}

// ==================== 支払い ====================

model Payout {
  id              String   @id @default(cuid())
  tenantId        String

  partnerId       String
  partner         Partner  @relation(fields: [partnerId], references: [id])

  // 支払い情報
  amount          Int
  currency        String   @default("JPY")

  // 支払い方法
  method          PayoutMethod

  // ステータス
  status          PayoutStatus @default(PENDING)

  // 対象期間
  periodStart     DateTime
  periodEnd       DateTime

  // 処理情報
  processedAt     DateTime?
  transactionId   String?  // 振込ID等
  note            String?

  createdAt       DateTime @default(now())

  // リレーション
  commissions     Commission[]

  @@index([tenantId])
  @@index([partnerId])
  @@index([status])
}

enum PayoutMethod {
  BANK_TRANSFER   // 銀行振込
  PAYPAL          // PayPal
  STRIPE          // Stripe
}

enum PayoutStatus {
  PENDING         // 処理待ち
  PROCESSING      // 処理中
  COMPLETED       // 完了
  FAILED          // 失敗
}

// ==================== オファー設定 ====================

model AffiliateOffer {
  id              String   @id @default(cuid())
  tenantId        String

  name            String
  description     String?

  // オファータイプ
  type            OfferType

  // 報酬設定
  defaultCommission Int    // デフォルト報酬額
  commissionType  OfferCommissionType @default(FIXED)

  // 2ティア設定
  tier2Enabled    Boolean @default(false)
  tier2Rate       Int?    // 2ティア報酬率（%）

  // 対象設定
  funnelId        String?
  campaignId      String?
  productId       String?

  // 承認設定
  autoApprove     Boolean @default(false)
  approvalDelay   Int     @default(0)  // 自動承認までの日数

  // ランク別報酬
  rankCommissions Json?   // { "GOLD": 500, "PLATINUM": 800 }

  isActive        Boolean @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([tenantId])
}

enum OfferType {
  EMAIL_OPTIN     // メール登録
  LINE_OPTIN      // LINE登録
  PURCHASE        // 商品購入
  SUBSCRIPTION    // サブスク
}

enum OfferCommissionType {
  FIXED           // 固定額
  PERCENTAGE      // パーセント
}
```

---

## 5. 既存システムとの統合

### 5.1 Contact/Funnel連携

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      アフィリエイト × 既存システム連携                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  【ファネル連携】                                                        │
│  Funnel                                                                 │
│    ├─ affiliateOfferId: オファー紐付け                                  │
│    └─ pages[]                                                          │
│         └─ アフィリエイトリンク経由のアクセスを追跡                       │
│                                                                         │
│  【コンタクト連携】                                                      │
│  Contact                                                                │
│    ├─ referredByPartnerId: 紹介元パートナー                             │
│    ├─ affiliateClickId: クリックID                                     │
│    └─ affiliateConversionId: コンバージョンID                           │
│                                                                         │
│  【LPRO連携】                                                           │
│  DistributionUrl                                                        │
│    ├─ affiliateLinkId: アフィリエイトリンク紐付け                        │
│    └─ LINE振り分け時にパートナー情報を引き継ぎ                           │
│                                                                         │
│  【商品/決済連携】                                                       │
│  Order                                                                  │
│    ├─ affiliateConversionId: コンバージョン紐付け                        │
│    └─ 購入時に成約報酬を自動計算                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 LPRO（LINE振り分け）との統合

```
アフィリエイトリンク経由のLINE登録フロー:

1. パートナーがアフィリエイトリンクを発行
   https://example.com/a/パートナーコード

2. ユーザーがリンクをクリック
   → Clickレコード作成
   → clickId発行
   → Cookie/セッションに保存

3. LP（ファネル）を表示
   → アフィリエイト情報を引き継ぎ

4. LINE振り分けURL経由で友だち追加
   → DistributionUrlにaffiliateデータを渡す
   → 振り分け先アカウントへリダイレクト

5. LINE Webhook受信
   → Contact作成
   → Conversion作成（LINE_OPTIN）
   → Commission計算
   → 2ティア報酬計算（親パートナーあれば）

6. ステップ配信で商品販売
   → 購入時にConversion作成（PURCHASE）
   → 成約報酬計算
```

---

## 6. API設計

### 6.1 パートナーAPI

```typescript
// パートナー登録
POST /api/affiliate/partners/register
{
  email: string
  name: string
  referralCode?: string  // 紹介者コード（2ティア用）
}

// パートナーダッシュボード
GET /api/affiliate/partners/me/dashboard
→ { clicks, conversions, earnings, pendingEarnings }

// アフィリエイトリンク生成
POST /api/affiliate/links
{
  targetUrl: string
  offerId?: string
  customParams?: object
}

// 成績レポート
GET /api/affiliate/partners/me/report
?period=30d&groupBy=day
```

### 6.2 管理者API

```typescript
// パートナー一覧
GET /api/admin/affiliate/partners
?status=ACTIVE&rank=GOLD

// パートナー承認
POST /api/admin/affiliate/partners/:id/approve

// オファー管理
POST /api/admin/affiliate/offers
{
  name: string
  type: "EMAIL_OPTIN" | "LINE_OPTIN" | "PURCHASE"
  defaultCommission: number
  tier2Enabled: boolean
  tier2Rate?: number
}

// 報酬承認
POST /api/admin/affiliate/commissions/bulk-approve
{ ids: string[] }

// 支払い処理
POST /api/admin/affiliate/payouts/process
{ partnerId: string, periodStart: string, periodEnd: string }
```

### 6.3 トラッキングAPI

```typescript
// クリック記録（リダイレクト）
GET /api/a/:partnerCode
→ 302 Redirect to targetUrl

// S2S Postback（コンバージョン通知）
POST /api/affiliate/postback
{
  clickId: string
  type: "EMAIL_OPTIN" | "LINE_OPTIN" | "PURCHASE"
  amount?: number
  orderId?: string
}
```

---

## 7. 実装スケジュール

### Phase 1: 基盤構築（1週間）
- [ ] データベーススキーマ追加
- [ ] パートナー管理CRUD
- [ ] アフィリエイトリンク生成

### Phase 2: トラッキング（1週間）
- [ ] クリック追跡
- [ ] Cookie/セッション管理
- [ ] コンバージョン検出

### Phase 3: 報酬計算（1週間）
- [ ] オプトイン報酬計算
- [ ] 2ティア報酬計算
- [ ] 成約報酬計算

### Phase 4: 管理画面（1週間）
- [ ] パートナー管理UI
- [ ] 報酬管理UI
- [ ] レポートダッシュボード

### Phase 5: パートナーサイト（1週間）
- [ ] パートナー登録フォーム
- [ ] パートナーダッシュボード
- [ ] リンク生成UI

### Phase 6: 支払い・不正検知（1週間）
- [ ] 支払い処理
- [ ] 不正検知ロジック
- [ ] 監査ログ

---

## 8. まとめ

### 実装する機能

| 機能 | MyASP相当 | UTAGE相当 | 独自強化 |
|------|----------|----------|---------|
| オプトイン報酬 | ✅ | ✅ | メール+LINE両対応 |
| 2ティア報酬 | ✅ | ✅ | 無制限階層対応可 |
| VIP報酬設定 | ✅ | - | ランク別自動適用 |
| 成約報酬 | ✅ | ✅ | リアルタイム計算 |
| 継続報酬 | - | ✅ | サブスク連携 |
| LPRO連携 | - | - | LINE振り分け統合 |
| 不正検知 | 基本 | 基本 | AI予測検知 |
| MCP連携 | - | - | AI分析統合 |

### ビジネス価値

1. **顧客獲得コスト最適化**: 成果報酬型で無駄な広告費削減
2. **リスト獲得加速**: パートナーネットワークで拡散
3. **LTV向上**: パートナー経由の顧客は質が高い傾向
4. **LPRO統合**: BAN対策とアフィリエイトの一体運用
