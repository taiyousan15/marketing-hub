# 実装計画: MarketingHub ステップメール強化

**作成日**: 2026-02-01
**根拠**: research/runs/20260201-082657__step-email-trends/report.md
**目標**: 2026年トレンドに対応したステップメール機能の実装

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      MarketingHub                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  セグメント  │  │  スコアリング │  │ 送信最適化  │            │
│  │    Engine   │  │    Engine   │  │   Engine    │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                │                    │
│         └────────────────┼────────────────┘                    │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Step Mail Orchestrator                      │  │
│  │  (シナリオ管理・配信制御・トラッキング)                   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          │                                      │
│         ┌────────────────┼────────────────┐                    │
│         ▼                ▼                ▼                    │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐             │
│  │   Email   │    │    SMS    │    │   LINE    │             │
│  │  (Resend) │    │  (Future) │    │  (Future) │             │
│  └───────────┘    └───────────┘    └───────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Segmentation Engine（セグメントエンジン）
**根拠**: ev-003, ev-004

```typescript
// src/lib/marketing/segmentation.ts
interface SegmentRule {
  field: string;           // "behavior.lastPurchase" | "profile.lifecycle"
  operator: "eq" | "gt" | "lt" | "contains" | "in";
  value: any;
}

interface Segment {
  id: string;
  name: string;
  rules: SegmentRule[];
  autoUpdate: boolean;     // リアルタイム更新
  memberCount: number;
}
```

**機能**:
- 行動ベースセグメント（購入履歴、開封履歴）
- ライフサイクルステージ（見込み/試用/有料/休眠）
- 動的セグメント（条件変更で自動更新）

### 2. Scoring Engine（スコアリングエンジン）
**根拠**: ev-005, ev-006

```typescript
// src/lib/marketing/scoring.ts
interface LeadScore {
  subscriberId: string;
  totalScore: number;
  components: {
    engagement: number;    // 開封・クリック行動
    recency: number;       // 最終アクション日時
    frequency: number;     // アクション頻度
    monetary: number;      // 購入金額（該当する場合）
  };
  predictedIntent: "high" | "medium" | "low";
  updatedAt: Date;
}
```

**機能**:
- RFM分析ベースのスコアリング
- 行動履歴からの購買意欲予測
- スコア閾値による自動セグメント振り分け

### 3. Send Time Optimizer（送信時間最適化）
**根拠**: ev-002

```typescript
// src/lib/marketing/send-optimizer.ts
interface SendTimePreference {
  subscriberId: string;
  optimalHour: number;     // 0-23
  optimalDayOfWeek: number; // 0-6
  timezone: string;
  confidence: number;      // 予測信頼度
  dataPoints: number;      // 根拠となるデータ数
}
```

**機能**:
- 個人別開封時間の分析
- 最適送信時間の予測
- タイムゾーン自動対応

### 4. Step Mail Orchestrator（シナリオ管理）
**既存機能の拡張**

```typescript
// src/lib/marketing/step-mail.ts
interface StepMailSequence {
  id: string;
  name: string;
  trigger: TriggerConfig;
  steps: StepConfig[];
  settings: {
    useOptimalSendTime: boolean;
    segmentId?: string;
    minScoreThreshold?: number;
  };
}

interface StepConfig {
  id: string;
  delayDays: number;
  delayHours: number;
  template: EmailTemplate;
  conditions?: BranchCondition[];  // 分岐条件
}
```

---

## Data Model

### Prisma Schema追加

```prisma
// prisma/schema.prisma に追加

model Segment {
  id          String   @id @default(cuid())
  name        String
  description String?
  rules       Json     // SegmentRule[]
  autoUpdate  Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  subscribers SubscriberSegment[]
  sequences   StepMailSequence[]
}

model SubscriberSegment {
  subscriberId String
  segmentId    String
  addedAt      DateTime @default(now())

  subscriber   Subscriber @relation(fields: [subscriberId], references: [id])
  segment      Segment    @relation(fields: [segmentId], references: [id])

  @@id([subscriberId, segmentId])
}

model LeadScore {
  id              String   @id @default(cuid())
  subscriberId    String   @unique
  totalScore      Int      @default(0)
  engagementScore Int      @default(0)
  recencyScore    Int      @default(0)
  frequencyScore  Int      @default(0)
  predictedIntent String   @default("low") // high/medium/low
  updatedAt       DateTime @updatedAt

  subscriber      Subscriber @relation(fields: [subscriberId], references: [id])
}

model SendTimePreference {
  id            String   @id @default(cuid())
  subscriberId  String   @unique
  optimalHour   Int      // 0-23
  optimalDay    Int?     // 0-6
  timezone      String   @default("Asia/Tokyo")
  confidence    Float    @default(0)
  dataPoints    Int      @default(0)
  updatedAt     DateTime @updatedAt

  subscriber    Subscriber @relation(fields: [subscriberId], references: [id])
}
```

