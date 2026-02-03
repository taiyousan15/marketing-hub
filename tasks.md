# UTAGE × L-STEP 統合マーケティング自動化システム タスク一覧

## 概要

本ドキュメントは、requirements.md（要件定義書）およびdesign.md（設計書）に基づき、実装タスクを優先度順に整理したものです。

### 開発フェーズ

| フェーズ | 期間目安 | 概要 |
|---------|---------|------|
| Phase 1 | MVP | 基盤構築・コア機能 |
| Phase 2 | 機能拡張 | 配信・ファネル・決済 |
| Phase 3 | AI/MCP統合 | AI機能・外部連携 |
| Phase 4 | 高度機能 | ウェビナー・アフィリエイト |

---

## Phase 1: MVP（基盤構築・コア機能）

### 1.1 プロジェクト初期設定

#### Task 1.1.1: Next.js プロジェクト作成
- [ ] **状態**: 未着手
- **説明**: Next.js 15 (App Router) プロジェクトの初期化
- **依存**: なし
- **詳細**:
  ```bash
  npx create-next-app@latest marketing-hub --typescript --tailwind --eslint --app --src-dir
  ```
- **成果物**:
  - Next.js 15 プロジェクト
  - TypeScript 設定
  - Tailwind CSS v4 設定
  - ESLint/Prettier 設定

#### Task 1.1.2: 開発環境構築
- [ ] **状態**: 未着手
- **説明**: 開発に必要なツール・設定の導入
- **依存**: Task 1.1.1
- **詳細**:
  - shadcn/ui 初期化
  - Husky + lint-staged 設定
  - Commitlint 設定
  - VS Code 設定（.vscode/settings.json）
- **成果物**:
  - UIコンポーネント基盤
  - Git hooks 設定
  - エディタ設定ファイル

#### Task 1.1.3: Prisma + PostgreSQL セットアップ
- [ ] **状態**: 未着手
- **説明**: データベース接続とスキーマ定義
- **依存**: Task 1.1.1
- **詳細**:
  - Prisma CLI インストール
  - Cloud SQL（PostgreSQL）接続設定
  - design.md のスキーマ全体を実装
  - 初回マイグレーション実行
- **成果物**:
  - prisma/schema.prisma（完全版）
  - 初期マイグレーションファイル
  - Prisma Client 生成

#### Task 1.1.4: 環境変数・シークレット管理
- [ ] **状態**: 未着手
- **説明**: 環境変数の整理とシークレット管理
- **依存**: Task 1.1.1
- **詳細**:
  - .env.example 作成
  - Google Cloud Secret Manager 設定
  - 環境別設定（development/staging/production）
- **成果物**:
  - .env.example
  - シークレット管理ドキュメント

---

### 1.2 認証・マルチテナント

#### Task 1.2.1: Clerk 認証統合
- [ ] **状態**: 未着手
- **説明**: Clerk による認証システム実装
- **依存**: Task 1.1.1, Task 1.1.3
- **詳細**:
  - @clerk/nextjs インストール
  - ClerkProvider 設定
  - middleware.ts 認証ミドルウェア実装
  - ログイン/サインアップページ作成
- **成果物**:
  - src/middleware.ts
  - src/app/(auth)/login/page.tsx
  - src/app/(auth)/signup/page.tsx

#### Task 1.2.2: テナント管理基盤
- [ ] **状態**: 未着手
- **説明**: マルチテナントアーキテクチャの実装
- **依存**: Task 1.2.1
- **詳細**:
  - テナント作成フロー（サインアップ時）
  - getCurrentTenant() ユーティリティ
  - テナント分離ミドルウェア（全DBクエリにtenantId強制）
- **成果物**:
  - src/lib/auth/tenant.ts
  - src/lib/prisma/with-tenant.ts
  - テナント作成 Server Action

#### Task 1.2.3: ユーザー権限管理
- [ ] **状態**: 未着手
- **説明**: ロールベースアクセス制御（RBAC）
- **依存**: Task 1.2.2
- **詳細**:
  - UserRole enum（OWNER, ADMIN, MEMBER, OPERATOR）
  - 権限チェックユーティリティ
  - 権限不足時のエラーハンドリング
- **成果物**:
  - src/lib/auth/permissions.ts
  - 権限デコレータ/HOC

---

### 1.3 管理画面レイアウト

#### Task 1.3.1: ダッシュボードレイアウト
- [ ] **状態**: 未着手
- **説明**: 管理画面の共通レイアウト実装
- **依存**: Task 1.2.1
- **詳細**:
  - サイドバーナビゲーション
  - ヘッダー（ユーザーメニュー、通知）
  - レスポンシブ対応（モバイルメニュー）
- **成果物**:
  - src/app/(dashboard)/layout.tsx
  - src/components/layout/Sidebar.tsx
  - src/components/layout/Header.tsx

