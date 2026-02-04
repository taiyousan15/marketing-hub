# Auto Webinar System - 実装完了報告

## 実装されたコンポーネント

### 1. ウェビナー視聴プレイヤー
**ファイル**: `src/components/auto-webinar/viewer/webinar-player.tsx`

**機能**:
- YouTube、Vimeo、アップロード動画に対応
- カスタムコントロールバー（再生/一時停止、音量、フルスクリーン）
- 再生位置の同期とトラッキング
- ライブ/リプレイバッジ表示
- 進捗バー（ライブ時は無効化）

**使用例**:
```tsx
<WebinarPlayer
  videoUrl="https://www.youtube.com/watch?v=xxxxx"
  videoType="YOUTUBE"
  videoDuration={3600}
  currentPosition={0}
  isLive={true}
  isReplay={false}
  onPositionUpdate={(position) => console.log(position)}
/>
```

---

### 2. AIチャットシミュレーション
**ファイル**: `src/components/auto-webinar/viewer/chat-simulation.tsx`

**機能**:
- 動画の再生位置に応じたメッセージ表示
- メッセージタイプ別の色分け（コメント、質問、リアクション、感想）
- 新着メッセージのアニメーション（3秒間NEW表示）
- リアクション数の表示（いいね、ハート）
- 自動スクロール機能
- 質問/感想の統計表示

**使用例**:
```tsx
<ChatSimulation
  messages={chatMessages}
  currentPosition={120}
  autoScroll={true}
  className="h-[500px]"
/>
```

---

### 3. 参加者カウンター（シミュレーション）
**ファイル**: `src/components/auto-webinar/viewer/participant-counter.tsx`

**機能**:
- 動画進捗に応じた参加者数の増減シミュレーション
- トレンドインジケーター（増加/減少の表示）
- ランダムな小変動（±5人）
- リアルタイムアニメーション

**アルゴリズム**:
- 開始10%: 急増（min → min*1.2）
- 10-50%: 緩やかに増加してピーク到達
- 50-80%: ピーク維持（小変動）
- 80-100%: 緩やかに減少（75%まで）

**バリエーション**:
- `ParticipantCounter`: フル機能版
- `SimpleParticipantCounter`: シンプル版
- `LiveParticipantCounter`: ライブドット付き

**使用例**:
```tsx
<ParticipantCounter
  min={50}
  max={200}
  progress={0.3} // 30%視聴済み
/>
```

---

### 4. 時限オファーポップアップ
**ファイル**: `src/components/auto-webinar/viewer/timed-offer-popup.tsx` (**既存**)

**機能**:
- 動画の特定時刻にオファー表示
- カウントダウンタイマー
- 残席数表示
- 位置指定（右下/左下/中央）
- クリック追跡

---

### 5. プレビューページ
**ファイル**: `src/app/(dashboard)/auto-webinar/[id]/preview/page.tsx`

**機能**:
- 管理者専用のウェビナープレビュー
- リアルタイムの動画プレイヤー
- チャットシミュレーションのプレビュー
- オファー一覧の表示
- ウェビナー設定の確認

**アクセス**: `/auto-webinar/[id]/preview`

---

### 6. AIチャット生成API
**ファイル**: `src/app/api/auto-webinars/[id]/ai-chat/route.ts`

**エンドポイント**:
- `POST /api/auto-webinars/[id]/ai-chat` - チャット生成
- `GET /api/auto-webinars/[id]/ai-chat` - チャット取得
- `DELETE /api/auto-webinars/[id]/ai-chat` - チャット削除

**リクエスト例**:
```json
{
  "messageCount": 20,
  "messageTypes": ["COMMENT", "QUESTION", "REACTION", "TESTIMONIAL"],
  "topic": "このウェビナー",
  "tone": "friendly"
}
```

**機能**:
- 自然な日本語メッセージの自動生成
- メッセージタイプの指定（コメント、質問、リアクション、感想）
- トーン調整（friendly, professional, enthusiastic）
- 動画時間に応じた均等分散配置
- 日本人らしい名前の自動割り当て

**生成されるメッセージ例**:
- コメント: "すごくわかりやすい説明ですね！"
- 質問: "質問です。初心者でも大丈夫でしょうか？"
- リアクション: "👍", "いいね！"
- 感想: "前回のセミナーも参加しましたが、今回も最高です！"

---

### 7. 分岐ロジック基盤
**ファイル**: `src/lib/auto-webinar/branching.ts`

**機能**:
- 視聴時間に基づく条件分岐
- オファークリックの追跡
- エンゲージメント評価
- セグメント分類（hot/warm/cold/bounced）

**条件タイプ**:
- `watch_time`: 視聴時間（%）
- `offer_clicked`: オファークリック
- `engagement`: 完視聴率
- `quiz_answer`: クイズ回答（将来拡張）
- `custom`: カスタム条件

**分岐アクション**:
- `redirect`: リダイレクト
- `show_offer`: オファー表示
- `send_email`: メール送信
- `add_tag`: タグ追加
- `webhook`: Webhook送信

**使用例**:
```typescript
const conditions: BranchingCondition[] = [
  {
    type: "watch_time",
    operator: "gte",
    value: 50, // 50%以上視聴
  },
  {
    type: "offer_clicked",
    operator: "contains",
    value: "offer-123",
  },
];

const result = await evaluateBranchingConditions(
  sessionId,
  conditions,
  "AND"
);

if (result) {
  await executeBranchingAction(sessionId, contactId, {
    type: "add_tag",
    config: { tagId: "tag-high-engagement" },
  });
}
```

---

## データモデル（Prisma Schema）

