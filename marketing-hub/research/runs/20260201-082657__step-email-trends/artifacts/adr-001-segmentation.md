# ADR-001: ハイパーセグメンテーション実装

## Status
Accepted

## Context
2026年のメールマーケティングトレンドとして、行動・意図ベースのハイパーセグメンテーションが主流になっている（ev-003, ev-004）。従来の「顧客」「購読者」といった大まかなセグメントでは不十分で、ライフサイクルステージ、行動パターン、意図に基づく高精度なセグメント化が必要。

## Decision
以下の設計でセグメンテーション機能を実装する：

1. **データモデル**
   - `Segment`: セグメント定義（ルール、自動更新設定）
   - `ContactSegment`: コンタクトとセグメントの多対多関連
   - `SendTimePreference`: 送信時間最適化用データ

2. **ルールエンジン**
   - JSONベースのルール定義
   - AND/OR論理演算子サポート
   - 自動更新による動的メンバーシップ

3. **プリセットセグメント**
   - ホットリード（スコア80+）
   - ウォームリード（スコア50-79）
   - コールドリード（スコア50未満）
   - アクティブ購読者（30日以内開封）
   - 休眠顧客（90日以上非アクティブ）
   - 新規登録（7日以内）
   - 有料顧客（購入履歴あり）

## Evidence
- [ev-003] "In 2026, broad segments such as 'customers' or 'subscribers' are no longer enough. Hyper-segmentation uses layered data points." - Claritysoft
- [ev-004] "Instead of relying on overtly tailored messages, AI systems now anticipate intent, context, and emotion." - Robotic Marketer

## Consequences

### Positive
- 行動ベースの精度の高いターゲティングが可能
- 自動更新によりセグメントが常に最新
- プリセットで即座に利用開始可能

### Negative
- 大量のコンタクトがある場合、更新処理に時間がかかる可能性
- 複雑なルールはパフォーマンスに影響

### Risks
- ルール評価の処理負荷
  → 対策: バッチ処理、インデックス最適化

## Alternatives Considered

1. **タグベースのみ**: シンプルだが動的セグメントが不可 → 却下
2. **外部サービス（Segment.io等）**: 柔軟だがコスト増 → 却下
3. **SQLベースクエリ**: 柔軟だがセキュリティリスク → 却下

## Implementation

- `prisma/schema.prisma`: Segment, ContactSegment, SendTimePreference追加
- `src/lib/marketing/segmentation.ts`: ルールエンジン
- `src/app/api/segments/route.ts`: API
- `src/app/(dashboard)/segments/page.tsx`: 管理UI