#### Task 1.3.2: ダッシュボードホーム画面
- [ ] **状態**: 未着手
- **説明**: ダッシュボードトップページ
- **依存**: Task 1.3.1
- **詳細**:
  - KPIカード（コンタクト数、配信数、売上）
  - 直近のアクティビティ一覧
  - クイックアクションボタン
- **成果物**:
  - src/app/(dashboard)/page.tsx
  - src/components/dashboard/StatsCard.tsx
  - src/components/dashboard/ActivityFeed.tsx

---

### 1.4 コンタクト管理（CRM基盤）

#### Task 1.4.1: コンタクト一覧画面
- [ ] **状態**: 未着手
- **説明**: 顧客一覧の表示・検索・フィルタリング
- **依存**: Task 1.3.1
- **詳細**:
  - データテーブル（ページネーション、ソート）
  - 検索（名前、メール、LINE ID）
  - タグフィルター
  - CSVエクスポートボタン
- **成果物**:
  - src/app/(dashboard)/contacts/page.tsx
  - src/components/contacts/ContactsTable.tsx
  - コンタクト一覧 Server Action

#### Task 1.4.2: コンタクト詳細画面
- [ ] **状態**: 未着手
- **説明**: 個別顧客の詳細情報表示・編集
- **依存**: Task 1.4.1
- **詳細**:
  - 基本情報表示・編集
  - タグ管理（追加・削除）
  - カスタムフィールド管理
  - 行動履歴（タイムライン）
  - 配信履歴
- **成果物**:
  - src/app/(dashboard)/contacts/[id]/page.tsx
  - src/components/contacts/ContactDetail.tsx
  - src/components/contacts/TagManager.tsx

#### Task 1.4.3: コンタクト作成・編集
- [ ] **状態**: 未着手
- **説明**: コンタクトのCRUD操作
- **依存**: Task 1.4.1
- **詳細**:
  - 作成フォーム（モーダル）
  - 編集フォーム
  - バリデーション（Zod）
  - 重複チェック（メール/LINE ID）
- **成果物**:
  - src/components/contacts/ContactForm.tsx
  - コンタクトCRUD Server Actions

#### Task 1.4.4: タグ管理
- [ ] **状態**: 未着手
- **説明**: タグのCRUD・一括操作
- **依存**: Task 1.4.1
- **詳細**:
  - タグ一覧画面
  - タグ作成（名前、色）
  - タグの一括付与・削除
- **成果物**:
  - src/app/(dashboard)/tags/page.tsx
  - タグCRUD Server Actions

#### Task 1.4.5: CSVインポート/エクスポート
- [ ] **状態**: 未着手
- **説明**: コンタクトの一括インポート・エクスポート
- **依存**: Task 1.4.1
- **詳細**:
  - CSVテンプレートダウンロード
  - インポート処理（バリデーション、重複処理）
  - 進捗表示（大量データ対応）
  - エクスポート（全件/フィルター済み）
- **成果物**:
  - src/components/contacts/ImportModal.tsx
  - CSV処理ユーティリティ

---

## Phase 2: 機能拡張（配信・ファネル・決済）

### 2.1 LINE配信機能

#### Task 2.1.1: LINE設定画面
- [ ] **状態**: 未着手
- **説明**: LINE公式アカウント連携設定
- **依存**: Phase 1完了
- **詳細**:
  - Channel ID / Channel Secret 入力
  - Channel Access Token 取得・保存
  - Webhook URL 表示・コピー
  - 接続テスト機能
- **成果物**:
  - src/app/(dashboard)/settings/line/page.tsx
  - LINE設定 Server Actions

#### Task 2.1.2: LINE Webhook 受信
- [ ] **状態**: 未着手
- **説明**: LINEからのイベント受信処理
- **依存**: Task 2.1.1
- **詳細**:
  - Webhook エンドポイント
  - 署名検証
  - イベント種別に応じた処理分岐
  - Cloud Tasks へのキューイング
- **成果物**:
  - src/app/api/webhooks/line/route.ts
  - src/lib/line/handlers.ts

#### Task 2.1.3: LINE メッセージ送信
- [ ] **状態**: 未着手
- **説明**: LINE Messaging API を使った配信
- **依存**: Task 2.1.2
- **詳細**:
  - Push Message（個別送信）
  - Multicast（一括送信、500件ずつ）
  - Broadcast（全員送信）
  - レート制限対策
- **成果物**:
  - src/lib/line/client.ts
  - src/lib/line/send.ts

#### Task 2.1.4: Flex Message ビルダー
- [ ] **状態**: 未着手
- **説明**: LINEリッチメッセージの作成UI
- **依存**: Task 2.1.3
- **詳細**:
  - Flex Message JSONエディタ
  - ビジュアルプレビュー
  - テンプレート機能
  - 画像・ボタン・カルーセル対応
- **成果物**:
  - src/components/line/FlexBuilder.tsx
  - Flex Message テンプレート集

