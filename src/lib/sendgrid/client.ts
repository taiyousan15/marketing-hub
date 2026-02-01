import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  listUnsubscribe?: string;
}

/**
 * メールを送信
 */
export async function sendEmail(params: EmailParams) {
  const fromEmail = params.from || process.env.SENDGRID_FROM_EMAIL || "";
  const fromName = params.fromName || process.env.SENDGRID_FROM_NAME || "";

  const msg = {
    to: params.to,
    from: {
      email: fromEmail,
      name: fromName,
    },
    subject: params.subject,
    html: params.html,
    headers: params.listUnsubscribe
      ? {
          "List-Unsubscribe": params.listUnsubscribe,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        }
      : undefined,
  };

  return sgMail.send(msg);
}

/**
 * 複数のメールを一括送信
 */
export async function sendBulkEmails(emails: EmailParams[]) {
  const CHUNK_SIZE = 1000;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "";
  const fromName = process.env.SENDGRID_FROM_NAME || "";

  const messages = emails.map((email) => ({
    to: email.to,
    from: {
      email: email.from || fromEmail,
      name: email.fromName || fromName,
    },
    subject: email.subject,
    html: email.html,
  }));

  // 1000件ずつに分割して送信
  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    const chunk = messages.slice(i, i + CHUNK_SIZE);
    await sgMail.send(chunk);
    // レート制限対策
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * テンプレートを使用してメールを送信
 */
export async function sendTemplateEmail(params: {
  to: string;
  templateId: string;
  dynamicTemplateData: Record<string, unknown>;
  from?: string;
}) {
  const fromEmail = params.from || process.env.SENDGRID_FROM_EMAIL || "";
  const fromName = process.env.SENDGRID_FROM_NAME || "";

  const msg = {
    to: params.to,
    from: {
      email: fromEmail,
      name: fromName,
    },
    templateId: params.templateId,
    dynamicTemplateData: params.dynamicTemplateData,
  };

  return sgMail.send(msg);
}
