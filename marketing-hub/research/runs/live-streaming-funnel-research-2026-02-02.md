# ライブ配信システム＆ファネルビルダー 調査レポート

**調査日**: 2026-02-02
**調査対象**: ライブ配信オープンソースプロジェクト、MCPサーバー、ファネルビルダー設計パターン

---

## 1. ライブ配信オープンソースプロジェクト（GitHub）

### 1.1 主要プロジェクト比較表

| プロジェクト | GitHub Stars | 最終更新 | 言語 | ライセンス | 日本語ドキュメント |
|-------------|--------------|----------|------|-----------|------------------|
| **LiveKit** | 16,832 | 2026-01-31 | Go | Apache 2.0 | 一部あり（Zenn記事） |
| **Jitsi Meet** | 28,494 | 2026-01-30 | TypeScript | Apache 2.0 | 限定的 |
| **SRS** | 28,459 | 2026-01-24 | C++ | MIT | あり |
| **Remotion** | 34,262 | 2026-02-01 | TypeScript | 商用ライセンス | 限定的 |
| **PeerTube** | 14,470 | 2026-01-30 | TypeScript | AGPL 3.0 | あり |
| **Owncast** | 10,908 | 2026-02-01 | Go | MIT | 限定的 |
| **LiveKit Agents** | 9,226 | 2026-02-01 | Python | Apache 2.0 | 限定的 |
| **MediaSoup** | 7,119 | 2026-01-30 | C++ | ISC | 限定的 |
| **Restreamer** | 4,843 | 2025-12-29 | HTML | Apache 2.0 | なし |
| **Ant Media Server** | 4,624 | 2026-01-27 | Java | Apache 2.0 | なし |
| **OBS WebSocket** | 4,243 | 2025-09-17 | C++ | GPL 2.0 | 限定的 |
| **OvenMediaEngine** | 3,047 | 2026-02-01 | C++ | GPL 2.0 | 限定的 |

---

### 1.2 各プロジェクト詳細

#### LiveKit (livekit/livekit)
- **URL**: https://github.com/livekit/livekit
- **説明**: End-to-end realtime stack for connecting humans and AI
- **主要機能**:
  - WebRTC SFU（Selective Forwarding Unit）
  - 音声/映像/データチャネル
  - スクリーンシェアリング
  - 録画機能（Egress）
  - AIエージェント統合
  - 100K同時接続対応
- **Next.js統合**: 公式クイックスタートあり
- **ホスティング**: セルフホスト/LiveKit Cloud
- **特記事項**: ChatGPTのAdvanced Voice Modeで採用

**関連リポジトリ**:
| リポジトリ | Stars | 説明 |
|-----------|-------|------|
| livekit/agents | 9,226 | AIエージェントフレームワーク |
| livekit/egress | 300 | 録画/配信エクスポート |

#### Jitsi Meet (jitsi/jitsi-meet)
- **URL**: https://github.com/jitsi/jitsi-meet
- **説明**: Secure, Simple and Scalable Video Conferences
- **主要機能**:
  - 完全暗号化（E2EE）
  - ブラウザベース（アカウント不要）
  - スクリーンシェアリング
  - 録画機能
  - ライブストリーミング
- **Next.js統合**: iframe埋め込み、Jitsi External API
- **ホスティング**: セルフホスト/JaaS（Jitsi as a Service）
- **特記事項**: Google Summer of Code 2025採択

#### MediaSoup (versatica/mediasoup)
- **URL**: https://github.com/versatica/mediasoup
- **説明**: Cutting Edge WebRTC Video Conferencing
- **主要機能**:
  - 低レベルSFU API
  - Node.js/Rustサポート
  - DataChannels対応
  - マルチストリーム
- **Next.js統合**: Node.jsモジュールとして統合
- **ホスティング**: セルフホストのみ
- **特記事項**: MiroTalk SFUのベース技術

#### Ant Media Server
- **URL**: https://github.com/ant-media/Ant-Media-Server
- **説明**: Ultra-low latency streaming engine
- **主要機能**:
  - WebRTC（~0.5秒レイテンシ）
  - RTMP/SRT/HLS/CMAF対応
  - アダプティブビットレート
  - トランスコーディング
