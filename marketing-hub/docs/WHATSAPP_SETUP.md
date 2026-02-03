# WhatsApp Business API セットアップガイド

## 概要

Twilio WhatsApp APIを使用したメッセージ配信システムです。
高い開封率（90%以上）と既読確認機能により、効果的なマーケティングコミュニケーションを実現します。

## 必要な環境変数

`.env.local`に以下を追加してください：

```bash
# Twilio設定（SMS設定と共通）
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# WhatsApp番号（Sandbox or 本番）
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## セットアップ手順

### 1. Twilio Sandboxの設定（開発用）

1. [Twilio Console](https://www.twilio.com/console)にログイン
2. Messaging → Try it out → Send a WhatsApp message
3. QRコードをスキャンまたは指定コードを送信してSandboxに参加
4. Sandbox番号（`whatsapp:+14155238886`）をメモ

### 2. 管理画面からの設定

1. 設定 → WhatsApp設定 にアクセス
2. 以下を入力：
   - Account SID
   - Auth Token
   - WhatsApp番号（`whatsapp:+1234567890`形式）
3. 送信時間帯を設定（推奨: 9:00-21:00 JST）
4. 「有効化」をONにする
5. テスト送信で動作確認

### 3. 本番環境への移行

1. Twilioで正式なWhatsApp番号を申請
2. Meta Business Manager承認プロセスを完了
3. テンプレートメッセージの承認を取得

## API使用方法

### WhatsAppメッセージ送信

```typescript
POST /api/whatsapp/send
Content-Type: application/json

{
  "tenantId": "tenant-id",
  "to": "+819012345678",
  "body": "こんにちは！新商品のご案内です。",
  "mediaUrl": "https://example.com/image.jpg" // オプション
}
```

### WhatsApp設定取得

```typescript
GET /api/whatsapp/settings?tenantId=tenant-id
```

### WhatsApp設定更新

```typescript
PUT /api/whatsapp/settings?tenantId=tenant-id
Content-Type: application/json

{
  "enabled": true,
  "sendingHoursStart": 9,
  "sendingHoursEnd": 21
}
```

## 24時間ルール

WhatsApp Business APIには重要な制限があります：

### セッションウィンドウ（24時間）

- ユーザーからメッセージを受信後、24時間以内は自由にメッセージ送信可能
- 24時間経過後は**テンプレートメッセージ**のみ送信可能

### テンプレートメッセージ

- Meta承認が必要（1-2日）
- 変数パラメータで動的コンテンツ挿入可能
- マーケティング、アラート、通知などカテゴリ別

```typescript
// テンプレートメッセージの例
POST /api/whatsapp/send
{
  "to": "+819012345678",
  "templateId": "order_confirmation",
  "templateParams": {
    "1": "山田太郎",
    "2": "123456",
    "3": "¥10,000"
  }
}
```

## マルチチャンネル配信との統合

ステップメール/キャンペーンで自動的にチャンネル選択：

```typescript
import { deliverWithIntelligentFallback } from '@/lib/step-delivery';

// AI最適化によるチャンネル自動選択
const result = await deliverWithIntelligentFallback({
  channel: 'WHATSAPP',
  contactId: 'contact-id',
  tenantId: 'tenant-id',
  whatsappMessage: 'キャンペーンのお知らせです',
});

// フォールバック: WHATSAPP → LINE → SMS → EMAIL
```

## メディアメッセージ

WhatsAppでは画像・動画・ドキュメントを送信可能：

```typescript
POST /api/whatsapp/send
{
  "to": "+819012345678",
  "body": "新商品カタログをお送りします",
  "mediaUrl": "https://example.com/catalog.pdf"
}
```

対応メディア：
- 画像: JPG, PNG（最大5MB）
- 動画: MP4（最大16MB）
- ドキュメント: PDF, DOC, XLS（最大100MB）
- 音声: MP3, OGG（最大16MB）

## コンプライアンス

### オプトイン要件

- WhatsApp配信には事前の明示的な同意が必要
- 登録フォームに「WhatsAppでの連絡に同意する」チェックボックス推奨

### オプトアウト対応

以下のキーワードで自動配信停止：
- `STOP`
- `UNSUBSCRIBE`
- `停止`
- `解除`
- `配信停止`

## 料金目安

| 項目 | 料金（目安） |
|------|-------------|
| Business-Initiated（テンプレート） | ¥15-30/通 |
| User-Initiated（24時間内応答） | ¥5-10/通 |
| メディアメッセージ | 追加料金なし |

※Twilio/Meta公式料金は地域・時期により変動

## トラブルシューティング

### メッセージが届かない

1. Sandbox参加済みか確認（開発環境）
2. 番号が`whatsapp:+`形式か確認
3. 24時間ルールに違反していないか確認
4. オプトアウトされていないか確認

### エラーコード

- `63016`: 24時間ウィンドウ外（テンプレート使用）
- `63007`: レート制限超過
- `63003`: Sandbox未参加の番号

## 関連ドキュメント

- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy/)
- [Meta Business Help](https://www.facebook.com/business/help/524220081677109)