#### Task 2.1.5: リッチメニュー管理
- [ ] **状態**: 未着手
- **説明**: LINEリッチメニューの作成・管理
- **依存**: Task 2.1.3
- **詳細**:
  - リッチメニュー画像アップロード
  - タップ領域設定
  - セグメント別リッチメニュー
  - デフォルトメニュー設定
- **成果物**:
  - src/app/(dashboard)/settings/line/rich-menu/page.tsx
  - src/components/line/RichMenuEditor.tsx

#### Task 2.1.6: LINE 個別トーク
- [ ] **状態**: 未着手
- **説明**: 1対1のリアルタイムチャット
- **依存**: Task 2.1.2, Pusher設定
- **詳細**:
  - チャットUI（メッセージ一覧、入力）
  - リアルタイム更新（Pusher）
  - 既読管理
  - 返信テンプレート
- **成果物**:
  - src/app/(dashboard)/contacts/[id]/chat/page.tsx
  - src/components/line/ChatInterface.tsx

---

### 2.2 メール配信機能

#### Task 2.2.1: SendGrid 設定
- [ ] **状態**: 未着手
- **説明**: SendGrid API連携設定
- **依存**: Phase 1完了
- **詳細**:
  - API Key 設定
  - 送信元メールアドレス設定
  - ドメイン認証（DKIM/DMARC）案内
- **成果物**:
  - src/app/(dashboard)/settings/email/page.tsx
  - SendGrid設定 Server Actions

#### Task 2.2.2: メール送信基盤
- [ ] **状態**: 未着手
- **説明**: メール送信ユーティリティ
- **依存**: Task 2.2.1
- **詳細**:
  - 単一メール送信
  - バルク送信（1000件ずつ）
  - List-Unsubscribe ヘッダー
  - バウンス/配信失敗処理
- **成果物**:
  - src/lib/sendgrid/client.ts
  - src/lib/sendgrid/send.ts

#### Task 2.2.3: HTMLメールエディタ
- [ ] **状態**: 未着手
- **説明**: リッチなHTMLメール作成UI
- **依存**: Task 2.2.2
- **詳細**:
  - WYSIWYG エディタ（Tiptap）
  - 変数挿入（{{name}} 等）
  - プレビュー機能
  - テンプレート保存
- **成果物**:
  - src/components/email/EmailEditor.tsx
  - メールテンプレート機能

#### Task 2.2.4: メール配信停止機能
- [ ] **状態**: 未着手
- **説明**: オプトアウト（配信停止）機能
- **依存**: Task 2.2.2
- **詳細**:
  - ワンクリック配信停止ページ
  - 配信停止理由の記録
  - 再登録フロー
- **成果物**:
  - src/app/unsubscribe/[token]/page.tsx
  - 配信停止処理 Server Actions

---

### 2.3 キャンペーン（ステップ配信）

#### Task 2.3.1: キャンペーン一覧画面
- [ ] **状態**: 未着手
- **説明**: 配信キャンペーンの一覧管理
- **依存**: Task 2.1.3, Task 2.2.2
- **詳細**:
  - 一覧表示（名前、タイプ、ステータス、配信数）
  - フィルター（タイプ、ステータス）
  - 有効化/一時停止/アーカイブ
- **成果物**:
  - src/app/(dashboard)/campaigns/page.tsx
  - キャンペーン一覧 Server Actions

#### Task 2.3.2: ステップ配信エディタ
- [ ] **状態**: 未着手
- **説明**: ステップ配信シナリオ作成UI
- **依存**: Task 2.3.1
- **詳細**:
  - フローチャート形式UI
  - ステップ追加（メッセージ、待機、条件分岐）
  - ドラッグ&ドロップ並び替え
  - タイミング設定（○日後、○時）
- **成果物**:
  - src/app/(dashboard)/campaigns/[id]/page.tsx
  - src/components/campaigns/StepEditor.tsx
  - src/components/campaigns/StepNode.tsx

#### Task 2.3.3: 条件分岐設定
- [ ] **状態**: 未着手
- **説明**: ステップ内の条件分岐ロジック
- **依存**: Task 2.3.2
- **詳細**:
  - タグ有無による分岐
  - カスタムフィールド値による分岐
  - 開封/クリック有無による分岐
  - 複数条件のAND/OR
- **成果物**:
  - src/components/campaigns/ConditionBuilder.tsx
  - 条件評価ユーティリティ

#### Task 2.3.4: 配信スケジューラー
- [ ] **状態**: 未着手
- **説明**: ステップ配信の自動実行
- **依存**: Task 2.3.2
- **詳細**:
  - Cloud Scheduler による定期チェック（1分毎）
  - 配信対象者の抽出
  - Cloud Tasks へのキューイング
  - 配信結果の記録
- **成果物**:
  - src/app/api/cron/campaigns/route.ts
  - 配信処理ワーカー

#### Task 2.3.5: 配信統計・分析
- [ ] **状態**: 未着手
- **説明**: キャンペーンの効果測定
- **依存**: Task 2.3.4
- **詳細**:
  - 送信数/到達数/開封数/クリック数
  - ステップ別離脱率
  - タグ別効果比較
  - グラフ表示
