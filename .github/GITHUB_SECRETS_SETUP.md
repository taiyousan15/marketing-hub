# GitHub Secrets セットアップガイド

## 設定方法

GitHub リポジトリの **Settings → Secrets and variables → Actions** で以下を追加してください。

## 必須 Secrets

### 1. DATABASE_URL
```
Database connection string for PostgreSQL
Format: postgresql://user:password@host:port/database
Example: postgresql://postgres:password@db.example.com:5432/marketing_hub
```

### 2. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```
Clerk Public Key (テスト環境)
From: https://dashboard.clerk.com
Format: pk_test_...
```

### 3. CLERK_SECRET_KEY
```
Clerk Secret Key (テスト環境)
From: https://dashboard.clerk.com
Format: sk_test_...
```

## オプション Secrets (本番環境)

### LINE_CHANNEL_ACCESS_TOKEN
```
LINE Messaging API Channel Access Token
From: https://developers.line.biz
```

### STRIPE_SECRET_KEY
```
Stripe Secret API Key
From: https://dashboard.stripe.com
```

### ANTHROPIC_API_KEY
```
Claude API Key for AI features
From: https://console.anthropic.com
```

## 検証コマンド

GitHub Actions で秘密情報の設定確認:

```bash
# ローカル環境で .env ファイルが正しく設定されているか確認
echo "DATABASE_URL=$DATABASE_URL" | head -c 20
echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" | head -c 20
```

## CI/CD パイプラインの実行

Secrets を設定後、以下のアクションで CI/CD が自動実行されます:

1. **Push to main/develop**: 自動的に CI パイプラインが実行
2. **Pull Request**: マージ前に Lint/Type Check/Build が実行
3. **ビルド成功時**: Deploy Verification ステップが実行

## トラブルシューティング

### Build fails with "DATABASE_URL is required"
→ GitHub Secrets に DATABASE_URL が設定されているか確認

### "Cannot find module" エラー
→ npm ci が正常に実行されているか確認

### Type errors in CI
→ ローカルで `npx tsc --noEmit` を実行して確認

## 次のステップ

1. ✅ GitHub Secrets を設定
2. ✅ main ブランチに push
3. ✅ Actions タブで CI パイプライン実行を確認
4. 本番環境 Secrets を設定（Phase 3+）