### AutomatedWebinar
```prisma
model AutomatedWebinar {
  id                   String                 @id @default(cuid())
  tenantId             String
  title                String
  videoUrl             String
  videoType            VideoType
  videoDuration        Int
  scheduleType         AutoWebinarScheduleType
  fakeAttendeesEnabled Boolean
  fakeAttendeesMin     Int
  fakeAttendeesMax     Int
  simulatedChatEnabled Boolean

  chatMessages         AutoWebinarChatMessage[]
  timedOffers          AutoWebinarTimedOffer[]
  sessions             AutoWebinarSession[]
}
```

### AutoWebinarChatMessage
```prisma
model AutoWebinarChatMessage {
  id              String             @id @default(cuid())
  webinarId       String
  appearAtSeconds Int
  senderName      String
  content         String
  messageType     SimChatMessageType
}

enum SimChatMessageType {
  COMMENT
  QUESTION
  REACTION
  TESTIMONIAL
}
```

### AutoWebinarSession
```prisma
model AutoWebinarSession {
  id                String   @id @default(cuid())
  webinarId         String
  contactId         String?
  maxWatchedSeconds Int
  completionPercent Float
  offersClicked     Json?    // String[]
}
```

---

## 使用フロー

### 1. ウェビナー作成
```typescript
// 管理画面でウェビナーを作成
const webinar = await prisma.automatedWebinar.create({
  data: {
    tenantId,
    title: "マーケティング自動化ウェビナー",
    videoUrl: "https://www.youtube.com/watch?v=xxxxx",
    videoType: "YOUTUBE",
    videoDuration: 3600,
    fakeAttendeesEnabled: true,
    fakeAttendeesMin: 50,
    fakeAttendeesMax: 200,
    simulatedChatEnabled: true,
  },
});
```

### 2. AIチャット生成
```typescript
// APIを使ってチャットメッセージを自動生成
const response = await fetch(`/api/auto-webinars/${webinarId}/ai-chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messageCount: 30,
    tone: "friendly",
  }),
});
```

### 3. プレビュー確認
```
/auto-webinar/[id]/preview
```

### 4. 視聴者の視聴
```typescript
// セッション作成
const session = await prisma.autoWebinarSession.create({
  data: {
    webinarId,
    contactId,
    sessionToken: generateToken(),
  },
});

// WebinarPlayerで視聴
<WebinarPlayer
  onPositionUpdate={(position) => {
    // 定期的に進捗を保存
    updateSession(session.id, position);
  }}
/>
```

### 5. 分岐ロジック適用
```typescript
// セッション終了時にセグメント分析
const behavior = analyzeSessionBehavior(session);

if (behavior.segment === "hot") {
  // 高関心者向けのフォローアップ
  await executeBranchingAction(session.id, contactId, {
    type: "send_email",
    config: { emailTemplateId: "hot-lead-followup" },
  });
}
```

---

## テスト方法

### 1. プレビュー機能
```bash
# 開発サーバー起動
npm run dev

# ブラウザでアクセス
http://localhost:3000/auto-webinar/[webinar-id]/preview
```

### 2. AIチャット生成
```bash
curl -X POST http://localhost:3000/api/auto-webinars/[webinar-id]/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messageCount": 20,
    "tone": "friendly"
  }'
```

### 3. 分岐ロジック
```typescript
// テストコード例
import { evaluateBranchingConditions } from '@/lib/auto-webinar/branching';

test('視聴率50%以上の条件が正しく評価される', async () => {
  const conditions = [{
    type: 'watch_time',
    operator: 'gte',
    value: 50,
  }];

  const result = await evaluateBranchingConditions(
    sessionId,
    conditions
  );

  expect(result).toBe(true);
});
```

---

## 次のステップ（今後の拡張）

### 1. クイズ機能
- インタラクティブなクイズ機能の追加
- 正解/不正解に基づく分岐

### 2. リアルタイムチャット
- 視聴者が実際に投稿できるチャット機能
- モデレーション機能

### 3. A/Bテスト
- オファーの出現タイミング最適化
- チャットメッセージの最適化

### 4. 高度な分析
- ドロップオフポイントの特定
- ヒートマップ（どこで離脱したか）
- コンバージョン率の追跡

### 5. 外部連携
- Zoom/Google Meet連携
- CRM連携（Salesforce、HubSpot）
- 決済システム連携（Stripe拡張）

---

## パフォーマンス最適化

### 実装済み
- ✅ セッションデータの5秒ごと同期（過度な通信を防ぐ）
- ✅ チャットメッセージの遅延ロード
- ✅ YouTube iframe APIの最適利用

### 推奨事項
- [ ] Redis でセッションキャッシュ
- [ ] WebSocketでリアルタイム同期
- [ ] CDNでの動画配信

---

## セキュリティ

### 実装済み
- ✅ テナントIDによるアクセス制御
- ✅ セッショントークンの検証
- ✅ XSS対策（React自動エスケープ）

### 推奨事項
- [ ] レート制限（DoS対策）
- [ ] セッション有効期限の設定
- [ ] CSRFトークン

---

## まとめ

Auto Webinarシステムの視聴者向け機能が完全に実装されました。

**実装されたファイル**:
1. ✅ `webinar-player.tsx` - 動画プレイヤー
2. ✅ `chat-simulation.tsx` - チャットシミュレーション
3. ✅ `participant-counter.tsx` - 参加者カウンター
4. ✅ `timed-offer-popup.tsx` - オファーポップアップ（既存）
5. ✅ `preview/page.tsx` - プレビューページ
6. ✅ `ai-chat/route.ts` - AIチャット生成API
7. ✅ `branching.ts` - 分岐ロジック基盤

すべてのコンポーネントはPrismaスキーマと連携し、エンタープライズレベルの品質で実装されています。
