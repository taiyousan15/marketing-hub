/**
 * AIコンテンツ生成エンジン
 * パーソナライズされたメール/LINEメッセージを自動生成
 *
 * 根拠:
 * - ev-003: パーソナライゼーションで収益成長10pp向上（BCG）
 * - ev-008: 生成AIで1対1パーソナライゼーション可能（Klaviyo）
 * - ev-013: AIメール最適化で開封率38%、CTR45%向上（Salesforce）
 */

import { claude, isAIConfigured } from "./claude";
import type { RFMSegment } from "../analytics/rfm";

// ==================== コンテンツタイプ ====================

export type ContentType =
  | "email_subject"
  | "email_body"
  | "line_message"
  | "push_notification"
  | "sms";

export type ContentTone =
  | "formal"      // フォーマル・ビジネス
  | "friendly"    // フレンドリー・親しみやすい
  | "casual"      // カジュアル
  | "urgent"      // 緊急性を強調
  | "empathetic"  // 共感的
  | "persuasive"; // 説得的

export type ContentPurpose =
  | "welcome"           // ウェルカム
  | "nurturing"         // ナーチャリング
  | "promotion"         // プロモーション
  | "announcement"      // お知らせ
  | "reminder"          // リマインダー
  | "reengagement"      // 再エンゲージメント
  | "thank_you"         // サンクス
  | "survey"            // アンケート
  | "support"           // サポート
  | "upsell"            // アップセル
  | "cross_sell";       // クロスセル

// ==================== コンテキスト ====================

export interface ContentContext {
  // 顧客情報
  contact?: {
    name?: string;
    email?: string;
    tags?: string[];
    segment?: RFMSegment;
    purchaseHistory?: number;
    lastPurchaseDate?: Date;
    score?: number;
  };

  // コンテンツ設定
  purpose: ContentPurpose;
  tone: ContentTone;
  type: ContentType;

  // 商品/キャンペーン情報
  product?: {
    name: string;
    description?: string;
    price?: number;
    benefits?: string[];
  };

  campaign?: {
    name: string;
    deadline?: Date;
    discount?: string;
  };

  // 追加コンテキスト
  customInstructions?: string;
  maxLength?: number;
  includeEmoji?: boolean;
  language?: "ja" | "en";
}

// ==================== 生成結果 ====================

export interface GeneratedContent {
  content: string;
  type: ContentType;
  metadata: {
    generatedAt: Date;
    model: string;
    tokensUsed?: number;
    context: ContentContext;
  };
  variations?: string[];
  suggestions?: {
    improvements: string[];
    warnings: string[];
  };
}

// ==================== テンプレート ====================

