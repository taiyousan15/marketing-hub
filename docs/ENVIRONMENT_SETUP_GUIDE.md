# MarketingHub - 環境セットアップガイド

**Phase 1 実装完了タスク: 外部サービス連携セットアップ**

このガイドでは、MarketingHub の本番運用に必要な全ての外部サービスのアカウント作成、API キー取得、および設定方法を説明します。

---

## 📋 セットアップチェックリスト

| サービス | 優先度 | ステータス | 所要時間 |
|---------|-------|----------|----------|
| 1. Neon PostgreSQL | 🔴 HIGH | ⬜️ | 15分 |
| 2. Clerk 認証 | 🔴 HIGH | ✅ 完了 | - |
| 3. LINE Developers | 🔴 HIGH | ✅ 完了 | - |
| 4. Stripe 決済 | 🔴 HIGH | ⬜️ | 20分 |
| 5. Anthropic API | 🟡 MEDIUM | ⬜️ | 10分 |
| 6. Resend メール | 🟡 MEDIUM | ⬜️ | 15分 |
| 7. Pusher リアルタイム | 🟢 LOW | ⬜️ | 10分 |
| 8. Cloudflare R2 | 🟢 LOW | ⬜️ | 15分 |

**推定総作業時間: 約 1.5 時間**

---

## 1️⃣ Neon PostgreSQL セットアップ

### 概要
Neon は Serverless PostgreSQL データベースサービスです。無料プランで十分に開発・検証が可能です。

### 手順

#### Step 1: アカウント作成
1. **Neon Console にアクセス**
   - URL: https://console.neon.tech
   - "Sign Up" をクリック
   - GitHub / Google アカウントで登録

#### Step 2: プロジェクト作成
1. **Create New Project をクリック**
   - Project Name: `marketinghub-prod`
   - Region: **Tokyo (aws-ap-northeast-1)** ← 日本ユーザー向け低レイテンシ
   - PostgreSQL Version: 最新版 (16.x)

2. **Free Plan を選択**
   - 3 GB ストレージ
   - 月間 100 時間のコンピュート時間
   - 開発・検証に十分

#### Step 3: 接続情報取得
1. **Dashboard → Connection Details**
   - "Pooled connection" タブを選択
   - Connection String をコピー

   ```
   フォーマット:
   postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
   ```

2. **.env ファイルに追加**
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx.ap-northeast-1.aws.neon.tech/neondb?sslmode=require"
   ```

#### Step 4: Vercel 統合 (オプション)
1. **Neon Dashboard → Integrations**
2. **Vercel Integration** をクリック
3. Vercel プロジェクトを選択
4. 環境変数が自動的に Vercel に設定されます

### ✅ 確認方法
```bash
cd /Users/matsumototoshihiko/Desktop/dev/marketinghub/marketing-hub
npx prisma db push
```

成功すれば、データベース接続完了です。

---

## 2️⃣ Clerk 認証セットアップ

### ✅ ステータス: 完了済み

既に以下の環境変数が設定されています:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c3RpcnJlZC1nYXItNi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_qA8eu6h5KnnDkV8yu4sw6ZpeYxs5HFFvpYvDaPBTbE
```

### 本番環境への移行手順 (必要な場合)
1. **Clerk Dashboard**: https://dashboard.clerk.com
2. **Production → Create Application**
3. 本番用 API キーを取得し、Vercel 環境変数に設定

---

## 3️⃣ LINE Developers チャネル設定

### ✅ ステータス: 完了済み

既に以下の環境変数が設定されています:
```env
LINE_CHANNEL_ID=2009039908
LINE_CHANNEL_SECRET=241600f070a359b921e9e92b4df35686
LINE_CHANNEL_ACCESS_TOKEN=txJCwZ/nr6zVXsavX0VfVtfIPbrIaqMVPt0AiWD+x9o...
```

### Webhook URL 設定 (Vercel デプロイ後)
1. **LINE Developers Console**: https://developers.line.biz/console
2. **Messaging API Settings → Webhook URL**
   ```
   https://[YOUR_VERCEL_URL]/api/webhooks/line
   ```
3. **Webhook を有効化**

---

## 4️⃣ Stripe 決済セットアップ

### 概要
Stripe は決済処理を担当します。サブスクリプション課金、単発決済の両方に対応します。

### 手順