- **成果物**:
  - src/app/(dashboard)/campaigns/[id]/stats/page.tsx
  - src/components/campaigns/StatsChart.tsx

---

### 2.4 ファネル・LP作成

#### Task 2.4.1: ファネル一覧画面
- [ ] **状態**: 未着手
- **説明**: ファネル（LP群）の一覧管理
- **依存**: Phase 1完了
- **詳細**:
  - 一覧表示（名前、ステータス、PV、CV率）
  - 新規作成（テンプレート選択）
  - 公開/非公開切り替え
- **成果物**:
  - src/app/(dashboard)/funnels/page.tsx
  - ファネル一覧 Server Actions

#### Task 2.4.2: ページビルダー基盤
- [ ] **状態**: 未着手
- **説明**: ドラッグ&ドロップページエディタの基盤
- **依存**: Task 2.4.1
- **詳細**:
  - dnd-kit によるドラッグ&ドロップ
  - ブロック構造（JSON保存）
  - アンドゥ/リドゥ
  - オートセーブ
- **成果物**:
  - src/app/(dashboard)/funnels/[id]/builder/page.tsx
  - src/components/builder/Canvas.tsx
  - src/components/builder/Toolbar.tsx

#### Task 2.4.3: 基本ブロック実装
- [ ] **状態**: 未着手
- **説明**: ページ構成要素（ブロック）の実装
- **依存**: Task 2.4.2
- **詳細**:
  - テキストブロック（Tiptap）
  - 画像ブロック
  - 動画ブロック（YouTube/Vimeo埋め込み）
  - ボタンブロック
  - スペーサー/区切り線
- **成果物**:
  - src/components/builder/blocks/TextBlock.tsx
  - src/components/builder/blocks/ImageBlock.tsx
  - src/components/builder/blocks/VideoBlock.tsx
  - src/components/builder/blocks/ButtonBlock.tsx

#### Task 2.4.4: フォームブロック
- [ ] **状態**: 未着手
- **説明**: 登録フォームブロック
- **依存**: Task 2.4.3
- **詳細**:
  - メール登録フォーム
  - LINE登録ボタン（友だち追加URL）
  - カスタムフィールド入力
  - バリデーション設定
  - 送信後アクション（リダイレクト/タグ付与）
- **成果物**:
  - src/components/builder/blocks/FormBlock.tsx
  - フォーム送信処理

#### Task 2.4.5: カウントダウン・ポップアップ
- [ ] **状態**: 未着手
- **説明**: 緊急性を高める要素
- **依存**: Task 2.4.3
- **詳細**:
  - カウントダウンタイマー（固定日時/訪問時起点）
  - イグジットポップアップ
  - クリックポップアップ
  - 表示条件設定
- **成果物**:
  - src/components/builder/blocks/CountdownBlock.tsx
  - src/components/builder/blocks/PopupBlock.tsx

#### Task 2.4.6: ページ公開・プレビュー
- [ ] **状態**: 未着手
- **説明**: ファネルページの公開処理
- **依存**: Task 2.4.3
- **詳細**:
  - プレビューモード
  - 公開処理（/p/[slug] で表示）
  - 独自ドメイン設定
  - OGP設定（タイトル、画像）
- **成果物**:
  - src/app/p/[...slug]/page.tsx
  - ドメイン設定機能

#### Task 2.4.7: A/Bテスト
- [ ] **状態**: 未着手
- **説明**: ページのA/Bテスト機能
- **依存**: Task 2.4.6
- **詳細**:
  - バリアントページ作成
  - トラフィック分配設定
  - 結果集計（CV率比較）
  - 勝者決定
- **成果物**:
  - A/Bテスト設定UI
  - トラフィック分配ロジック

---

### 2.5 決済連携

#### Task 2.5.1: Stripe 設定
- [ ] **状態**: 未着手
- **説明**: Stripe連携設定
- **依存**: Phase 1完了
- **詳細**:
  - Stripe Connect 設定
  - API Key / Webhook Secret 設定
  - Webhook エンドポイント登録
- **成果物**:
  - src/app/(dashboard)/settings/payments/page.tsx
  - Stripe設定 Server Actions

#### Task 2.5.2: Stripe Webhook 処理
- [ ] **状態**: 未着手
- **説明**: Stripe からのイベント受信
- **依存**: Task 2.5.1
- **詳細**:
  - payment_intent.succeeded
  - customer.subscription.created/updated/deleted
  - invoice.payment_failed
- **成果物**:
  - src/app/api/webhooks/stripe/route.ts
  - src/lib/stripe/handlers.ts

#### Task 2.5.3: 商品管理
- [ ] **状態**: 未着手
- **説明**: 販売商品の作成・管理
- **依存**: Task 2.5.1
- **詳細**:
  - 商品CRUD
  - 単発/サブスク/分割払い設定
  - Stripe Product/Price 同期
  - 商品と会員サイトコースの紐付け