const TEMPLATES: Record<ContentPurpose, Record<ContentTone, string>> = {
  welcome: {
    formal: "{{name}}様、この度はご登録いただきありがとうございます。",
    friendly: "{{name}}さん、ようこそ！登録ありがとうございます✨",
    casual: "{{name}}さん、はじめまして！",
    urgent: "{{name}}様、今すぐ始めましょう！",
    empathetic: "{{name}}さん、お会いできて嬉しいです。",
    persuasive: "{{name}}様、最高の選択です！",
  },
  nurturing: {
    formal: "{{name}}様、いつもご利用いただきありがとうございます。",
    friendly: "{{name}}さん、お元気ですか？",
    casual: "{{name}}さん、最近どうですか？",
    urgent: "{{name}}様、お見逃しなく！",
    empathetic: "{{name}}さん、いかがお過ごしですか？",
    persuasive: "{{name}}様、特別なご案内です。",
  },
  promotion: {
    formal: "{{name}}様、特別なご案内をお届けいたします。",
    friendly: "{{name}}さんに特別なお知らせ！",
    casual: "{{name}}さん、これ見て！",
    urgent: "【緊急】{{name}}様、本日限定！",
    empathetic: "{{name}}さんのために特別に用意しました。",
    persuasive: "{{name}}様、この機会をお見逃しなく！",
  },
  reengagement: {
    formal: "{{name}}様、お久しぶりでございます。",
    friendly: "{{name}}さん、お久しぶりです！",
    casual: "{{name}}さん、元気してた？",
    urgent: "{{name}}様、戻ってきてください！",
    empathetic: "{{name}}さん、最近お見かけしなくて寂しいです。",
    persuasive: "{{name}}様、特別な復帰特典をご用意しました！",
  },
  announcement: {
    formal: "{{name}}様、重要なお知らせがございます。",
    friendly: "{{name}}さんにお知らせ！",
    casual: "{{name}}さん、ニュースだよ！",
    urgent: "【重要】{{name}}様へ",
    empathetic: "{{name}}さん、大切なお知らせです。",
    persuasive: "{{name}}様、見逃せないお知らせ！",
  },
  reminder: {
    formal: "{{name}}様、リマインドのご連絡です。",
    friendly: "{{name}}さん、忘れてない？",
    casual: "{{name}}さん、リマインダー！",
    urgent: "【お急ぎください】{{name}}様",
    empathetic: "{{name}}さん、念のためのご連絡です。",
    persuasive: "{{name}}様、まだ間に合います！",
  },
  thank_you: {
    formal: "{{name}}様、誠にありがとうございました。",
    friendly: "{{name}}さん、ありがとう！",
    casual: "{{name}}さん、サンキュー！",
    urgent: "{{name}}様、心より感謝申し上げます！",
    empathetic: "{{name}}さん、本当にありがとうございます。",
    persuasive: "{{name}}様、感謝の気持ちを込めて特典をお届け！",
  },
  survey: {
    formal: "{{name}}様、ご意見をお聞かせください。",
    friendly: "{{name}}さん、教えて！",
    casual: "{{name}}さん、ちょっと聞いていい？",
    urgent: "{{name}}様、今すぐご回答ください！",
    empathetic: "{{name}}さんの声を聞かせてください。",
    persuasive: "{{name}}様、回答で特典GET！",
  },
  support: {
    formal: "{{name}}様、サポートチームでございます。",
    friendly: "{{name}}さん、困ってることない？",
    casual: "{{name}}さん、何か手伝おうか？",
    urgent: "{{name}}様、すぐに対応いたします！",
    empathetic: "{{name}}さん、お困りのことがあればお聞かせください。",
    persuasive: "{{name}}様、私たちがサポートします！",
  },
  upsell: {
    formal: "{{name}}様、さらに良いご提案がございます。",
    friendly: "{{name}}さんにピッタリなのがあるよ！",
    casual: "{{name}}さん、これもいいかも！",
    urgent: "{{name}}様、今だけの特別アップグレード！",
    empathetic: "{{name}}さんのためを思って、ご提案です。",
    persuasive: "{{name}}様、もっと良い体験を！",
  },
  cross_sell: {
    formal: "{{name}}様、関連商品のご案内です。",
    friendly: "{{name}}さん、これも一緒にどう？",
    casual: "{{name}}さん、これ合わせると最高！",
    urgent: "{{name}}様、セット購入で更にお得！",
    empathetic: "{{name}}さんが気に入りそうなものを見つけました。",
    persuasive: "{{name}}様、この組み合わせが人気です！",
  },
};

// ==================== メール件名生成 ====================

/**
 * メール件名を生成
 */
export async function generateEmailSubject(
  context: ContentContext,
  count: number = 3
): Promise<string[]> {
  const baseTemplate = TEMPLATES[context.purpose]?.[context.tone] || "";
  const contactName = context.contact?.name || "お客様";

  if (!isAIConfigured) {
    // フォールバック：テンプレートベース
    const base = baseTemplate.replace(/\{\{name\}\}/g, contactName);
    return [base, `${base}【重要】`, `📧 ${base}`].slice(0, count);
  }

  const prompt = `
メールの件名を${count}個生成してください。

【目的】${getPurposeLabel(context.purpose)}
【トーン】${getToneLabel(context.tone)}
【顧客名】${contactName}
${context.contact?.segment ? `【セグメント】${context.contact.segment}` : ""}
${context.product ? `【商品】${context.product.name}` : ""}
${context.campaign ? `【キャンペーン】${context.campaign.name}${context.campaign.deadline ? `（期限: ${context.campaign.deadline.toLocaleDateString("ja-JP")}）` : ""}` : ""}
${context.customInstructions ? `【追加指示】${context.customInstructions}` : ""}

【条件】
- 50文字以内
- 開封したくなる魅力的な件名
- ${context.includeEmoji ? "絵文字を適度に使用" : "絵文字は使用しない"}
- 日本語で

JSON配列形式で件名のみ返してください：
["件名1", "件名2", "件名3"]
`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.error("Email subject generation error:", error);
  }

  // フォールバック
  const base = baseTemplate.replace(/\{\{name\}\}/g, contactName);
  return [base];
}

