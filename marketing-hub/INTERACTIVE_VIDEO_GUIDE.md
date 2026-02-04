# Interactive Video System - 統合ガイド

## 実装完了

marketing-hub プロジェクトに Interactive Video System を実装しました。

### 作成されたファイル

```
src/
├── lib/interactive-video/
│   ├── state-machine.ts          # XState状態マシン定義（分岐ロジック）
│   ├── index.ts                  # エクスポート
│   └── README.md                 # 詳細ドキュメント
│
├── components/interactive-video/
│   ├── smart-vsl-player.tsx      # メインプレイヤー
│   ├── branching-overlay.tsx     # 分岐選択オーバーレイ
│   ├── hotspot.tsx               # クリッカブルホットスポット
│   ├── cta-overlay.tsx           # CTAオーバーレイ
│   └── decision-timer.tsx        # 決定タイマー
│
└── app/
    ├── api/interactive-video/track/
    │   └── route.ts              # 視聴追跡API
    └── demo/interactive-video/
        └── page.tsx              # デモページ
```

---

## 主要機能

### ✅ 1. XState状態マシン
- 予測可能な状態遷移
- ビジネスロジックとUIの完全分離
- デバッグしやすい構造

### ✅ 2. 動画分岐システム
- 最大4分岐対応
- 視聴者の選択に基づく動的分岐
- AI推奨アルゴリズムの基盤

### ✅ 3. インタラクティブ要素
- **ホットスポット**: クリック可能領域（パルスアニメーション付き）
- **CTAボタン**: 動的表示/非表示
- **分岐選択**: 美しいオーバーレイUI
- **タイマー**: 自動進行機能

### ✅ 4. 視聴者行動追跡
- 視聴時間の記録
- クリックイベントの追跡
- 分岐選択の記録
- APIエンドポイントへの送信

---

## クイックスタート

### 1. デモページの確認

```bash
npm run dev
```

ブラウザで `http://localhost:3000/demo/interactive-video` にアクセス

### 2. 自分のページに統合

```typescript
// app/your-page/page.tsx
'use client';

import { SmartVSLPlayer } from '@/lib/interactive-video';
import { defaultVideoConfig } from '@/lib/interactive-video/state-machine';

export default function YourPage() {
  return (
    <div className="container mx-auto py-12">
      <SmartVSLPlayer
        config={defaultVideoConfig}
        autoPlay={false}
        onStateChange={(state) => {
          console.log('State changed to:', state);
        }}
        onTrackingEvent={(event) => {
          // 追跡データをAPIに送信
          fetch('/api/interactive-video/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
          });
        }}
      />
    </div>
  );
}
```

---

## カスタム動画設定

### 動画セグメントの定義

```typescript
const myVideoConfig = {
  segments: {
    intro: {
      id: 'intro',
      videoUrl: '/videos/my-intro.mp4',
      duration: 30,
      title: 'あなたのイントロ',
      description: 'カスタム説明文',
    },
    problem: {
      id: 'problem',
      videoUrl: '/videos/my-problem.mp4',
      duration: 45,
      title: '課題の説明',
    },
    // ... その他のセグメント
  },

  // 分岐設定
  branches: {
    problem: [
      {
        id: 'option1',
        label: 'オプション1',
        description: '初心者向け',
        nextState: 'solution1',
        icon: '🎯',
      },
      {
        id: 'option2',
        label: 'オプション2',
        description: '中級者向け',
        nextState: 'solution2',
        icon: '🚀',
      },
    ],
  },

  // ホットスポット
  hotspots: {
    intro: [
      {
        id: 'skip-button',
        x: 80,        // 画面左から80%の位置
        y: 80,        // 画面上から80%の位置
        width: 15,    // 幅15%
        height: 10,   // 高さ10%
        label: 'スキップ',
        action: 'skip_to_problem',
        triggerTime: 5,   // 5秒後に表示
        hideTime: 25,     // 25秒後に非表示
      },
    ],
  },

  // CTA設定
  ctas: {
    solution1: [
      {
        id: 'cta-1',
        text: '今すぐ申し込む',
        url: '/checkout',
        variant: 'primary',
        showAt: 50,   // 50秒後に表示
      },
    ],
  },
};
```

---

## 状態遷移フロー

```
idle (初期状態)
  |
  | [START]
  v
intro (イントロ動画)
  |
  | [VIDEO_ENDED / TIMER_EXPIRED]
  v
problem (問題提示動画)
  |
  | [VIDEO_ENDED]
  v
branchSelection (分岐選択画面)
  |
  +-- [SELECT_BRANCH: beginner] --> solutionBeginner --> offerBeginner
  |
  +-- [SELECT_BRANCH: intermediate] --> solutionIntermediate --> offerIntermediate
  |
  +-- [SELECT_BRANCH: advanced] --> solutionAdvanced --> offerAdvanced
  |
  | [任意のCTA_CLICK]
  v
checkout (購入ページへ遷移)
```