- **成果物**:
  - src/app/(dashboard)/products/page.tsx
  - src/app/(dashboard)/products/[id]/page.tsx
  - 商品CRUD Server Actions

#### Task 2.5.4: 決済フォーム（Checkout）
- [ ] **状態**: 未着手
- **説明**: 決済ページ・処理
- **依存**: Task 2.5.2, Task 2.5.3
- **詳細**:
  - Stripe Checkout Session 作成
  - 3Dセキュア対応
  - 購入後の自動処理（タグ付与、会員権限付与）
  - サンクスページリダイレクト
- **成果物**:
  - 決済フォームブロック
  - Checkout処理 Server Actions

#### Task 2.5.5: 注文管理
- [ ] **状態**: 未着手
- **説明**: 注文履歴・売上管理
- **依存**: Task 2.5.2
- **詳細**:
  - 注文一覧（フィルター、検索）
  - 注文詳細
  - 返金処理
  - 領収書発行
- **成果物**:
  - src/app/(dashboard)/orders/page.tsx
  - src/app/(dashboard)/orders/[id]/page.tsx

#### Task 2.5.6: サブスクリプション管理
- [ ] **状態**: 未着手
- **説明**: 継続課金の管理
- **依存**: Task 2.5.2
- **詳細**:
  - サブスク一覧
  - キャンセル処理
  - 支払い失敗時のリトライ通知
  - 顧客への通知メール
- **成果物**:
  - src/app/(dashboard)/subscriptions/page.tsx
  - サブスク管理 Server Actions

---

### 2.6 会員サイト

#### Task 2.6.1: コース管理
- [ ] **状態**: 未着手
- **説明**: オンラインコースの作成・管理
- **依存**: Phase 1完了
- **詳細**:
  - コースCRUD
  - サムネイル設定
  - 公開/非公開設定
  - 商品との紐付け
- **成果物**:
  - src/app/(dashboard)/courses/page.tsx
  - src/app/(dashboard)/courses/[id]/page.tsx

#### Task 2.6.2: レッスン管理
- [ ] **状態**: 未着手
- **説明**: コース内レッスンの管理
- **依存**: Task 2.6.1
- **詳細**:
  - レッスンCRUD
  - 動画アップロード（Cloudflare Stream）
  - YouTube/Vimeo 埋め込み
  - コンテンツエディタ（テキスト、ダウンロード資料）
  - 並び替え（ドラッグ&ドロップ）
- **成果物**:
  - src/app/(dashboard)/courses/[id]/lessons/page.tsx
  - src/components/courses/LessonEditor.tsx

#### Task 2.6.3: 段階的公開設定
- [ ] **状態**: 未着手
- **説明**: 入会日に応じたコンテンツ公開
- **依存**: Task 2.6.2
- **詳細**:
  - レッスンごとの公開日数設定
  - 公開済み/未公開の表示制御
  - 次回公開日の表示
- **成果物**:
  - 公開制御ロジック
  - 会員向け表示コンポーネント

#### Task 2.6.4: 会員サイトフロントエンド
- [ ] **状態**: 未着手
- **説明**: 受講者向け画面
- **依存**: Task 2.6.2
- **詳細**:
  - コース一覧ページ
  - レッスン視聴ページ
  - 進捗表示（完了マーク）
  - 動画プレイヤー（チャプター対応）
- **成果物**:
  - src/app/m/[slug]/page.tsx（コース一覧）
  - src/app/m/[slug]/[lessonId]/page.tsx（レッスン視聴）

#### Task 2.6.5: 進捗管理
- [ ] **状態**: 未着手
- **説明**: 受講進捗のトラッキング
- **依存**: Task 2.6.4
- **詳細**:
  - レッスン完了マーク
  - 動画視聴時間記録
  - コース完了率計算
  - 管理者向け進捗レポート
- **成果物**:
  - 進捗記録 Server Actions
  - 進捗レポート画面

---

### 2.7 予約・イベント

#### Task 2.7.1: Google カレンダー連携
- [ ] **状態**: 未着手
- **説明**: Google Calendar API 連携
- **依存**: Phase 1完了
- **詳細**:
  - OAuth2 認証フロー
  - カレンダー一覧取得
  - 空き時間取得
  - 予定作成
- **成果物**:
  - src/lib/google/calendar.ts
  - Google連携設定画面

#### Task 2.7.2: イベント作成・管理
- [ ] **状態**: 未着手
- **説明**: セミナー/個別相談の作成
- **依存**: Task 2.7.1
- **詳細**:
  - イベントCRUD
  - 日時設定（複数日程対応）
  - 定員設定
  - オンライン/オフライン設定
- **成果物**:
  - src/app/(dashboard)/events/page.tsx
  - src/app/(dashboard)/events/[id]/page.tsx