// ==================== メール本文生成 ====================

/**
 * メール本文を生成
 */
export async function generateEmailBody(
  context: ContentContext,
  template?: string
): Promise<GeneratedContent> {
  const contactName = context.contact?.name || "お客様";
  const maxLength = context.maxLength || 500;

  if (!isAIConfigured) {
    const fallbackContent = template
      ? template.replace(/\{\{name\}\}/g, contactName)
      : `${contactName}様\n\nいつもご利用いただきありがとうございます。\n\n今後ともよろしくお願いいたします。`;

    return {
      content: fallbackContent,
      type: "email_body",
      metadata: {
        generatedAt: new Date(),
        model: "fallback",
        context,
      },
    };
  }

  const prompt = `
メール本文を生成してください。

【目的】${getPurposeLabel(context.purpose)}
【トーン】${getToneLabel(context.tone)}
【顧客名】${contactName}
${context.contact?.segment ? `【セグメント】${context.contact.segment}（${getSegmentDescription(context.contact.segment)}）` : ""}
${context.contact?.purchaseHistory ? `【購入履歴】${context.contact.purchaseHistory}回` : ""}
${context.product ? `【商品】${context.product.name}\n【説明】${context.product.description || ""}\n【価格】${context.product.price ? `¥${context.product.price.toLocaleString()}` : ""}` : ""}
${context.campaign ? `【キャンペーン】${context.campaign.name}\n【割引】${context.campaign.discount || ""}\n【期限】${context.campaign.deadline?.toLocaleDateString("ja-JP") || ""}` : ""}
${template ? `【テンプレート】\n${template}` : ""}
${context.customInstructions ? `【追加指示】${context.customInstructions}` : ""}

【条件】
- ${maxLength}文字以内
- ${context.includeEmoji ? "絵文字を適度に使用" : "絵文字は使用しない"}
- 挨拶から締めの言葉まで含む完全なメール
- 顧客セグメントに合わせたパーソナライズ
- 日本語で

メール本文のみを返してください（JSON形式ではなく、テキストのみ）。
`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      return {
        content: content.text.trim(),
        type: "email_body",
        metadata: {
          generatedAt: new Date(),
          model: "claude-sonnet-4-20250514",
          context,
        },
      };
    }
  } catch (error) {
    console.error("Email body generation error:", error);
  }

  // フォールバック
  return {
    content: `${contactName}様\n\nいつもご利用いただきありがとうございます。\n\n今後ともよろしくお願いいたします。`,
    type: "email_body",
    metadata: {
      generatedAt: new Date(),
      model: "fallback",
      context,
    },
  };
}

// ==================== LINEメッセージ生成 ====================

/**
 * LINEメッセージを生成
 */
export async function generateLineMessage(
  context: ContentContext
): Promise<GeneratedContent> {
  const contactName = context.contact?.name || "";
  const maxLength = context.maxLength || 200;

  if (!isAIConfigured) {
    const template = TEMPLATES[context.purpose]?.[context.tone] || "";
    const fallbackContent = template.replace(/\{\{name\}\}/g, contactName || "");

    return {
      content: fallbackContent,
      type: "line_message",
      metadata: {
        generatedAt: new Date(),
        model: "fallback",
        context,
      },
    };
  }

  const prompt = `
LINEメッセージを生成してください。

【目的】${getPurposeLabel(context.purpose)}
【トーン】${getToneLabel(context.tone)}
${contactName ? `【顧客名】${contactName}` : ""}
${context.contact?.segment ? `【セグメント】${context.contact.segment}` : ""}
${context.product ? `【商品】${context.product.name}` : ""}
${context.campaign ? `【キャンペーン】${context.campaign.name}` : ""}
${context.customInstructions ? `【追加指示】${context.customInstructions}` : ""}

【条件】
- ${maxLength}文字以内
- ${context.includeEmoji ? "絵文字を効果的に使用" : "絵文字は控えめに"}
- LINEメッセージとして自然な文体
- 短く、読みやすく
- 日本語で

メッセージ本文のみを返してください。
`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      return {
        content: content.text.trim(),
        type: "line_message",
        metadata: {
          generatedAt: new Date(),
          model: "claude-sonnet-4-20250514",
          context,
        },
      };
    }
  } catch (error) {
    console.error("LINE message generation error:", error);
  }

  // フォールバック
  const template = TEMPLATES[context.purpose]?.[context.tone] || "";
  return {
    content: template.replace(/\{\{name\}\}/g, contactName || ""),
    type: "line_message",
    metadata: {
      generatedAt: new Date(),
      model: "fallback",
      context,
    },
  };
}