- **SDK**: iOS/Android/React Native/Flutter/Unity/JavaScript
- **ホスティング**: セルフホスト/クラウドマーケットプレイス
- **エディション**: Community/Enterprise

#### OBS WebSocket
- **URL**: https://github.com/obsproject/obs-websocket
- **説明**: Remote-control of OBS Studio through WebSocket
- **主要機能**:
  - OBS完全リモート制御
  - シーン切り替え
  - ストリーム開始/停止
  - ソース操作
- **Next.js統合**: obs-websocket-js ライブラリ
- **特記事項**: OBS Studio 28.0.0以降に標準搭載

#### SRS (Simple Realtime Server)
- **URL**: https://github.com/ossrs/srs
- **説明**: Simple, high-efficiency, real-time media server
- **主要機能**:
  - RTMP/WebRTC/HLS/HTTP-FLV/SRT対応
  - H.264/H.265/AV1/VP9コーデック
  - クラスタリング対応
- **ホスティング**: Docker/K8s対応

#### Owncast
- **URL**: https://github.com/owncast/owncast
- **説明**: Self-hosted live streaming + chat
- **主要機能**:
  - Twitch/YouTube Live代替
  - リアルタイムチャット内蔵
  - RTMP取り込み
  - HLS配信
- **ホスティング**: Docker/直接インストール

#### PeerTube
- **URL**: https://github.com/Chocobozzz/PeerTube
- **説明**: ActivityPub-federated video streaming platform using P2P
- **主要機能**:
  - 分散型（ActivityPub）
  - P2P配信（WebTorrent）
  - ライブストリーミング（RTMP）
- **ホスティング**: セルフホスト

#### OvenMediaEngine
- **URL**: https://github.com/AirenSoft/OvenMediaEngine
- **説明**: Sub-Second Latency Live Streaming Server
- **主要機能**:
  - WebRTC/LL-HLS対応
  - 大規模・高解像度対応
  - RTMP/SRT取り込み
- **ホスティング**: Docker/直接インストール

#### Remotion
- **URL**: https://github.com/remotion-dev/remotion
- **説明**: Make videos programmatically with React
- **主要機能**:
  - React/TypeScriptでの動画生成
  - サーバーサイドレンダリング
  - AWS Lambda対応
  - カスタムテンプレート
- **Next.js統合**: @remotion/player、Lambda経由でのレンダリング推奨
- **ライセンス**: 個人/非営利/小規模チーム（3人以下）は無料

---

## 2. MCP（Model Context Protocol）サーバー調査

### 2.1 ビデオ/ストリーミング関連MCPサーバー

| サーバー | 提供元 | 機能 |
|---------|--------|------|
| **Gcore MCP** | Gcore | CDN、Video Streaming、GPU Cloud |
| **Tencent RTC MCP** | Tencent | Real-Time Communication SDK/API |
| **youtube-automation** | 独自 | YouTube API操作 |
| **remotion-documentation** | Remotion | ドキュメント参照 |

### 2.2 MCPの進化（2025年）

- **Streamable HTTP**: SSEから移行した新しいトランスポート（2025年3月26日仕様）
- **リアルタイムストリーミング**: ライブログ、段階的結果返却に対応
- **標準化**: Linux Foundation（AAIF）に移管

### 2.3 活用可能性

#### remotion-documentation MCP
- Remotionのドキュメント検索・参照
- 動画生成コード補完支援
- ベストプラクティス取得

#### youtube-automation MCP
- YouTube Live配信管理
- 動画アップロード自動化
- アナリティクス取得

---

## 3. ファネルビルダー設計パターン

### 3.1 主要プラットフォーム比較

| 機能 | ClickFunnels | Kajabi | Teachable | UTAGE |
|------|-------------|--------|-----------|-------|
| ファネルビルダー | ◎ | ○ | △ | ◎ |
| コース管理 | △ | ◎ | ◎ | ◎ |
| メール配信 | ○ | ◎ | ○ | ◎ |
| 会員サイト | △ | ◎ | ◎ | ◎ |
| A/Bテスト | ◎ | △ | △ | ○ |
| アフィリエイト | ○ | ○ | ○ | ◎ |
| 日本語対応 | △ | △ | △ | ◎ |

### 3.2 設計パターン