#### Task 2.7.3: Zoom 連携
- [ ] **状態**: 未着手
- **説明**: Zoom ミーティング自動作成
- **依存**: Task 2.7.2
- **詳細**:
  - Zoom OAuth2 認証
  - ミーティング自動作成
  - ミーティングURL の予約者への自動送付
- **成果物**:
  - src/lib/zoom/client.ts
  - Zoom連携設定画面

#### Task 2.7.4: 予約フォーム
- [ ] **状態**: 未着手
- **説明**: 公開予約ページ
- **依存**: Task 2.7.2
- **詳細**:
  - 空き日程表示（カレンダーUI）
  - 予約フォーム（名前、メール、電話）
  - 確認メール自動送信
  - LINE通知連携
- **成果物**:
  - src/app/r/[slug]/page.tsx
  - 予約処理 Server Actions

#### Task 2.7.5: リマインダー配信
- [ ] **状態**: 未着手
- **説明**: 予約日前の自動通知
- **依存**: Task 2.7.4, Task 2.1.3
- **詳細**:
  - リマインダー設定（3日前、1日前、1時間前等）
  - LINE/メールでの自動送信
  - キャンセル/変更リンク
- **成果物**:
  - リマインダー設定UI
  - リマインダー送信ワーカー

---

## Phase 3: AI/MCP統合

### 3.1 AI機能

#### Task 3.1.1: Claude API 統合
- [ ] **状態**: 未着手
- **説明**: Claude APIとの連携基盤
- **依存**: Phase 2完了
- **詳細**:
  - @anthropic-ai/sdk インストール
  - API Key 設定
  - 基本リクエストユーティリティ
  - レート制限対策
- **成果物**:
  - src/lib/ai/claude.ts

#### Task 3.1.2: AIコピーライティング
- [ ] **状態**: 未着手
- **説明**: メール/LINE文面のAI生成
- **依存**: Task 3.1.1
- **詳細**:
  - プロンプトテンプレート
  - 文脈（商品、ターゲット）の入力
  - 複数案の生成
  - 編集・採用フロー
- **成果物**:
  - src/components/ai/CopyGenerator.tsx
  - AI生成 Server Actions

#### Task 3.1.3: AIチャットボット
- [ ] **状態**: 未着手
- **説明**: LINE自動応答の高度化
- **依存**: Task 3.1.1, Task 2.1.6
- **詳細**:
  - FAQ学習（ドキュメント取り込み）
  - 自然言語での質問応答
  - 人間への引き継ぎ判断
  - 応答履歴・学習改善
- **成果物**:
  - AIチャットボット設定画面
  - AI応答ハンドラー

#### Task 3.1.4: 予測分析（任意）
- [ ] **状態**: 未着手
- **説明**: 購買予測、離脱予測
- **依存**: Task 3.1.1
- **詳細**:
  - 過去データの分析
  - 購買確率スコア算出
  - 離脱リスク警告
  - ダッシュボード表示
- **成果物**:
  - 予測モデル実装
  - 予測結果表示UI

---

### 3.2 分析・レポート

#### Task 3.2.1: 分析ダッシュボード
- [ ] **状態**: 未着手
- **説明**: 各種指標の可視化
- **依存**: Phase 2完了
- **詳細**:
  - 期間選択（日/週/月/カスタム）
  - コンタクト推移グラフ
  - 配信効果グラフ
  - 売上グラフ
- **成果物**:
  - src/app/(dashboard)/analytics/page.tsx
  - src/components/analytics/Charts.tsx

#### Task 3.2.2: ファネル分析
- [ ] **状態**: 未着手
- **説明**: ファネルの段階別分析
- **依存**: Task 3.2.1
- **詳細**:
  - ファネル可視化（各ステップの人数、離脱率）
  - A/Bテスト結果比較
  - 改善提案（AI連携）
- **成果物**:
  - src/app/(dashboard)/analytics/funnels/page.tsx
  - ファネルチャートコンポーネント

#### Task 3.2.3: クロス分析
- [ ] **状態**: 未着手
- **説明**: 複数条件の掛け合わせ分析
- **依存**: Task 3.2.1
- **詳細**:
  - 軸選択（タグ、流入元、購入商品等）
  - クロス集計表
  - セグメント比較
- **成果物**:
  - src/app/(dashboard)/analytics/cross/page.tsx
  - クロス分析UI

#### Task 3.2.4: レポートエクスポート
- [ ] **状態**: 未着手
- **説明**: 分析データのエクスポート
- **依存**: Task 3.2.1
- **詳細**:
  - CSV/Excel エクスポート
  - PDF レポート生成
  - 定期レポート自動送信
- **成果物**:
  - レポート生成ユーティリティ
  - 自動送信設定画面

---

## Phase 4: 高度機能

### 4.1 自動ウェビナー

#### Task 4.1.1: ウェビナー設定
- [ ] **状態**: 未着手
- **説明**: 自動ウェビナーの作成
- **依存**: Phase 3完了
- **詳細**:
  - 動画アップロード
  - 日程選択画面作成
  - 事前登録フォーム
