# 実装ノート: Phase 1 - セグメンテーション

## 実装日
2026-02-01

## 実装内容

### 1. Prisma Schema追加

**ファイル**: `prisma/schema.prisma`

追加モデル:
- `Segment`: セグメント定義
- `ContactSegment`: コンタクト-セグメント関連
- `SendTimePreference`: 送信時間最適化

`Campaign`モデルに追加:
- `segmentId`: セグメント連携
- `useOptimalSendTime`: 送信時間最適化フラグ
- `minScoreThreshold`: 最低スコア閾値

### 2. セグメンテーションエンジン

**ファイル**: `src/lib/marketing/segmentation.ts`

機能:
- ルール評価エンジン（10種類のオペレーター）
- セグメント作成・更新
- 自動メンバーシップ更新
- プリセットセグメント（7種類）

### 3. Segments API

**ファイル**: `src/app/api/segments/route.ts`

エンドポイント:
- `GET /api/segments?tenantId=xxx`: 一覧取得
- `POST /api/segments`: 作成（プリセット初期化含む）
- `PATCH /api/segments`: 更新
- `DELETE /api/segments?id=xxx`: 削除

### 4. セグメント管理UI

**ファイル**: `src/app/(dashboard)/segments/page.tsx`

機能:
- セグメント一覧表示
- 統計カード（総数、自動更新数、メンバー数）
- セグメント作成/編集モーダル
- ルールビルダー
- プリセット追加ボタン

## ビルド結果

```
✓ Compiled successfully
35 routes generated
/segments ページ追加
/api/segments API追加
```

## 次のステップ

1. **Phase 2: スコアリング**
   - LeadScore計算バッチ
   - スコアダッシュボード

2. **Phase 3: 送信最適化**
   - 開封時間データ収集
   - 最適時間予測モデル

## テスト方法

```bash
# 開発サーバー起動
npm run dev

# セグメントページにアクセス
http://localhost:3000/segments

# プリセット追加ボタンをクリック
# 新規セグメント作成をテスト
```

## 注意事項

- DBマイグレーションが必要: `npx prisma migrate dev --name add-segmentation`
- tenantIdは現在ハードコード（認証連携後に修正）

---

# 実装ノート: Phase 2 - スコアリング

## 実装日
2026-02-01

## 実装内容

### 1. スコアリングエンジン

**ファイル**: `src/lib/marketing/scoring.ts`

機能:
- RFMスコア計算（Recency, Frequency, Monetary）
- リードスコア計算（プロフィール、メール、サイト、SNS、購買意図）
- エンゲージメントスコア計算
- チャーンスコア（離脱リスク）計算
- ティア分類（hot, warm, cold, frozen）
- RFMセグメント分類（11種類）

### 2. Scores API

**ファイル**: `src/app/api/scores/route.ts`

エンドポイント:
- `GET /api/scores?action=summary`: サマリー取得
- `GET /api/scores?action=hot_leads`: ホットリード取得
- `GET /api/scores?action=at_risk`: リスク顧客取得
- `GET /api/scores?action=contact&contactId=xxx`: 個別スコア取得
- `GET /api/scores?action=list`: スコア一覧取得
- `POST /api/scores action=calculate_single`: 個別計算
- `POST /api/scores action=recalculate_all`: 全件再計算

### 3. スコアダッシュボードUI

**ファイル**: `src/app/(dashboard)/analytics/scores/page.tsx`

機能:
- サマリーカード（総数、平均スコア、高リスク数）
- ティア分布グラフ
- RFMセグメント分布
- ホットリードTOP5
- 高リスク顧客TOP5
- 全件再計算ボタン

## ビルド結果

```
✓ Compiled successfully
36 routes generated
/analytics/scores ページ追加
/api/scores API追加
```

## 次のステップ

- Phase 3: 送信最適化（開封時間分析、最適送信時間予測）