#### マルチステップファネル構造
```
┌─────────────────────────────────────────────────────────┐
│ Step 1: トラフィック獲得                                 │
│ - 広告/SNS → オプトインLP                               │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: リード育成                                       │
│ - サンキューページ → ステップメール/LINE                 │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: フロントエンド販売                               │
│ - セールスLP → チェックアウト → アップセル              │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Step 4: バックエンド販売                                 │
│ - ウェビナー → 個別相談 → 高額商品販売                  │
└─────────────────────────────────────────────────────────┘
```

#### ClickFunnels設計パターン
- **ドラッグ&ドロップ**: 8種類のプリセットテーマ
- **条件分岐**: ユーザー行動に応じた動的パス
- **A/Bテスト**: バリアント重み付け、自動勝者判定
- **ワークフロー**: オプトイン→アップセル→ダウンセル→サンキュー

#### 実装要素
1. **ページビルダー**: JSONブロック構造、カスタムCSS
2. **フォーム**: バリデーション、条件表示
3. **決済統合**: Stripe、PayPal
4. **リダイレクト**: 条件付きURL遷移

### 3.3 オープンソースファネルビルダー（GitHub）

| プロジェクト | 説明 | 更新日 |
|-------------|------|--------|
| **OpenFunnels** | ドラッグ&ドロップ、マルチステップ | 2025-07-14 |
| **StarFunnel** | Astro製ランディングページビルダー | - |
| **Renovation Funnel Builder** | AI駆動型コンプライアント対応 | 2025-01-03 |

---

## 4. 技術スタック比較

### 4.1 ストリーミングプロトコル比較

| プロトコル | レイテンシ | スケーラビリティ | 実装難易度 | 主な用途 |
|-----------|-----------|----------------|-----------|---------|
| **WebRTC** | 50-500ms | 中（SFU必要） | 高 | ビデオ会議、ライブベッティング |
| **SRT** | 100ms-2秒 | 高 | 中 | リモート貢献、スポーツ中継 |
| **RTMP** | ~5秒 | 高 | 低 | 取り込み/配信サーバーへの送信 |
| **HLS** | 15-30秒 | 非常に高 | 低 | VOD、大規模ブロードキャスト |
| **LL-HLS** | 2-5秒 | 非常に高 | 中 | 低遅延大規模配信 |

### 4.2 推奨アーキテクチャ

