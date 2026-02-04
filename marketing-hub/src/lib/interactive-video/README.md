# Interactive Video System

XStateを使用したインタラクティブ動画システム。視聴者の行動に基づいて動的に分岐するVSL（Video Sales Letter）を実現します。

## 機能

### 1. 状態管理 (XState)
- 予測可能な状態遷移
- ビジネスロジックとUIの完全分離
- タイムトラベルデバッグ対応

### 2. 動画分岐
- 最大4分岐対応
- AI推奨アルゴリズム
- 自動タイムアウト機能

### 3. インタラクション
- クリッカブルホットスポット
- 動的CTAボタン
- パルスアニメーション

### 4. 視聴追跡
- リアルタイム視聴時間計測
- クリック/選択イベント記録
- 分岐パス分析

## ファイル構成

```
src/
├── lib/interactive-video/
│   ├── state-machine.ts       # XState状態マシン定義
│   ├── index.ts               # エクスポート
│   └── README.md              # このファイル
├── components/interactive-video/
│   ├── smart-vsl-player.tsx   # メインプレイヤー
│   ├── branching-overlay.tsx  # 分岐選択UI
│   ├── hotspot.tsx            # ホットスポット
│   ├── cta-overlay.tsx        # CTAボタン
│   └── decision-timer.tsx     # 決定タイマー
└── app/
    ├── api/interactive-video/track/
    │   └── route.ts           # 追跡API
    └── demo/interactive-video/
        └── page.tsx           # デモページ
```

## 基本的な使い方

### 1. 動画設定の定義

```typescript
import { createInteractiveVideoMachine } from '@/lib/interactive-video';

const videoConfig = {
  segments: {
    intro: {
      id: 'intro',
      videoUrl: '/videos/intro.mp4',
      duration: 30,
      title: 'イントロ',
    },
    // ... その他のセグメント
  },
  branches: {
    problem: [
      {
        id: 'beginner',
        label: '初心者向け',
        nextState: 'solutionBeginner',
      },
      // ... その他の分岐
    ],
  },
  hotspots: {
    intro: [
      {
        id: 'skip',
        x: 80, y: 80,
        width: 15, height: 10,
        label: 'スキップ',
        action: 'skip_to_problem',
        triggerTime: 5,
      },
    ],
  },
  ctas: {
    solutionBeginner: [
      {
        id: 'cta-1',
        text: '今すぐ始める',
        showAt: 50,
        variant: 'primary',
      },
    ],
  },
};
```

### 2. プレイヤーの実装

```typescript
import { SmartVSLPlayer } from '@/lib/interactive-video';

export default function VideoPage() {
  return (
    <SmartVSLPlayer
      config={videoConfig}
      autoPlay={false}
      onStateChange={(state) => console.log('State:', state)}
      onTrackingEvent={(event) => {
        // 追跡データをAPIに送信
        fetch('/api/interactive-video/track', {
          method: 'POST',
          body: JSON.stringify(event),
        });
      }}
    />
  );
}
```

## 状態遷移図

```
idle
  └─> intro (START)
       └─> problem (VIDEO_ENDED / TIMER_EXPIRED)
            └─> branchSelection
                 ├─> solutionBeginner (SELECT_BRANCH: beginner)
                 │    └─> offerBeginner
                 │         └─> checkout (CLICK_CTA)
                 ├─> solutionIntermediate (SELECT_BRANCH: intermediate)
                 │    └─> offerIntermediate
                 │         └─> checkout
                 └─> solutionAdvanced (SELECT_BRANCH: advanced)
                      └─> offerAdvanced
                           └─> checkout
```

## カスタマイズ

### 新しい状態を追加

```typescript
states: {
  // 既存の状態...
  customState: {
    entry: 'loadSegment',
    on: {
      VIDEO_ENDED: 'nextState',
      CUSTOM_EVENT: {
        target: 'anotherState',
        actions: 'customAction',
      },
    },
  },
}
```

### カスタムアクションを追加

```typescript
actions: {
  customAction: assign({
    customField: ({ context, event }) => {
      // カスタムロジック
      return newValue;
    },
  }),
}
```

### AI推奨ロジックのカスタマイズ

```typescript
import { generateAIRecommendation } from '@/lib/interactive-video';

// カスタムAI推奨関数
export async function customAIRecommendation(context: VideoContext) {
  // あなた独自のロジック
  const response = await fetch('/api/ai/recommend', {
    method: 'POST',
    body: JSON.stringify(context),
  });

  const { recommendation } = await response.json();
  return recommendation;
}
```

## API エンドポイント

### POST /api/interactive-video/track
視聴イベントを記録

```typescript
{
  type: 'click' | 'branch' | 'completion' | 'hotspot' | 'cta',
  data: {
    watchTime: number,
    clicks: Array<...>,
    branches: Array<...>,
  }
}
```

### GET /api/interactive-video/track?sessionId=xxx
視聴データと分析結果を取得

```typescript
{
  success: true,
  events: [...],
  analytics: {
    totalEvents: number,
    totalWatchTime: number,
    clickCount: number,
    engagementRate: number,
  }
}
```

## トラブルシューティング

### 動画が自動再生されない
- ブラウザの自動再生ポリシーにより、ユーザー操作が必要な場合があります
- `autoPlay={false}` を設定し、明示的に開始ボタンを表示

### 状態遷移が動作しない
- ブラウザのコンソールで状態マシンのログを確認
- `process.env.NODE_ENV === 'development'` 時はデバッグ情報が表示されます

### 追跡データが保存されない
- APIエンドポイントが正しく設定されているか確認
- データベース接続を確認（デフォルトはメモリ内保存）

## パフォーマンス最適化

1. **動画ファイルの最適化**
   - H.264コーデック使用
   - 適切な解像度（1920x1080推奨）
   - CDNでの配信

2. **コンポーネントのメモ化**
   ```typescript
   import { memo } from 'react';

   export const OptimizedComponent = memo(YourComponent);
   ```

3. **状態更新の最小化**
   - 必要な状態のみ更新
   - useMemoでの計算結果キャッシュ

## ライセンス

MIT