#### Step 1: アカウント作成
1. **Stripe Dashboard にアクセス**
   - URL: https://dashboard.stripe.com/register
   - メールアドレスで登録

2. **Test Mode を有効化**
   - 右上のトグルで "Test mode" に切り替え

#### Step 2: API キー取得
1. **Developers → API keys**
   - **Publishable key** (公開キー): `pk_test_...`
   - **Secret key** (秘密キー): `sk_test_...`

2. **.env ファイルに追加**
   ```env
   STRIPE_SECRET_KEY=sk_test_51xxxxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
   ```

#### Step 3: Webhook 設定
1. **Developers → Webhooks → Add endpoint**
2. **Endpoint URL**
   ```
   https://[YOUR_VERCEL_URL]/api/webhooks/stripe
   ```

3. **イベント選択**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`

4. **Webhook Signing Secret をコピー**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

#### Step 4: 商品作成 (オプション)
1. **Products → Add product**
   - Name: "MarketingHub Pro Plan"
   - Pricing: ¥29,800 / month (Recurring)

### ✅ 確認方法
```bash
# Stripe CLI をインストール (ローカルテスト用)
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 5️⃣ Anthropic API (Claude AI) セットアップ

### 概要
Claude AI を使用して、コンテンツ生成、顧客対応の自動化を行います。

### 手順

#### Step 1: アカウント作成
1. **Anthropic Console にアクセス**
   - URL: https://console.anthropic.com
   - "Sign Up" → Email / Google アカウントで登録

#### Step 2: API キー取得
1. **Settings → API Keys**
2. **Create Key** をクリック
   - Key Name: `MarketingHub Production`

3. **API キーをコピー**
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   ```

#### Step 3: 使用量制限設定
1. **Settings → Usage Limits**
   - 月間上限を設定して予期せぬ課金を防止
   - 推奨: $50/月 (開発段階)

### 料金目安
- **Claude 3.5 Sonnet**:
  - Input: $3 / 1M tokens
  - Output: $15 / 1M tokens
- **月間推定コスト**: $10-50 (使用量により変動)

### ✅ 確認方法
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

---

## 6️⃣ Resend メールサービス セットアップ

### 概要
Resend は SendGrid の代替として、シンプルで開発者フレンドリーなメール送信サービスです。

### 手順

#### Step 1: アカウント作成
1. **Resend にアクセス**
   - URL: https://resend.com/signup
   - GitHub / Email で登録

#### Step 2: API キー取得
1. **Dashboard → API Keys**
2. **Create API Key** をクリック
   - Name: `MarketingHub`
   - Permission: Full Access

3. **API キーをコピー**
   ```env
   RESEND_API_KEY=re_xxxxx
   ```

#### Step 3: ドメイン認証 (本番環境)
1. **Settings → Domains → Add Domain**
2. ドメイン名を入力: `marketinghub.com`
3. **DNS レコードを追加**
   - SPF, DKIM, DMARC レコードを DNS に設定
   - 設定後、"Verify" をクリック

4. **送信元メールアドレス設定**
   ```env
   RESEND_FROM_EMAIL=noreply@marketinghub.com
   ```

#### Step 4: テストメール送信
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>Hello from Resend!</p>"
  }'
```

### 料金プラン
- **Free**: 3,000 emails/月
- **Pro**: $20/月 (50,000 emails)

---

## 7️⃣ Pusher リアルタイム通信 セットアップ

### 概要
Pusher は WebSocket を使用したリアルタイム機能 (チャット、通知) を提供します。

### 手順

#### Step 1: アカウント作成
1. **Pusher Dashboard にアクセス**
   - URL: https://dashboard.pusher.com/accounts/sign_up
   - GitHub / Email で登録

#### Step 2: Channel 作成
1. **Create new app**
   - Name: `MarketingHub`
   - Cluster: **ap3 (Asia Pacific - Singapore)** ← 日本に最も近い
   - Frontend: React
   - Backend: Node.js

#### Step 3: API キー取得
1. **App Keys タブ**
   - App ID
   - Key (Public)
   - Secret (Private)
   - Cluster

2. **.env ファイルに追加**
   ```env
   PUSHER_APP_ID=123456
   PUSHER_KEY=abcdefghijk
   PUSHER_SECRET=1234567890abcdef
   PUSHER_CLUSTER=ap3
   NEXT_PUBLIC_PUSHER_KEY=abcdefghijk
   NEXT_PUBLIC_PUSHER_CLUSTER=ap3
   ```