#### ライブ配信システム
```
┌─────────────────────────────────────────────────────────┐
│ 配信者                                                   │
│ OBS Studio → RTMP/SRT                                   │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ メディアサーバー（LiveKit / SRS / Ant Media）            │
│ - トランスコーディング                                   │
│ - アダプティブビットレート                               │
│ - 録画（Egress）                                        │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 配信                                                     │
│ - WebRTC（双方向・低遅延）                               │
│ - HLS/LL-HLS（大規模配信）                              │
│ - CDN（Cloudflare/Fastly）                              │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 視聴者                                                   │
│ Next.js + LiveKit SDK / HLS.js                          │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Next.js統合ベストプラクティス

### 5.1 LiveKit + Next.js

#### インストール
```bash
npm install livekit-client @livekit/components-react
```

#### 環境変数
```env
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_URL=wss://your-server.livekit.cloud
```

#### 基本実装
```tsx
// app/room/[roomId]/page.tsx
import { LiveKitRoom, VideoConference } from '@livekit/components-react';

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return (
    <LiveKitRoom
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connectOptions={{ autoSubscribe: true }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
```

#### 機能一覧
| 機能 | コンポーネント/API |
|------|------------------|
| ビデオ会議 | `<VideoConference />` |
| 画面共有 | `LocalParticipant.setScreenShareEnabled()` |
| 録画 | Egress API |
| チャット | Data Channels |
| AIエージェント | LiveKit Agents |

### 5.2 Remotion + Next.js

#### 推奨アプローチ
1. **開発時**: ローカルSSRレンダリング
2. **本番時**: AWS Lambda経由

```tsx
// app/api/render/route.ts
import { getRenderProgress, renderMediaOnLambda } from '@remotion/lambda/client';

export async function POST(request: Request) {
  const { composition, inputProps } = await request.json();

  const renderId = await renderMediaOnLambda({
    region: 'ap-northeast-1',
    functionName: 'remotion-render',
    composition,
    inputProps,
    codec: 'h264',
  });

  return Response.json({ renderId });
}
```

### 5.3 A/Bテスト統合

#### PostHog
```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import posthog from 'posthog-js';

export function middleware(request: NextRequest) {
  const variant = posthog.getFeatureFlag('landing-page-test');

  if (variant === 'variant-b') {
    return NextResponse.rewrite(new URL('/landing-b', request.url));
  }

  return NextResponse.next();
}
```

#### LaunchDarkly
```tsx
// hooks/useExperiment.ts
import { useLDClient } from 'launchdarkly-react-client-sdk';

export function useExperiment(flagKey: string) {
  const ldClient = useLDClient();
  const variant = ldClient?.variation(flagKey, 'control');

  useEffect(() => {
    ldClient?.track('experiment-assignment', { flagKey, variant });
  }, [variant]);

  return variant;
}
```

---

## 6. コンバージョン追跡

### 6.1 ファネル分析ツール

| ツール | 特徴 | Next.js統合 |
|-------|------|------------|
| **Google Analytics 4** | 無料、標準的 | gtag.js |
| **PostHog** | OSS対応、セルフホスト可 | 公式SDK |
| **Amplitude** | ファネル分析に強い | 公式SDK |
| **Plausible** | プライバシー重視 | next-plausible |
| **Fathom** | GDPR準拠、軽量 | 公式スクリプト |

### 6.2 実装例

#### Google Analytics 4
```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### コンバージョンイベント
```tsx
// utils/analytics.ts
export function trackConversion(eventName: string, params: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

// 使用例
trackConversion('purchase', {
  transaction_id: orderId,
  value: amount,
  currency: 'JPY',
  items: [{ item_id: productId, item_name: productName }]
});
```

---

## 7. 推奨事項

### 7.1 Marketing Hub への推奨統合

現在の技術スタック（REQUIREMENTS.mdより）：
- **ストリーミング**: LiveKit（既に採用）
- **動画生成**: Remotion推奨
- **リアルタイム**: Pusher（既に採用）

#### 追加推奨
1. **ライブ配信強化**
   - LiveKit Egress（録画機能）
   - LiveKit Agents（AI音声アシスタント）

2. **ファネル最適化**
   - PostHog（A/Bテスト + 分析統合）
   - 動的ファネル分岐

3. **動画マーケティング**
   - Remotion + Lambda（動画生成自動化）
   - YouTube automation MCP

### 7.2 実装優先度

| 優先度 | 機能 | 理由 |
|--------|------|------|
| 高 | LiveKit録画機能 | ウェビナー再利用 |
| 高 | A/Bテスト統合 | CVR最適化 |
| 中 | Remotion動画生成 | パーソナライズ動画 |
| 中 | AI音声アシスタント | カスタマーサポート |
| 低 | OBS制御統合 | プロ配信者向け |

---

## 8. 参考リンク

### 公式ドキュメント
- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit Next.js Quickstart](https://docs.livekit.io/home/quickstarts/nextjs/)
- [Remotion Documentation](https://www.remotion.dev/docs/)
- [Jitsi Meet Handbook](https://jitsi.github.io/handbook/)

### 日本語リソース
- [Zenn - LiveKitを試す](https://zenn.dev/kun432/scraps/0854a24bfd7cd3)
- [Zenn - LiveKit/WebRTC調べ](https://zenn.dev/pyteyon/scraps/79c94e52c7e768)
- [WebRTC超低遅延配信ノススメ](https://gist.github.com/voluntas/5ef396fe64c06f9563243e034c9eafd7)
- [SkyWay WebRTC解説](https://skyway.ntt.com/blog/entry/webrtc)

### GitHub リポジトリ
- [LiveKit](https://github.com/livekit/livekit)
- [LiveKit Agents](https://github.com/livekit/agents)
- [LiveKit Meet Example](https://github.com/livekit-examples/meet)
- [Jitsi Meet](https://github.com/jitsi/jitsi-meet)
- [MediaSoup](https://github.com/versatica/mediasoup)
- [SRS](https://github.com/ossrs/srs)
- [Owncast](https://github.com/owncast/owncast)
- [Remotion](https://github.com/remotion-dev/remotion)
- [OpenFunnels](https://github.com/aialvi/openfunnels)

---

**調査完了**: 2026-02-02
