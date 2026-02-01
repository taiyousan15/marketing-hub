# ADR-002: スコアリングエンジン実装

## Status
Accepted

## Context
研究結果（ev-005, ev-006）によると、AIスコアリングを活用した企業では成約率の向上や有料化率の大幅改善（20%→71%）が実現されている。MarketingHubにもスコアリング機能を実装し、ホットリードの優先対応を可能にする。

## Decision

### 1. スコアリング体系

**RFMスコア（1-5各）:**
- Recency: 最終購入からの日数
- Frequency: 購入回数
- Monetary: 累計購入金額

**リードスコア（0-100）:**
- プロフィール完成度 (0-20)
- メール反応 (0-30)
- サイト活動 (0-25)
- SNS反応 (0-15)
- 購買意図シグナル (0-10)

**エンゲージメントスコア（0-100）:**
- メール開封数
- メールクリック数
- ページビュー数
- アクティビティの新鮮さ

**チャーンスコア（0-100）:**
- 最終アクティビティからの日数
- エンゲージメントトレンド
- 配信停止フラグ
- サポート問い合わせ数

### 2. ティア分類

| ティア | 条件 | アクション |
|--------|------|-----------|
| Hot | 平均スコア70+ | 即時フォローアップ |
| Warm | 平均スコア50-69 | ナーチャリング継続 |
| Cold | 平均スコア25-49 | 再エンゲージメント |
| Frozen | 平均スコア24以下 | ウィンバック施策 |

### 3. RFMセグメント

11種類のセグメント（champions, loyal_customers, potential_loyalist, new_customers, promising, needs_attention, about_to_sleep, at_risk, cant_lose, hibernating, lost）

## Evidence
- [ev-005] "AIスコアリングで購買意欲の高いリードを優先対応することで成約率向上" - Salesforce
- [ev-006] "有料化率20%→71%に向上、1年でBtoC売上1.5倍達成" - Adobe

## Consequences

### Positive
- ホットリードの即時識別が可能
- 営業リソースの最適配分
- チャーンリスクの早期検知
- データドリブンな意思決定

### Negative
- スコア計算のバッチ処理負荷
- 閾値設定の初期調整が必要

### Risks
- スコアへの過度な依存
  → 対策: 定期的な閾値見直し、人的判断との併用

## Alternatives Considered

1. **外部スコアリングサービス**: 柔軟だがコスト高 → 却下
2. **ML/AIモデル**: 精度は高いが運用複雑 → Phase 4で検討
3. **シンプルなポイント制**: 実装容易だが精度低 → 却下

## Implementation

- `src/lib/marketing/scoring.ts`: スコアリングエンジン
- `src/app/api/scores/route.ts`: スコアAPI
- `src/app/(dashboard)/analytics/scores/page.tsx`: ダッシュボード
