# Prisma マイグレーション実行ガイド

## 📋 概要

Prisma を使用したデータベースのマイグレーション手順を説明します。

**Prisma とは？**
- TypeScript/JavaScript 向けの次世代 ORM
- 型安全なデータベースアクセス
- マイグレーション管理
- データベーススキーマの自動生成

---

## 🎯 前提条件

### 必須
- [ ] Node.js 18.x 以上がインストールされている
- [ ] Neon PostgreSQL データベースが作成されている
- [ ] `.env.local` に `DATABASE_URL` が設定されている

### 確認方法
```bash
# Node.js バージョン確認
node -v
# v20.x.x 以上であることを確認

# 環境変数確認
cat .env.local | grep DATABASE_URL
```

---

## 1️⃣ 初回セットアップ

### Step 1: プロジェクトディレクトリに移動

```bash
cd /Users/matsumototoshihiko/Desktop/dev/marketinghub/marketing-hub
```

### Step 2: 依存パッケージのインストール

```bash
# パッケージをインストール
npm install
```

### Step 3: Prisma Client 生成

```bash
# Prisma Client を生成
npx prisma generate
```

**実行結果 (成功例):**
```
✔ Generated Prisma Client (v7.3.0) to ./node_modules/@prisma/client in 234ms
```

### Step 4: データベーススキーマを適用

```bash
# スキーマをデータベースに適用
npx prisma db push
```

**実行結果 (成功例):**
```
🚀 Your database is now in sync with your Prisma schema. Done in 1.2s
```

---

## 2️⃣ 開発中のマイグレーション

### スキーマ変更時の手順

#### Step 1: schema.prisma を編集

```prisma
// prisma/schema.prisma

model Contact {
  id        String   @id @default(cuid())
  email     String?
  name      String?

  // 新しいフィールドを追加
  birthday  DateTime? // ← 追加

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Step 2: マイグレーション実行

```bash
# スキーマをデータベースに適用
npx prisma db push

# Prisma Client 再生成
npx prisma generate
```

---

## 3️⃣ Prisma Studio (データベース GUI)

### 起動方法

```bash
# Prisma Studio を起動
npx prisma studio
```

**ブラウザで自動的に開く:**
```
http://localhost:5555
```

### できること
- テーブルのデータを閲覧
- レコードの追加・編集・削除
- リレーションの確認
- データのフィルタリング・ソート

---

## 4️⃣ トラブルシューティング

### エラー: "Environment variable not found: DATABASE_URL"

**原因**: `.env.local` が読み込まれていない

**解決方法:**
```bash
# .env.local が存在するか確認
ls -la .env.local

# 存在しない場合は作成
cp .env.local.template .env.local

# DATABASE_URL を設定
vim .env.local
```

### エラー: "Can't reach database server"

**原因**: データベースに接続できない

**解決方法:**
```bash
# DATABASE_URL の形式を確認
cat .env.local | grep DATABASE_URL

# Neon データベースが起動しているか確認
# Neon Console: https://console.neon.tech
```

### エラー: "The table `Contact` does not exist"

**原因**: マイグレーションが実行されていない

**解決方法:**
```bash
# スキーマを適用
npx prisma db push
```

---

## 5️⃣ 本番環境へのデプロイ

### Vercel での自動マイグレーション

#### package.json に postinstall スクリプト追加

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "postinstall": "prisma generate"
  }
}
```

#### Vercel 環境変数設定

1. Vercel Dashboard → Settings → Environment Variables
2. `DATABASE_URL` を Production 環境に設定

#### デプロイ

```bash
# Vercel へデプロイ
vercel --prod
```

---

## ✅ マイグレーション完了チェックリスト

### 初回セットアップ
- [ ] プロジェクトディレクトリに移動完了
- [ ] パッケージインストール実行完了
- [ ] `.env.local` に `DATABASE_URL` 設定完了
- [ ] `npx prisma generate` 実行完了
- [ ] `npx prisma db push` 実行完了
- [ ] `npx prisma studio` でデータ確認完了

### 開発ワークフロー
- [ ] スキーマ変更後に `npx prisma db push` 実行
- [ ] `npx prisma generate` 実行完了
- [ ] アプリケーションの動作確認完了

### 本番デプロイ
- [ ] Vercel に `DATABASE_URL` 設定完了
- [ ] `package.json` に `postinstall` スクリプト追加
- [ ] 本番環境でマイグレーション実行完了
- [ ] データ整合性確認完了

---

## 📚 参考リンク

- **Prisma 公式ドキュメント**: https://www.prisma.io/docs
- **Prisma Migrate**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Prisma Studio**: https://www.prisma.io/studio
- **Neon PostgreSQL**: https://neon.tech/docs
- **Vercel Prisma Integration**: https://vercel.com/guides/nextjs-prisma-postgres

---

## 🎯 次のステップ

マイグレーション完了後:

1. **ローカル開発サーバー起動**
   ```bash
   npm run dev
   ```

2. **データベース接続確認**
   - http://localhost:3000 にアクセス
   - エラーが表示されないことを確認

3. **Prisma Studio でデータ確認**
   ```bash
   npx prisma studio
   ```

4. **環境セットアップガイドへ進む**
   - docs/ENVIRONMENT_SETUP_GUIDE.md を参照
   - 外部サービスの API キー設定

---

**Prisma マイグレーション完了おめでとうございます！** 🎉
