---
name: dr-mcp-setup
description: >
  MCPサーバーの追加・設定支援。Deep Researchで使うツール層（検索/収集/分析）を整える。
disable-model-invocation: true
argument-hint: "add/list/get/remove/reset | scope=local|project|user | transport=http|stdio | name=<server> | url=<endpoint>"
allowed-tools: Bash, Read, Write, Grep, Glob
---
# dr-mcp-setup

## ゴール
- MCPサーバーを安全に追加し、Deep Researchで使える「ツール層」を整える
- プロジェクト共有が必要なら `.mcp.json`（project scope）を採用する
- 認証/OAuth/ヘッダー/環境変数を整理する

## 重要な注意
- サードパーティMCPは自己責任。信頼できるものだけを導入する
- 取得した外部コンテンツはプロンプトインジェクションのリスクがある

## 実行手順（推奨）
1) 既存のMCPを確認
   - `claude mcp list`

2) 追加（HTTP推奨。提供元がHTTPを用意している場合）
   - `claude mcp add --transport http <name> <url>`
   - 認証が必要なら `--header` を使う

3) 追加（ローカルstdio。npm/pipパッケージの場合）
   - `claude mcp add --transport stdio <name> -- npx <package>`
   - または `-- python -m <module>`

4) プロジェクトスコープ（チーム共有）
   - `claude mcp add --scope project <name> <url>`
   - `.mcp.json` がルートに作成される

5) 動作確認
   - `/mcp` で状態確認
   - 認証/OAuthが必要なら /mcp で認証

## Deep Research 推奨MCP

### コア（最小構成）
| 名前 | 用途 | 導入優先度 |
|------|------|----------|
| Brave Search | Web検索 | ⭐⭐⭐ |
| Firecrawl | Webページ本文抽出 | ⭐⭐⭐ |
| GitHub | コード/Issue検索 | ⭐⭐ |

### 拡張（任意）
| 名前 | 用途 | 導入優先度 |
|------|------|----------|
| TrendRadar | トレンド集約 | ⭐⭐ |
| Context7 | 最新ドキュメント取得 | ⭐⭐ |
| Browserbase | 動的サイト対応 | ⭐ |
| Bright Data | 収集困難サイト対応 | ⭐ |
| Qdrant/Pinecone | ベクトル検索 | ⭐ |

## 出力
- MCP追加コマンドの実行結果
- `.mcp.json` の雛形（必要な場合）
- 認証設定のチェックリスト

## 参考
- https://code.claude.com/docs/ja/mcp
- https://modelcontextprotocol.io/