- **成果物**:
  - src/app/(dashboard)/webinars/page.tsx
  - ウェビナー設定 Server Actions

#### Task 4.1.2: 擬似ライブ配信
- [ ] **状態**: 未着手
- **説明**: 録画動画のライブ風配信
- **依存**: Task 4.1.1
- **詳細**:
  - 開始時刻制御
  - シークバー無効化
  - 視聴離脱防止
- **成果物**:
  - src/app/w/[id]/page.tsx
  - 擬似ライブプレイヤー

#### Task 4.1.3: ライブチャット演出
- [ ] **状態**: 未着手
- **説明**: 事前設定コメントの時限表示
- **依存**: Task 4.1.2
- **詳細**:
  - コメントタイムライン設定
  - リアルタイムコメント表示
  - 視聴者コメント投稿
- **成果物**:
  - チャット設定UI
  - リアルタイムチャットコンポーネント

---

### 4.2 アフィリエイト

#### Task 4.2.1: パートナー管理
- [ ] **状態**: 未着手
- **説明**: アフィリエイター登録・管理
- **依存**: Phase 2完了
- **詳細**:
  - パートナー申請フォーム
  - 承認/却下フロー
  - パートナー一覧（管理者画面）
  - 報酬率設定
- **成果物**:
  - src/app/(dashboard)/partners/page.tsx
  - パートナー管理 Server Actions

#### Task 4.2.2: 紹介リンク・成果計測
- [ ] **状態**: 未着手
- **説明**: アフィリエイトトラッキング
- **依存**: Task 4.2.1
- **詳細**:
  - 紹介コード発行
  - Cookie トラッキング
  - 登録・購入の成果記録
  - 成果レポート
- **成果物**:
  - トラッキングミドルウェア
  - パートナーダッシュボード

#### Task 4.2.3: 報酬管理
- [ ] **状態**: 未着手
- **説明**: 報酬計算・支払い管理
- **依存**: Task 4.2.2
- **詳細**:
  - 報酬計算（月次）
  - 承認/非承認フロー
  - 支払い一覧
  - 振込依頼機能（将来）
- **成果物**:
  - 報酬管理画面
  - 報酬計算バッチ処理

---

### 4.3 SMS配信

#### Task 4.3.1: Twilio 連携
- [ ] **状態**: 未着手
- **説明**: SMS配信基盤
- **依存**: Phase 2完了
- **詳細**:
  - Twilio API 連携
  - 送信元番号設定
  - 送信処理
- **成果物**:
  - src/lib/twilio/client.ts
  - SMS設定画面

#### Task 4.3.2: SMS キャンペーン
- [ ] **状態**: 未着手
- **説明**: SMS配信機能
- **依存**: Task 4.3.1
- **詳細**:
  - 一斉配信
  - リマインダーSMS
  - 配信履歴
- **成果物**:
  - SMS配信機能
  - キャンペーンタイプ追加

---

## インフラ・運用タスク

### I.1 Google Cloud 構築

#### Task I.1.1: GCPプロジェクト初期設定
- [ ] **状態**: 未着手
- **説明**: Google Cloud プロジェクトの初期構築
- **依存**: なし
- **詳細**:
  - プロジェクト作成
  - 必要なAPI有効化
  - IAM設定
  - VPC設定
- **成果物**:
  - GCPプロジェクト
  - Terraform設定ファイル

#### Task I.1.2: Cloud SQL 構築
- [ ] **状態**: 未着手
- **説明**: PostgreSQLインスタンス構築
- **依存**: Task I.1.1
- **詳細**:
  - インスタンス作成（Regional HA）
  - データベース作成
  - ユーザー作成
  - バックアップ設定
- **成果物**:
  - Cloud SQL インスタンス
  - 接続情報

#### Task I.1.3: Cloud Run デプロイ設定
- [ ] **状態**: 未着手
- **説明**: Cloud Run サービス設定
- **依存**: Task I.1.1
- **詳細**:
  - Dockerfile作成
  - cloudbuild.yaml 作成
  - 環境変数設定
  - オートスケール設定
- **成果物**:
  - Dockerfile
  - cloudbuild.yaml

#### Task I.1.4: Cloud Tasks/Scheduler 設定
- [ ] **状態**: 未着手
- **説明**: 非同期処理基盤
- **依存**: Task I.1.3
- **詳細**:
  - キュー作成（email, line, webhook）
  - Scheduler ジョブ作成
  - デッドレター設定
- **成果物**:
  - Cloud Tasks キュー
  - Scheduler ジョブ

---

### I.2 CDN・ストレージ

#### Task I.2.1: Cloudflare 設定
- [ ] **状態**: 未着手
- **説明**: CDN・WAF設定
- **依存**: Task I.1.3
- **詳細**:
  - ドメイン設定
  - SSL設定
  - キャッシュルール
  - WAFルール
- **成果物**:
  - Cloudflare設定

