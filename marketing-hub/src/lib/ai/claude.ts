import Anthropic from "@anthropic-ai/sdk";

// Claude APIクライアント（設定されている場合のみ初期化）
const apiKey = process.env.ANTHROPIC_API_KEY;

export const claude = apiKey
  ? new Anthropic({ apiKey })
  : (null as unknown as Anthropic);

export const isAIConfigured = !!apiKey;

// システムプロンプトのテンプレート
export const systemPrompts = {
  customerSupport: `あなたは親切で丁寧なカスタマーサポートAIアシスタントです。
以下のガイドラインに従って対応してください：

1. 常に敬語で丁寧に対応する
2. 質問に対して簡潔かつ分かりやすく回答する
3. 分からないことは正直に「担当者に確認します」と伝える
4. 個人情報や機密情報は絶対に聞かない
5. 購入や契約に関する重要な決定は人間のスタッフに引き継ぐ
6. 回答は300文字以内に収める`,

  sales: `あなたは商品やサービスの魅力を伝えるセールスAIアシスタントです。
押し売りはせず、お客様のニーズを理解し、適切な提案を行います。`,

  faq: `あなたはFAQに基づいて質問に回答するAIアシスタントです。
登録されたFAQ情報を元に、正確に回答してください。`,
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateAIResponse(
  messages: ChatMessage[],
  systemPrompt: string = systemPrompts.customerSupport,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  if (!claude) {
    throw new Error("AI機能が設定されていません");
  }

  const maxTokens = options?.maxTokens || 1024;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textContent = response.content.find((c) => c.type === "text");
    return textContent ? textContent.text : "";
  } catch (error) {
    console.error("AI response error:", error);
    throw new Error("AI応答の生成に失敗しました");
  }
}

export function shouldAIRespond(message: string): {
  shouldRespond: boolean;
  reason?: string;
} {
  const humanHandoffKeywords = [
    "クレーム", "返金", "キャンセル", "解約",
    "担当者", "人間", "オペレーター",
  ];

  for (const keyword of humanHandoffKeywords) {
    if (message.includes(keyword)) {
      return {
        shouldRespond: false,
        reason: "キーワード「" + keyword + "」を検出。人間に引き継ぎます",
      };
    }
  }

  return { shouldRespond: true };
}

export function buildFAQContext(faqs: Array<{ question: string; answer: string }>): string {
  if (faqs.length === 0) return "";

  const faqText = faqs.map((faq, i) => 
    "Q" + (i + 1) + ": " + faq.question + "\nA" + (i + 1) + ": " + faq.answer
  ).join("\n\n");

  return "【FAQ情報】\n" + faqText + "\n\n上記のFAQを参考に回答してください。";
}