---

## API エンドポイント

### POST /api/interactive-video/track

視聴イベントを記録

**リクエスト:**
```json
{
  "type": "branch",
  "videoId": "video-123",
  "segmentId": "problem",
  "data": {
    "branchId": "intermediate",
    "from": "problem"
  }
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "Tracking data recorded",
  "timestamp": 1735996800000
}
```

### GET /api/interactive-video/track?sessionId=xxx

視聴データと分析結果を取得

**レスポンス:**
```json
{
  "success": true,
  "sessionId": "user-456",
  "events": [...],
  "analytics": {
    "totalEvents": 15,
    "eventsByType": {
      "view": 5,
      "click": 7,
      "branch": 2,
      "completion": 1
    },
    "totalWatchTime": 240,
    "clickCount": 7,
    "branchCount": 2,
    "engagementRate": 46.67
  }
}
```

---

## AI推奨機能の拡張

デフォルトではシンプルなヒューリスティックですが、AIサービスと連携可能：

```typescript
import { generateAIRecommendation } from '@/lib/interactive-video';

// カスタムAI推奨
async function customAIRecommendation(context: VideoContext) {
  const response = await fetch('/api/ai/recommend', {
    method: 'POST',
    body: JSON.stringify({
      watchTime: context.trackingData.watchTime,
      clicks: context.trackingData.clicks,
      previousChoices: context.viewerProfile.previousChoices,
    }),
  });

  const { recommendation } = await response.json();
  return recommendation; // 'beginner' | 'intermediate' | 'advanced'
}
```

---

## データベース統合（推奨）

現在はメモリ内保存ですが、本番環境ではデータベースに保存してください：

### Prismaスキーマ例

```prisma
model VideoTracking {
  id          String   @id @default(cuid())
  userId      String?
  sessionId   String
  type        String
  videoId     String?
  segmentId   String?
  data        Json
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([sessionId])
  @@index([type])
}
```

### API実装例

```typescript
// src/app/api/interactive-video/track/route.ts
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const payload = await request.json();

  await prisma.videoTracking.create({
    data: {
      userId: userId || null,
      sessionId: enrichedPayload.sessionId,
      type: payload.type,
      videoId: payload.videoId,
      segmentId: payload.segmentId,
      data: payload.data as Prisma.JsonObject,
      userAgent: enrichedPayload.userAgent,
    },
  });

  return NextResponse.json({ success: true });
}
```

---

## スタイリング

Tailwind CSSを使用しています。カスタマイズは各コンポーネントで可能：

```typescript
// branching-overlay.tsx
<button
  className={`
    p-6 rounded-xl border-2
    ${isRecommended
      ? 'border-yellow-400 bg-yellow-500/10'
      : 'border-gray-600 bg-gray-800/50'
    }
    hover:scale-105 hover:shadow-xl
  `}
>
```

---

## トラブルシューティング

### 動画が再生されない
- ブラウザのコンソールでエラー確認
- 動画ファイルのパスが正しいか確認
- CORS設定を確認（外部URLの場合）

### 状態遷移がおかしい
- ブラウザコンソールでState値を確認
- デバッグ情報は開発モードで表示されます

### 追跡データが送信されない
- ネットワークタブでAPIリクエスト確認
- `/api/interactive-video/track` が正しく動作しているか確認

---

## パフォーマンス最適化

### 1. 動画ファイル
- H.264コーデック推奨
- 1920x1080以下の解像度
- CDNでの配信を推奨

### 2. コンポーネント
```typescript
import { memo } from 'react';

export const OptimizedHotspot = memo(HotspotComponent);
```

### 3. 状態管理
- 不要な再レンダリングを防ぐ
- useMemoでの計算結果キャッシュ

---

## 次のステップ

1. **動画ファイルの準備**
   - 各セグメントの動画を作成
   - `/public/videos/` に配置

2. **デザインのカスタマイズ**
   - ブランドカラーに合わせる
   - アニメーションを調整

3. **データベース統合**
   - Prismaスキーマを追加
   - API実装を更新

4. **A/Bテスト**
   - 分岐パターンのテスト
   - コンバージョン率の測定

5. **AI推奨の実装**
   - OpenAI/Anthropic APIと連携
   - より高度な分岐ロジック

---

## サポート

詳細なドキュメント: `src/lib/interactive-video/README.md`

問題が発生した場合は、以下を確認してください：
- TypeScript型エラー: `npx tsc --noEmit`
- ESLintエラー: `npm run lint`
- ビルドテスト: `npm run build`

---

## ライセンス

MIT License - marketing-hub プロジェクトと同じライセンス
