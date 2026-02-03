---
name: dr-build
description: >
  dr-synthesize の implementation_plan.md を実装に落とし込む。PoC/MVP/Production の段階的実装を支援。
disable-model-invocation: true
argument-hint: "[plan_path] | stage=poc|mvp|prod | stack=python|node|go | storage=sqlite|postgres|mongodb"
allowed-tools: Read, Write, Edit, Glob, Bash(git:*), Bash(python:*), Bash(node:*), Bash(docker:*)
---
# dr-build

## 方針
- いきなり全部作らない。PoC → MVP → Production の順で段階的に。
- すべての実装は「どの証拠/要件に対応するか」を追跡できるようにする（planへのリンク）。

## 実装の基本手順
1) `implementation_plan.md` を読み、MVPスコープを確定
2) コンポーネントごとに最小スケルトンを作る
3) ローカル実行手順（README）とテスト（最小）を追加
4) データ保存（runs/ evidence）を壊さないようにI/O契約を固定
5) 可能なら lint / format / CI を用意

## MVPでまず作る推奨コンポーネント
- connectors: RSS + WebSearch + （任意でSNS/News API）
- extractor: html→text/markdown
- normalizer: URL正規化、重複排除、言語判定、メタデータ抽出
- storage: runディレクトリ + SQLite or Postgres
- search: 全文検索 + ベクトル検索（RAG用）
- reporter: evidence.jsonl → report.md 変換

## 段階別スコープ

### PoC（概念実証）
- 単一ソースからの収集
- ローカルファイル保存
- 手動実行
- 目的: 技術的実現可能性の確認

### MVP（最小実用製品）
- 複数ソース対応
- DB保存（SQLite/Postgres）
- スケジュール実行（cron）
- 基本的なエラーハンドリング
- 目的: 実用的な価値の提供

### Production
- 高可用性（キュー/リトライ）
- モニタリング/アラート
- セキュリティ強化
- スケーラビリティ
- 目的: 本番運用

## 出力
- 実装コード
- README.md（セットアップ手順）
- テストコード
- 環境変数テンプレート（.env.example）

## 重要な注意
- 秘密情報はコミットしない（.env / secrets manager 前提）
- 外部APIの利用規約を遵守
- エラーログに個人情報を含めない