#### Task I.2.2: Cloudflare R2 設定
- [ ] **状態**: 未着手
- **説明**: オブジェクトストレージ設定
- **依存**: Task I.2.1
- **詳細**:
  - バケット作成
  - CORS設定
  - アップロードユーティリティ
- **成果物**:
  - R2バケット
  - アップロードAPI

#### Task I.2.3: Cloudflare Stream 設定
- [ ] **状態**: 未着手
- **説明**: 動画配信基盤
- **依存**: Task I.2.1
- **詳細**:
  - Stream有効化
  - アップロードAPI
  - プレイヤー設定
- **成果物**:
  - Stream設定
  - 動画アップロード機能

---

### I.3 CI/CD

#### Task I.3.1: GitHub Actions 設定
- [ ] **状態**: 未着手
- **説明**: CI/CDパイプライン構築
- **依存**: Task I.1.3
- **詳細**:
  - テスト自動実行
  - ビルド・デプロイ
  - staging/production 分離
- **成果物**:
  - .github/workflows/deploy.yml
  - .github/workflows/test.yml

#### Task I.3.2: 監視・アラート設定
- [ ] **状態**: 未着手
- **説明**: モニタリング基盤
- **依存**: Task I.1.3
- **詳細**:
  - Cloud Monitoring設定
  - アラートポリシー作成
  - Slack通知連携
- **成果物**:
  - 監視ダッシュボード
  - アラートポリシー

---

## テスト

### T.1 テスト基盤

#### Task T.1.1: テスト環境構築
- [ ] **状態**: 未着手
- **説明**: テスト基盤のセットアップ
- **依存**: Task 1.1.1
- **詳細**:
  - Vitest 設定
  - Testing Library 設定
  - テスト用DB設定
  - モック設定
- **成果物**:
  - vitest.config.ts
  - テストユーティリティ

#### Task T.1.2: E2Eテスト環境
- [ ] **状態**: 未着手
- **説明**: E2Eテスト基盤
- **依存**: Task T.1.1
- **詳細**:
  - Playwright 設定
  - テストシナリオ作成
  - CI連携
- **成果物**:
  - playwright.config.ts
  - E2Eテストスイート

---

## 法的対応

### L.1 特定商取引法・特定電子メール法

#### Task L.1.1: 法的表示テンプレート
- [ ] **状態**: 未着手
- **説明**: 法的に必要な表示の実装
- **依存**: Task 2.5.4
- **詳細**:
  - 特定商取引法に基づく表記
  - プライバシーポリシー
  - 利用規約
  - 配信停止リンク
- **成果物**:
  - 法的ページテンプレート
  - 自動挿入機能

#### Task L.1.2: 同意記録機能
- [ ] **状態**: 未着手
- **説明**: オプトイン同意の記録
- **依存**: Task L.1.1
- **詳細**:
  - 同意日時・IP・画面構成の記録
  - 同意履歴の検索・エクスポート
- **成果物**:
  - 同意記録テーブル
  - 同意記録API

---

## 付録

### A. 優先度マトリクス

| 優先度 | タスク群 | Phase |
|--------|---------|-------|
| P0（必須） | 認証、テナント、コンタクト管理、LINE配信基盤、メール配信基盤 | 1 |
| P1（重要） | ステップ配信、ファネルビルダー、決済、会員サイト基盤 | 2 |
| P2（推奨） | AI機能、分析ダッシュボード、予約、リッチメニュー | 2-3 |
| P3（任意） | 自動ウェビナー、アフィリエイト、SMS、予測分析 | 4 |

### B. 技術スタック早見表

| カテゴリ | 技術 | 導入タスク |
|---------|------|-----------|
| フレームワーク | Next.js 15 | Task 1.1.1 |
| UI | shadcn/ui, Tailwind | Task 1.1.2 |
| DB | Prisma + PostgreSQL | Task 1.1.3 |
| 認証 | Clerk | Task 1.2.1 |
| LINE | @line/bot-sdk | Task 2.1.1 |
| メール | SendGrid | Task 2.2.1 |
| 決済 | Stripe | Task 2.5.1 |
| AI | Claude API | Task 3.1.1 |
| インフラ | Google Cloud | Task I.1.1 |

### C. 外部サービス一覧

| サービス | 用途 | 必要な認証情報 |
|---------|------|---------------|
| Clerk | 認証 | CLERK_SECRET_KEY |
| LINE | 配信 | CHANNEL_ID, CHANNEL_SECRET, ACCESS_TOKEN |
| SendGrid | メール | SENDGRID_API_KEY |
| Stripe | 決済 | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET |
| Google | カレンダー | OAuth2 credentials |
| Zoom | 会議 | OAuth2 credentials |
| Cloudflare | CDN/Storage | API_TOKEN |
| Upstash | Redis | UPSTASH_REDIS_REST_URL, TOKEN |
| Pusher | WebSocket | APP_ID, KEY, SECRET |

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2025-01-31 | 初版作成 | - |
