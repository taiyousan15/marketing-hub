# SMS配信システム セットアップガイド

## 概要

世界トップクラスのD+アーキテクチャに基づくSMS配信システムです。
Twilio APIを使用し、MCP Server連携によるAIエージェント統合にも対応しています。

## 必要な環境変数

`.env.local`に以下を追加してください：

```bash
# Twilio設定（必須）
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+81XXXXXXXXXX

# スケジュール配信用（オプション）
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Twilioアカウント設定

### 1. アカウント作成
1. [Twilio Console](https://www.twilio.com/console)にアクセス
2. アカウントを作成
3. Account SIDとAuth Tokenを取得

### 2. 電話番号取得
1. Phone Numbers > Buy a Number
2. 日本の電話番号（+81）を取得
3. SMS機能が有効化されていることを確認

### 3. Webhookの設定
1. Phone Numbers > Manage > Active Numbers
2. 取得した番号をクリック
3. Messagingセクションで以下を設定：
   - **A MESSAGE COMES IN**: `https://your-domain.com/api/webhooks/sms`
   - **HTTP POST**を選択

## 管理画面からの設定

1. 設定 > SMS設定 にアクセス
2. 以下を入力：
   - Account SID
   - Auth Token
   - 送信元電話番号（E.164形式: +81XXXXXXXXXX）
3. 送信時間帯を設定（推奨: 9:00-20:00 JST）
4. 「有効化」をONにする

## MCP Server設定（AIエージェント連携）

### Claude Desktop設定

`~/.claude/settings.json`に以下を追加：

```json
{
  "mcpServers": {
    "twilio-sms": {
      "command": "npx",
      "args": ["@twilio-alpha/mcp"],
      "env": {
        "TWILIO_ACCOUNT_SID": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "TWILIO_AUTH_TOKEN": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### セキュリティ注意
- 公式Twilio MCPサーバーのみを使用してください
- コミュニティMCPサーバーとの併用は避けてください

## API使用方法

### SMS送信（API）

```typescript
POST /api/sms/send
Content-Type: application/json

{
  "to": "+819012345678",
  "body": "テストメッセージです",
  "contactId": "optional-contact-id"
}
```

### SMS設定取得

```typescript
GET /api/sms/settings
```

### SMS設定更新

```typescript
PUT /api/sms/settings
Content-Type: application/json

{
  "enabled": true,
  "sendingHoursStart": 9,
  "sendingHoursEnd": 20,
  "removeUrls": true
}
```

## 日本向け注意事項

### URLの取り扱い
- 日本のキャリア（docomo, au, SoftBank）はURL含むSMSをブロック/フィルタリングします
- `removeUrls: true`（デフォルト）で自動的にURLを除去します
- URLを送りたい場合は、メールやLINEを併用してください

### 文字数制限
- 日本語SMS: **70文字/セグメント**
- 英語SMS: 160文字/セグメント
- 150文字の日本語メッセージ = 3セグメント = 3倍の料金

### 送信時間
- 推奨: 9:00-20:00 JST
- 深夜・早朝の送信は避けてください

### コンプライアンス
- 特定電子メール法に準拠
- 事前オプトイン必須
- オプトアウト対応（STOP, 停止など）

## ステップメールでのSMS使用

キャンペーンステップでSMSを選択できます：

1. キャンペーン > ステップ追加
2. チャンネル: 「SMS」を選択
3. SMS本文を入力（70文字推奨）
4. 送信タイミングを設定

## 料金目安

| 項目 | 料金（目安） |
|------|-------------|
| 日本国内SMS | ¥8-12/通 |
| セグメント追加 | ¥8-12/セグメント |
| 月額基本料 | 無料（従量課金） |

※Twilio公式料金は変動する可能性があります

## トラブルシューティング

### SMS が届かない
1. 電話番号がE.164形式か確認（+81XXXXXXXXXX）
2. SMS設定が有効か確認
3. オプトアウトされていないか確認
4. 送信時間帯内か確認

### エラーコード
- `21608`: 未確認の電話番号（トライアルアカウント制限）
- `21211`: 無効な電話番号形式
- `21610`: 配信停止リスト登録済み

## サポート

問題がある場合は、ログを確認してください：
- `/api/webhooks/sms` のWebhookログ
- SMSLogテーブルのエラーメッセージ
