# 緊急復旧ガイド

クラッシュや問題が発生した場合のクイックリファレンス

## 即座に確認すべきこと

### 1. GitHubリポジトリ
```
https://github.com/taiyousan15/marketing-hub
```

### 2. 最新のIssue確認
```bash
gh issue list --repo taiyousan15/marketing-hub
```

### 3. 最新コミット確認
```bash
git log --oneline -10
```

## 完全復旧手順

### ローカル環境が壊れた場合
```bash
# 新しいディレクトリにクローン
git clone https://github.com/taiyousan15/marketing-hub
cd marketing-hub

# 依存関係インストール
npm install

# 環境変数設定（.env.localを作成）
cp .env.example .env.local  # または手動で作成

# Prismaクライアント生成
npx prisma generate

# データベース同期
npx prisma db push

# 開発サーバー起動
npm run dev
```

### データベース復旧
```bash
# スキーマをDBに反映
npx prisma db push

# または完全リセット（データ消失注意）
npx prisma migrate reset
```

### 環境変数テンプレート
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Clerk Auth
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

# LINE
LINE_CHANNEL_ACCESS_TOKEN="..."
LINE_CHANNEL_SECRET="..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AI
ANTHROPIC_API_KEY="sk-ant-..."

# Email
RESEND_API_KEY="re_..."
```

## 重要なファイル一覧

| ファイル | 説明 |
|---------|------|
| `prisma/schema.prisma` | データベーススキーマ |
| `src/app/(dashboard)/layout.tsx` | ダッシュボードレイアウト |
| `src/lib/ai/` | AI機能モジュール |
| `src/lib/marketing/` | マーケティング機能 |
| `logs/DEVLOG.md` | 開発ログ（このファイル） |

## トラブルシューティング

### npm install失敗
```bash
rm -rf node_modules package-lock.json
npm install
```

### Prismaエラー
```bash
npx prisma generate
npx prisma db push
```

### ポート3000が使用中
```bash
lsof -i :3000
kill -9 <PID>
```

## 連絡先・リソース
- GitHub: https://github.com/taiyousan15/marketing-hub
- Issue: https://github.com/taiyousan15/marketing-hub/issues/1