// ==================== バリエーション生成 ====================

/**
 * コンテンツのバリエーションを生成（A/Bテスト用）
 */
export async function generateVariations(
  baseContent: string,
  count: number = 3,
  type: ContentType = "email_body"
): Promise<string[]> {
  if (!isAIConfigured) {
    return [baseContent];
  }

  const prompt = `
以下のコンテンツのバリエーションを${count}個生成してください。
元のメッセージの意図は保ちながら、表現を変えてください。

【元のコンテンツ】
${baseContent}

【タイプ】${type === "email_subject" ? "メール件名" : type === "line_message" ? "LINEメッセージ" : "メール本文"}

【条件】
- 元の意図・目的は維持
- 表現・言い回しを変える
- 長さは同程度
- A/Bテストで比較できるような違い

JSON配列形式でバリエーションのみ返してください：
["バリエーション1", "バリエーション2", "バリエーション3"]
`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.error("Variation generation error:", error);
  }

  return [baseContent];
}

// ==================== トーン調整 ====================

/**
 * 既存コンテンツのトーンを調整
 */
export async function adjustTone(
  content: string,
  targetTone: ContentTone
): Promise<string> {
  if (!isAIConfigured) {
    return content;
  }

  const prompt = `
以下のコンテンツのトーンを「${getToneLabel(targetTone)}」に調整してください。

【元のコンテンツ】
${content}

【目標トーン】${getToneLabel(targetTone)}
- ${getToneDescription(targetTone)}

内容は変えずに、トーンだけを調整したコンテンツを返してください。
`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const responseContent = response.content[0];
    if (responseContent.type === "text") {
      return responseContent.text.trim();
    }
  } catch (error) {
    console.error("Tone adjustment error:", error);
  }

  return content;
}

// ==================== ヘルパー関数 ====================

function getPurposeLabel(purpose: ContentPurpose): string {
  const labels: Record<ContentPurpose, string> = {
    welcome: "ウェルカム・初回挨拶",
    nurturing: "ナーチャリング・関係構築",
    promotion: "プロモーション・販促",
    announcement: "お知らせ・告知",
    reminder: "リマインダー",
    reengagement: "再エンゲージメント・復帰促進",
    thank_you: "お礼・感謝",
    survey: "アンケート・フィードバック依頼",
    support: "サポート・お問い合わせ対応",
    upsell: "アップセル",
    cross_sell: "クロスセル",
  };
  return labels[purpose] || purpose;
}

function getToneLabel(tone: ContentTone): string {
  const labels: Record<ContentTone, string> = {
    formal: "フォーマル",
    friendly: "フレンドリー",
    casual: "カジュアル",
    urgent: "緊急",
    empathetic: "共感的",
    persuasive: "説得的",
  };
  return labels[tone] || tone;
}

function getToneDescription(tone: ContentTone): string {
  const descriptions: Record<ContentTone, string> = {
    formal: "丁寧で礼儀正しい、ビジネスライクな表現",
    friendly: "親しみやすく温かみのある表現",
    casual: "気軽でリラックスした表現",
    urgent: "緊急性を感じさせる、行動を促す表現",
    empathetic: "相手の気持ちに寄り添う共感的な表現",
    persuasive: "説得力があり、購買意欲を高める表現",
  };
  return descriptions[tone] || "";
}

function getSegmentDescription(segment: RFMSegment): string {
  const descriptions: Record<RFMSegment, string> = {
    champions: "最優良顧客・VIP",
    loyal_customers: "ロイヤル顧客",
    potential_loyalists: "潜在ロイヤル顧客",
    new_customers: "新規顧客",
    promising: "有望顧客",
    need_attention: "要注意顧客",
    about_to_sleep: "休眠予備軍",
    at_risk: "リスク顧客",
    cant_lose_them: "失ってはいけない顧客",
    hibernating: "休眠顧客",
    lost: "離脱顧客",
  };
  return descriptions[segment] || "";
}