### 料金プラン
- **Free**: 200,000 messages/日, 100 concurrent connections
- **Standard**: $49/月 (無制限)

### ✅ 確認方法
```javascript
// pages/test-pusher.tsx
import Pusher from 'pusher-js';

const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
});

const channel = pusher.subscribe('test-channel');
channel.bind('test-event', (data) => {
  console.log('Received:', data);
});
```

---

## 8️⃣ Cloudflare R2 (ファイルストレージ) セットアップ

### 概要
Cloudflare R2 は S3 互換のオブジェクトストレージで、転送料無料が特徴です。

### 手順

#### Step 1: アカウント作成
1. **Cloudflare Dashboard にアクセス**
   - URL: https://dash.cloudflare.com/sign-up
   - Email で登録

#### Step 2: R2 有効化
1. **R2 → Create bucket**
   - Bucket Name: `marketinghub-files`
   - Location: Asia Pacific (Tokyo)

#### Step 3: API トークン作成
1. **R2 → Manage R2 API Tokens**
2. **Create API Token**
   - Name: `MarketingHub`
   - Permissions: Object Read & Write

3. **Access Key ID と Secret をコピー**
   ```env
   CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxx
   CLOUDFLARE_R2_ACCESS_KEY_ID=xxxxxxxxxxxx
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxxxxxxxxxxx
   CLOUDFLARE_R2_BUCKET_NAME=marketinghub-files
   ```

#### Step 4: Public Access 設定 (オプション)
1. **Bucket Settings → Public Access**
2. 公開する場合は Custom Domain を設定

### 料金プラン
- **Storage**: $0.015/GB/月
- **Class A Operations**: $4.50 / 1M requests
- **転送料**: 無料 (egress 無料)

---

## 9️⃣ 環境変数ファイル作成

### ローカル開発用 (.env.local)

```env
# ===========================================
# MarketingHub 環境変数設定 (開発環境)
# ===========================================

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@ep-xxx.ap-northeast-1.aws.neon.tech/neondb?sslmode=require"

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_qA8eu6h5KnnDkV8yu4sw6ZpeYxs5HFFvpYvDaPBTbE
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c3RpcnJlZC1nYXItNi5jbGVyay5hY2NvdW50cy5kZXYk
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# LINE Bot
LINE_CHANNEL_ID=2009039908
LINE_CHANNEL_SECRET=241600f070a359b921e9e92b4df35686
LINE_CHANNEL_ACCESS_TOKEN=txJCwZ/nr6zVXsavX0VfVtfIPbrIaqMVPt0AiWD+x9oPAOwH6l4KgpTDdPvSU370UX3etszGg8x/Fh8SaLby3OknhZ9vZ8ieDH1VFCGd7RFLM7DISLEh5d1jtw1/k+TfphkqTyb7+kwiTT9TCmyhcgdB04t89/1O/w1cDnyilFU=

# Stripe
STRIPE_SECRET_KEY=sk_test_51xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# AI
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Email
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@marketinghub.com

# Pusher
PUSHER_APP_ID=123456
PUSHER_KEY=abcdefghijk
PUSHER_SECRET=1234567890abcdef
PUSHER_CLUSTER=ap3
NEXT_PUBLIC_PUSHER_KEY=abcdefghijk
NEXT_PUBLIC_PUSHER_CLUSTER=ap3

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxx
CLOUDFLARE_R2_ACCESS_KEY_ID=xxxxxxxxxxxx
CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxxxxxxxxxxx
CLOUDFLARE_R2_BUCKET_NAME=marketinghub-files

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🔟 Vercel 環境変数設定

### Vercel へのデプロイ手順

#### Step 1: Vercel プロジェクト作成
1. **Vercel Dashboard**: https://vercel.com/dashboard
2. **Import Project** → GitHub リポジトリを選択

#### Step 2: 環境変数設定
1. **Project Settings → Environment Variables**
2. 以下の環境変数を **Production**, **Preview**, **Development** に設定

**設定する環境変数一覧:**
```
DATABASE_URL
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
LINE_CHANNEL_ID
LINE_CHANNEL_SECRET
LINE_CHANNEL_ACCESS_TOKEN
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
ANTHROPIC_API_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
PUSHER_APP_ID
PUSHER_KEY
PUSHER_SECRET
PUSHER_CLUSTER
NEXT_PUBLIC_PUSHER_KEY
NEXT_PUBLIC_PUSHER_CLUSTER
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY
CLOUDFLARE_R2_BUCKET_NAME
NEXT_PUBLIC_APP_URL
```

#### Step 3: Webhook URL 更新
デプロイ完了後、以下のサービスで Webhook URL を更新:

1. **LINE Developers**
   ```
   https://[YOUR_VERCEL_URL]/api/webhooks/line
   ```

2. **Stripe**
   ```
   https://[YOUR_VERCEL_URL]/api/webhooks/stripe
   ```

---

## 1️⃣1️⃣ Prisma データベースマイグレーション

### 初回セットアップ

```bash
cd /Users/matsumototoshihiko/Desktop/dev/marketinghub/marketing-hub

