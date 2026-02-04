# Auto Webinar System - セットアップガイド

## 前提条件

- Node.js 18.x 以上
- PostgreSQL データベース
- Next.js 14.x プロジェクト

---

## 1. 依存パッケージのインストール

### 必須パッケージ

```bash
# YouTube プレイヤー用
npm install react-youtube

# または既存の依存関係がすべて含まれている場合
npm install
```

### package.json に追加されるべき依存関係

```json
{
  "dependencies": {
    "react-youtube": "^10.1.0"
  }
}
```

---

## 2. データベースマイグレーション

Prismaスキーマは既に完成しているので、マイグレーションを実行します。

```bash
# マイグレーション実行
npx prisma migrate dev --name add_auto_webinar_system

# Prisma Clientの再生成
npx prisma generate
```

---

## 3. 環境変数の設定

`.env`ファイルに以下を追加（必要に応じて）:

```env
# データベース
DATABASE_URL="postgresql://user:password@localhost:5432/marketing_hub"

# Clerk認証（既存）
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# OpenAI（将来のAI機能拡張用）
OPENAI_API_KEY=sk-...

# アプリケーションURL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. ファイル構成の確認

### 新規作成されたファイル

```
src/
├── components/auto-webinar/viewer/
│   ├── webinar-player.tsx              ✅ NEW
│   ├── chat-simulation.tsx             ✅ NEW
│   ├── participant-counter.tsx         ✅ NEW
│   ├── timed-offer-popup.tsx           (既存)
│   ├── live-chat.tsx                   (既存)
│   ├── attendee-counter.tsx            (既存)
│   └── index.ts                        ✅ UPDATED
│
├── app/(dashboard)/auto-webinar/[id]/
│   └── preview/page.tsx                ✅ NEW
│
├── app/api/auto-webinars/[id]/
│   └── ai-chat/route.ts                ✅ NEW
│
├── lib/auto-webinar/
│   └── branching.ts                    ✅ NEW
│
└── docs/
    ├── AUTO_WEBINAR_IMPLEMENTATION.md  ✅ NEW
    └── AUTO_WEBINAR_SETUP.md          ✅ NEW (このファイル)
```

---

## 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

---

## 6. 動作確認

### Step 1: ウェビナーの作成

管理画面から新しいウェビナーを作成:

```
/auto-webinar/new
```

必要な情報:
- タイトル
- 動画URL（YouTube、Vimeo、またはアップロード）
- 動画の長さ（秒）
- スケジュール設定

### Step 2: AIチャットの生成

APIを使ってチャットメッセージを生成:

```bash
curl -X POST http://localhost:3000/api/auto-webinars/[webinar-id]/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messageCount": 30,
    "messageTypes": ["COMMENT", "QUESTION", "REACTION", "TESTIMONIAL"],
    "tone": "friendly"
  }'
```

または管理画面から「AIチャット生成」ボタンをクリック（UIが実装されている場合）。

### Step 3: プレビューの確認

```
http://localhost:3000/auto-webinar/[webinar-id]/preview
```

以下が表示されることを確認:
- ✅ 動画プレイヤー
- ✅ チャットシミュレーション
- ✅ 参加者カウンター
- ✅ 時限オファー（設定されている場合）

---

## 7. トラブルシューティング

### YouTube動画が再生されない

**原因**: `react-youtube` がインストールされていない

**解決策**:
```bash
npm install react-youtube
npm run dev
```

---

### チャットメッセージが表示されない

**原因**: AIチャット生成APIが実行されていない

**解決策**:
```bash
# チャットメッセージを確認
curl http://localhost:3000/api/auto-webinars/[webinar-id]/ai-chat

# 0件の場合は生成
curl -X POST http://localhost:3000/api/auto-webinars/[webinar-id]/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"messageCount": 20}'
```

---

### 参加者カウンターが動かない

**原因**: `fakeAttendeesEnabled` が `false` または `min`/`max` が未設定

**解決策**:
```sql
-- データベースで確認
SELECT id, title, "fakeAttendeesEnabled", "fakeAttendeesMin", "fakeAttendeesMax"
FROM "AutomatedWebinar"
WHERE id = 'your-webinar-id';

-- 必要に応じて更新
UPDATE "AutomatedWebinar"
SET "fakeAttendeesEnabled" = true,
    "fakeAttendeesMin" = 50,
    "fakeAttendeesMax" = 200
WHERE id = 'your-webinar-id';
```

---

### Prismaエラー

**エラー**: `PrismaClientInitializationError`

**解決策**:
```bash
# Prisma Clientの再生成
npx prisma generate

# データベース接続確認
npx prisma db pull
```

---

## 8. 本番環境へのデプロイ

### Vercelの場合

```bash
# ビルド確認
npm run build

# Vercelにデプロイ
vercel --prod
```

### 環境変数の設定（Vercel）

Vercelのダッシュボードで以下を設定:
- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `OPENAI_API_KEY`（将来用）

---

## 9. パフォーマンス最適化

### 推奨設定

#### 1. 動画のCDN配信

YouTube/Vimeoを使用する場合は自動的に最適化されます。

自己ホスティングの場合:
- Cloudflare Stream
- AWS CloudFront
- Bunny CDN

#### 2. セッションキャッシュ（Redis）

```bash
npm install ioredis
```

`.env`に追加:
```env
REDIS_URL=redis://localhost:6379
```

#### 3. WebSocketリアルタイム通信（オプション）

```bash
npm install socket.io socket.io-client
```

---

## 10. セキュリティチェックリスト

- [ ] テナントIDによるアクセス制御が機能している
- [ ] セッショントークンが検証されている
- [ ] APIレート制限が設定されている（推奨）
- [ ] XSS対策（Reactのデフォルトで対応済み）
- [ ] CSRF保護が有効
- [ ] 環境変数が`.env`に保存され、GitHubにコミットされていない

---

## 11. 次のステップ

### 管理画面の拡張

- [ ] AIチャット生成ボタンの追加
- [ ] チャットメッセージのプレビュー/編集UI
- [ ] オファーのA/Bテスト設定UI
- [ ] 分析ダッシュボード（視聴率、離脱ポイント）

### 機能拡張

- [ ] クイズ機能
- [ ] リアルタイムチャット（視聴者が投稿可能）
- [ ] Zoom/Google Meet連携
- [ ] カレンダー連携（Google Calendar、Outlook）
- [ ] 自動リマインダー（メール、LINE）

### テスト

- [ ] E2Eテスト（Playwright）
- [ ] ユニットテスト（Jest）
- [ ] 負荷テスト（k6）

---

## サポート

問題が発生した場合は、以下をご確認ください:

1. **ドキュメント**: `/docs/AUTO_WEBINAR_IMPLEMENTATION.md`
2. **Prismaスキーマ**: `prisma/schema.prisma`
3. **ログ**: ブラウザのDevToolsコンソール、サーバーログ

---

## まとめ

これでAuto Webinarシステムのセットアップが完了しました！

**実装された機能**:
- ✅ YouTube/Vimeo/アップロード動画の再生
- ✅ AIチャットシミュレーション
- ✅ 参加者カウンター（動的シミュレーション）
- ✅ 時限オファーポップアップ
- ✅ プレビューページ
- ✅ 分岐ロジック基盤

**すぐに使える状態**:
```bash
npm install react-youtube
npm run dev
# http://localhost:3000/auto-webinar/[id]/preview
```

Happy Coding! 🚀