---

## Task Breakdown

### Phase 1: MVP（2週間）

| タスク | 優先度 | 難易度 | 根拠 |
|--------|--------|--------|------|
| セグメントモデル追加 | 高 | 低 | ev-003 |
| 基本セグメントUI | 高 | 中 | ev-003 |
| モバイル対応テンプレート | 高 | 低 | ev-008 |
| 開封トラッキング強化 | 高 | 低 | ev-007 |

**成果物**:
- `/segments` ページ（CRUD）
- 3種類のプリセットセグメント
- レスポンシブメールテンプレート5種

### Phase 2: スコアリング（2週間）

| タスク | 優先度 | 難易度 | 根拠 |
|--------|--------|--------|------|
| LeadScoreモデル追加 | 高 | 低 | ev-005 |
| スコア計算バッチ | 高 | 中 | ev-005 |
| スコアダッシュボード | 中 | 中 | ev-006 |
| スコアベース配信条件 | 中 | 中 | ev-005 |

**成果物**:
- スコアリングアルゴリズム（RFM）
- `/analytics/scores` ページ
- 高スコアリード通知

### Phase 3: 送信最適化（2週間）

| タスク | 優先度 | 難易度 | 根拠 |
|--------|--------|--------|------|
| 開封時間データ収集 | 高 | 低 | ev-002 |
| 最適時間予測モデル | 中 | 高 | ev-002 |
| 予測送信オプション | 中 | 中 | ev-002 |

**成果物**:
- 最適送信時間予測
- ステップメール設定に「最適時間で送信」オプション

### Phase 4: 拡張（将来）

| タスク | 優先度 | 難易度 | 根拠 |
|--------|--------|--------|------|
| AI件名生成 | 低 | 中 | ev-001 |
| LINE連携 | 中 | 高 | ev-010 |
| SMS連携 | 低 | 高 | ev-010 |

---

## Test Plan

### 単体テスト

```typescript
// __tests__/segmentation.test.ts
describe("Segmentation Engine", () => {
  it("should create segment with rules", async () => {});
  it("should auto-update segment members", async () => {});
  it("should evaluate complex conditions", async () => {});
});

// __tests__/scoring.test.ts
describe("Scoring Engine", () => {
  it("should calculate RFM score correctly", async () => {});
  it("should update score on new action", async () => {});
  it("should predict intent based on score", async () => {});
});
```

### 統合テスト

- セグメント→ステップメール配信フロー
- スコア更新→セグメント移動フロー
- 最適時間予測→配信実行フロー

### データ品質テスト

- スコア分布の妥当性確認
- 予測精度の継続モニタリング

---

## Ops（運用設計）

### バッチ処理

```typescript
// cron jobs (vercel.json or external scheduler)
{
  "crons": [
    {
      "path": "/api/cron/update-scores",
      "schedule": "0 * * * *"  // 毎時
    },
    {
      "path": "/api/cron/update-segments",
      "schedule": "*/15 * * * *"  // 15分毎
    },
    {
      "path": "/api/cron/send-scheduled",
      "schedule": "* * * * *"  // 毎分
    }
  ]
}
```

### モニタリング

- メール配信成功率
- スコア計算処理時間
- セグメント更新遅延

### 秘密情報管理

- `.env.local` でローカル管理
- Vercel Environment Variables で本番管理
- APIキーはサーバーサイドのみで使用

---

## 実装開始コマンド

```bash
# Phase 1 開始
/dr-build research/runs/20260201-082657__step-email-trends stage=mvp

# または個別タスク
# 1. Prismaスキーマ更新
npx prisma migrate dev --name add-segmentation

# 2. セグメントAPI作成
# src/app/api/segments/route.ts

# 3. セグメントUI作成
# src/app/(dashboard)/segments/page.tsx
```

---

## Success Metrics

| 指標 | 目標 | 測定方法 |
|------|------|----------|
| メール開封率 | +20% | A/Bテスト |
| クリック率 | +30% | トラッキング |
| 配信停止率 | -10% | 登録解除数 |
| 有料化率 | +50% | コンバージョン追跡 |

---

*このドキュメントは research/runs/20260201-082657__step-email-trends/evidence.jsonl の証拠に基づいて作成されました。*
