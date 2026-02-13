# Webhook 設定ガイド

## 📋 概要

MarketingHub で使用する外部サービスの Webhook 設定方法を説明します。

---

## 🎯 Webhook 一覧

| サービス | Webhook URL | 優先度 |
|---------|-------------|--------|
| LINE Messaging API | `/api/webhooks/line` | 🔴 HIGH |
| Stripe | `/api/webhooks/stripe` | 🔴 HIGH |

---

## 1️⃣ LINE Webhook 設定

### 手順

1. **LINE Developers Console**: https://developers.line.biz/console
2. **Messaging API → Webhook settings**
3. **Webhook URL** を入力:
   ```
   https://[YOUR_VERCEL_URL]/api/webhooks/line
   ```
4. **Use webhook** を ON に設定
5. **Verify** で接続確認

### 自動応答を無効化
- **Auto-reply messages**: OFF (重要！)
- **Greeting messages**: OFF (任意)

---

## 2️⃣ Stripe Webhook 設定

### 手順

1. **Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Add endpoint** をクリック
3. **Endpoint URL**:
   ```
   https://[YOUR_VERCEL_URL]/api/webhooks/stripe
   ```
4. **イベント選択**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. **Signing Secret** を取得
   ```
   whsec_xxxxx
   ```
6. Vercel 環境変数に `STRIPE_WEBHOOK_SECRET` を設定

---

## 3️⃣ Webhook URL 一覧

### Production
- LINE: `https://marketinghub.com/api/webhooks/line`
- Stripe: `https://marketinghub.com/api/webhooks/stripe`

### Preview
- LINE: `https://preview.marketinghub.com/api/webhooks/line`
- Stripe: `https://preview.marketinghub.com/api/webhooks/stripe`

---

## 🎯 次のステップ

1. テスト実行
2. ログ監視
3. 本番デプロイ

詳細は docs/ENVIRONMENT_SETUP_GUIDE.md を参照してください。
