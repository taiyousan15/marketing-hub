# Vercel 環境変数設定チェックリスト

## 📋 概要

このドキュメントは、Vercel にデプロイする際に設定する必要がある環境変数の完全なチェックリストです。

**重要**: 環境変数は **Production**, **Preview**, **Development** の 3 つの環境に分けて設定します。

---

## 🔐 セキュリティ原則

1. **絶対に GitHub に commit しない**
2. **環境ごとに分離** (Production / Preview / Development)
3. **最小権限の原則**

---

## ✅ Vercel 環境変数設定手順

### Step 1: Vercel プロジェクトにアクセス
1. https://vercel.com/dashboard にログイン
2. MarketingHub プロジェクトを選択
3. **Settings → Environment Variables**

---

## 📊 環境変数一覧

### 1. データベース (Neon PostgreSQL)

```
Key: DATABASE_URL
Value: postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require
Environments: ✅ Production ✅ Preview ✅ Development
```

### 2. 認証 (Clerk)

```
Key: CLERK_SECRET_KEY
Value: sk_live_xxxxx (Production) / sk_test_xxxxx (Preview/Development)
Environments: ✅ Production ✅ Preview ✅ Development

Key: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_live_xxxxx (Production) / pk_test_xxxxx (Preview/Development)
Environments: ✅ Production ✅ Preview ✅ Development
```

### 3. LINE Messaging API

```
Key: LINE_CHANNEL_ID
Key: LINE_CHANNEL_SECRET
Key: LINE_CHANNEL_ACCESS_TOKEN
Environments: ✅ Production ✅ Preview ✅ Development
```

### 4. Stripe

```
Key: STRIPE_SECRET_KEY
Value: sk_live_xxxxx (Production) / sk_test_xxxxx (Preview/Development)
Environments: ✅ Production ✅ Preview ✅ Development

Key: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Key: STRIPE_WEBHOOK_SECRET
```

### 5. Anthropic API

```
Key: ANTHROPIC_API_KEY
Value: sk-ant-api03-xxxxx
```

### 6. Resend (メール)

```
Key: RESEND_API_KEY
Key: RESEND_FROM_EMAIL
```

### 7. Pusher (リアルタイム)

```
Key: PUSHER_APP_ID
Key: PUSHER_KEY
Key: PUSHER_SECRET
Key: PUSHER_CLUSTER
Key: NEXT_PUBLIC_PUSHER_KEY
Key: NEXT_PUBLIC_PUSHER_CLUSTER
```

### 8. Cloudflare R2

```
Key: CLOUDFLARE_ACCOUNT_ID
Key: CLOUDFLARE_R2_ACCESS_KEY_ID
Key: CLOUDFLARE_R2_SECRET_ACCESS_KEY
Key: CLOUDFLARE_R2_BUCKET_NAME
```

---

## 📊 チェックリスト

### Production 環境
- [ ] DATABASE_URL
- [ ] CLERK_SECRET_KEY
- [ ] LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN
- [ ] STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- [ ] ANTHROPIC_API_KEY
- [ ] RESEND_API_KEY
- [ ] PUSHER設定
- [ ] CLOUDFLARE R2設定

---

詳細は docs/ENVIRONMENT_SETUP_GUIDE.md を参照してください。