# Prisma Client 生成
npx prisma generate

# データベーススキーマを適用
npx prisma db push

# (オプション) Prisma Studio でデータ確認
npx prisma studio
```

### 本番環境マイグレーション

```bash
# Vercel でビルド時に自動実行される
# package.json の postinstall スクリプトに追加:
"postinstall": "prisma generate"
```

---

## 1️⃣2️⃣ トラブルシューティング

### エラー: "DATABASE_URL is not set"
**原因**: 環境変数が正しく読み込まれていない

**解決方法**:
1. `.env` ファイルが正しい場所にあるか確認
2. Next.js 開発サーバーを再起動
   ```bash
   npm run dev
   ```

### エラー: "Clerk authentication failed"
**原因**: Clerk の API キーが古い、または間違っている

**解決方法**:
1. Clerk Dashboard で API キーを再確認
2. Test Mode と Production Mode を混同していないか確認

### エラー: "Stripe webhook signature verification failed"
**原因**: Webhook Secret が間違っている

**解決方法**:
1. Stripe Dashboard → Webhooks → Signing secret をコピー
2. `STRIPE_WEBHOOK_SECRET` を更新
3. ローカルテストは `stripe listen` を使用

### エラー: "Prisma Client initialization failed"
**原因**: データベース接続エラー

**解決方法**:
1. `DATABASE_URL` の形式を確認
2. Neon Dashboard でデータベースが稼働中か確認
3. IP 制限がかかっていないか確認

---

## 1️⃣3️⃣ セキュリティチェックリスト

- [ ] `.env` ファイルを `.gitignore` に追加
- [ ] API キーを GitHub に commit しない
- [ ] Vercel 環境変数は Production/Preview で分ける
- [ ] Stripe は Test Mode で開発、本番前に Production Mode に切り替え
- [ ] LINE Webhook URL に HTTPS を使用
- [ ] Clerk で Multi-Factor Authentication (MFA) を有効化
- [ ] Neon データベースに IP 制限を設定 (本番環境)

---

## 1️⃣4️⃣ 次のステップ

環境セットアップが完了したら:

1. **ローカル開発サーバー起動**
   ```bash
   npm run dev
   ```

2. **ログイン機能テスト**
   - http://localhost:3000/login にアクセス
   - Clerk 認証フローを確認

3. **LINE Bot テスト**
   - LINE アプリで Bot を友達追加
   - メッセージを送信して Webhook 動作確認

4. **Stripe 決済テスト**
   - Test Card: `4242 4242 4242 4242`
   - テスト決済を実行

5. **Vercel へデプロイ**
   ```bash
   vercel --prod
   ```

---

## 📚 参考リンク

| サービス | ドキュメント |
|---------|------------|
| Neon | https://neon.tech/docs |
| Clerk | https://clerk.com/docs |
| LINE Messaging API | https://developers.line.biz/ja/docs/messaging-api/ |
| Stripe | https://stripe.com/docs |
| Anthropic | https://docs.anthropic.com/en/api/ |
| Resend | https://resend.com/docs |
| Pusher | https://pusher.com/docs |
| Cloudflare R2 | https://developers.cloudflare.com/r2/ |

---

## ✅ 完了確認

全てのセットアップが完了したら、以下のコマンドでヘルスチェックを実行:

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスし、以下を確認:
- [ ] ログインページが表示される
- [ ] Clerk 認証が機能する
- [ ] ダッシュボードにアクセスできる
- [ ] データベース接続が成功している

**セットアップ完了おめでとうございます！** 🎉
