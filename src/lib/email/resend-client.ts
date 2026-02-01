/**
 * Resend Email Client
 *
 * 迷惑メール対策済みのメール配信システム
 * - SPF/DKIM/DMARC自動設定
 * - React Email対応
 * - 配信追跡・分析
 *
 * 無料枠: 3,000通/月、100通/日
 *
 * @see https://resend.com/docs
 */

import { Resend } from "resend";

// Resendクライアント初期化
const resend = new Resend(process.env.RESEND_API_KEY);

// メール送信オプション
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
  scheduledAt?: Date;
}

// 送信結果
export interface SendResult {
  success: boolean;
  id?: string;
  error?: string;
}

// ドメイン設定ステータス
export interface DomainStatus {
  domain: string;
  status: "not_started" | "pending" | "verified" | "failed";
  spf: { status: string; value?: string };
  dkim: { status: string; value?: string };
  dmarc: { status: string; value?: string };
}

/**
 * メールを送信
 */
export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  try {
    const defaultFrom = process.env.EMAIL_FROM || "noreply@yourdomain.com";

    // 必須フィールドのみでオブジェクトを構築
    const emailPayload: {
      from: string;
      to: string[];
      subject: string;
      html?: string;
      text?: string;
    } = {
      from: options.from || defaultFrom,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    };

    // オプションフィールドを追加
    if (options.html) emailPayload.html = options.html;
    if (options.text) emailPayload.text = options.text;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await resend.emails.send(emailPayload as any);

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Email send exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * バッチメール送信（複数宛先に異なる内容）
 */
export async function sendBatchEmails(
  emails: Array<{
    to: string;
    subject: string;
    html: string;
    from?: string;
  }>
): Promise<{ success: boolean; results: SendResult[] }> {
  const results: SendResult[] = [];

  // Resendのバッチ送信制限（100通/リクエスト）に対応
  const batchSize = 100;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    const batchPromises = batch.map((email) =>
      sendEmail({
        to: email.to,
        subject: email.subject,
        html: email.html,
        from: email.from,
      })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // レート制限対策：バッチ間に少し待機
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return {
    success: results.every((r) => r.success),
    results,
  };
}

/**
 * ドメインの認証状態を確認
 */
export async function checkDomainStatus(
  domain: string
): Promise<DomainStatus | null> {
  try {
    const { data, error } = await resend.domains.list();

    if (error || !data) {
      console.error("Domain check error:", error);
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const domainData = (data as any).data?.find((d: any) => d.name === domain);

    if (!domainData) {
      return {
        domain,
        status: "not_started",
        spf: { status: "not_configured" },
        dkim: { status: "not_configured" },
        dmarc: { status: "not_configured" },
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = domainData.records as any[] | undefined;

    return {
      domain,
      status: domainData.status as DomainStatus["status"],
      spf: {
        status: records?.find((r) => r.record === "SPF")?.status || "unknown",
        value: records?.find((r) => r.record === "SPF")?.value,
      },
      dkim: {
        status: records?.find((r) => r.record === "DKIM")?.status || "unknown",
        value: records?.find((r) => r.record === "DKIM")?.value,
      },
      dmarc: {
        status: records?.find((r) => r.record === "DMARC")?.status || "unknown",
        value: records?.find((r) => r.record === "DMARC")?.value,
      },
    };
  } catch (error) {
    console.error("Domain check exception:", error);
    return null;
  }
}

/**
 * 新しいドメインを追加
 */
export async function addDomain(
  domain: string
): Promise<{ success: boolean; records?: Array<{ type: string; name: string; value: string }> }> {
  try {
    const { data, error } = await resend.domains.create({ name: domain });

    if (error) {
      console.error("Domain add error:", error);
      return { success: false };
    }

    // 必要なDNSレコードを返す
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataAny = data as any;
    const records = dataAny?.records?.map((r: any) => ({
      type: r.type || "TXT",
      name: r.name || "",
      value: r.value || "",
    })) || [];

    return { success: true, records };
  } catch (error) {
    console.error("Domain add exception:", error);
    return { success: false };
  }
}

// ==================== メールテンプレート ====================

/**
 * ウェルカムメールを送信
 */
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<SendResult> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">ようこそ！🎉</h1>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px;">こんにちは、<strong>${name}</strong>さん</p>
    <p>ご登録いただきありがとうございます。</p>
    <p>これから素晴らしい体験をお届けできることを楽しみにしています。</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://example.com"}/dashboard"
         style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        ダッシュボードを開く
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">
      ご質問がありましたら、いつでもお気軽にお問い合わせください。
    </p>
  </div>
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>このメールは ${to} 宛に送信されました。</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color: #999;">配信停止</a></p>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `${name}さん、ようこそ！ご登録ありがとうございます`,
    html,
    tags: [
      { name: "category", value: "welcome" },
      { name: "user", value: name },
    ],
  });
}

/**
 * パスワードリセットメールを送信
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string
): Promise<SendResult> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
    <h2 style="color: #333; margin-top: 0;">パスワードリセットのご依頼</h2>
    <p>パスワードリセットのリクエストを受け付けました。</p>
    <p>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}"
         style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        パスワードをリセット
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">
      このリンクは24時間有効です。<br>
      心当たりがない場合は、このメールを無視してください。
    </p>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: "【重要】パスワードリセットのご案内",
    html,
    tags: [{ name: "category", value: "transactional" }],
  });
}

// ==================== 配信設定ガイド ====================

/**
 * SPF/DKIM/DMARC設定ガイドを生成
 */
export function generateDNSSetupGuide(domain: string): string {
  return `
# ${domain} のメール認証設定ガイド

## 1. SPFレコード（必須）
DNS TXTレコードを追加:
\`\`\`
ホスト: @（または空欄）
タイプ: TXT
値: v=spf1 include:resend.com ~all
\`\`\`

## 2. DKIMレコード（必須）
Resendダッシュボードから取得したCNAMEレコードを追加

## 3. DMARCレコード（推奨）
\`\`\`
ホスト: _dmarc
タイプ: TXT
値: v=DMARC1; p=none; rua=mailto:dmarc@${domain}
\`\`\`

## 4. 確認方法
- Resendダッシュボードで「Verified」になることを確認
- テストメールを送信して「メッセージのソースを表示」で確認

## 注意事項
- DNS反映には最大48時間かかる場合があります
- 既存のSPFレコードがある場合はinclude:resend.comを追加
`;
}
