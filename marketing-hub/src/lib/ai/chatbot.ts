/**
 * AIチャットボット サービス
 * ローカルLLM (Ollama) をデフォルトで使用
 */

import { getAIClient, AIMessage } from './provider';

export interface ChatbotConfig {
  mode: 'support' | 'sales' | 'faq';
  temperature?: number;
  maxTokens?: number;
  customPrompt?: string;
  handoffKeywords?: string[];
  faqData?: Array<{ question: string; answer: string }>;
}

export interface ChatbotResponse {
  content: string;
  shouldHandoff: boolean;
  handoffReason?: string;
  confidence: number;
  model: string;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  support: `あなたは丁寧で親切なカスタマーサポート担当者です。
お客様の質問に対して、以下のガイドラインに従って回答してください：

1. 常に丁寧な敬語を使用してください
2. お客様の問題に共感を示してください
3. 具体的で実用的な解決策を提供してください
4. 不明な点がある場合は、確認してから回答すると伝えてください
5. 回答は簡潔で分かりやすくしてください`,

  sales: `あなたは経験豊富なセールス担当者です。
お客様との会話において、以下のガイドラインに従ってください：

1. お客様のニーズを理解することに集中してください
2. 商品やサービスの価値を明確に伝えてください
3. 押し売りはせず、お客様の決定を尊重してください
4. 質問には具体的なメリットを交えて回答してください
5. 購入の意思決定を支援する情報を提供してください`,

  faq: `あなたはFAQに基づいて回答するアシスタントです。
以下のガイドラインに従ってください：

1. 提供されたFAQ情報に基づいて回答してください
2. FAQにない質問の場合は、人間の担当者に確認が必要と伝えてください
3. 回答は簡潔で明確にしてください
4. 追加の質問がないか確認してください`,
};

export class Chatbot {
  private config: ChatbotConfig;

  constructor(config: ChatbotConfig) {
    this.config = config;
  }

  /**
   * メッセージに応答
   */
  async respond(
    userMessage: string,
    conversationHistory: AIMessage[] = []
  ): Promise<ChatbotResponse> {
    // 1. ハンドオフキーワードチェック
    const handoffCheck = this.checkHandoffKeywords(userMessage);
    if (handoffCheck.shouldHandoff) {
      return {
        content: 'ご質問の内容について、担当者が対応させていただきます。少々お待ちください。',
        shouldHandoff: true,
        handoffReason: handoffCheck.reason,
        confidence: 1.0,
        model: 'rule-based',
      };
    }

    // 2. AIクライアント取得
    const client = await getAIClient();

    // 3. システムプロンプト構築
    let systemPrompt = SYSTEM_PROMPTS[this.config.mode] || SYSTEM_PROMPTS.support;

    if (this.config.customPrompt) {
      systemPrompt += `\n\n追加指示:\n${this.config.customPrompt}`;
    }

    if (this.config.mode === 'faq' && this.config.faqData) {
      systemPrompt += '\n\n【FAQ データ】\n';
      this.config.faqData.forEach((faq, index) => {
        systemPrompt += `Q${index + 1}: ${faq.question}\nA${index + 1}: ${faq.answer}\n\n`;
      });
    }

    // 4. メッセージ構築
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    // 5. AI応答生成
    const result = await client.complete(messages, {
      temperature: this.config.temperature ?? 0.7,
      maxTokens: this.config.maxTokens ?? 500,
    });

    return {
      content: result.content,
      shouldHandoff: false,
      confidence: 0.85, // 基本的な信頼度
      model: result.model,
    };
  }

  /**
   * ストリーミング応答
   */
  async *respondStream(
    userMessage: string,
    conversationHistory: AIMessage[] = []
  ): AsyncGenerator<string> {
    // ハンドオフチェック
    const handoffCheck = this.checkHandoffKeywords(userMessage);
    if (handoffCheck.shouldHandoff) {
      yield 'ご質問の内容について、担当者が対応させていただきます。少々お待ちください。';
      return;
    }

    const client = await getAIClient();

    let systemPrompt = SYSTEM_PROMPTS[this.config.mode] || SYSTEM_PROMPTS.support;

    if (this.config.customPrompt) {
      systemPrompt += `\n\n追加指示:\n${this.config.customPrompt}`;
    }

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    for await (const chunk of client.completeStream(messages, {
      temperature: this.config.temperature ?? 0.7,
      maxTokens: this.config.maxTokens ?? 500,
    })) {
      yield chunk;
    }
  }

  /**
   * ハンドオフキーワードチェック
   */
  private checkHandoffKeywords(message: string): { shouldHandoff: boolean; reason?: string } {
    const keywords = this.config.handoffKeywords || [
      'クレーム',
      '返金',
      'キャンセル',
      '解約',
      '担当者',
      '責任者',
      '訴訟',
      '弁護士',
      '消費者センター',
    ];

    const lowerMessage = message.toLowerCase();

    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return {
          shouldHandoff: true,
          reason: `キーワード検出: ${keyword}`,
        };
      }
    }

    return { shouldHandoff: false };
  }

  /**
   * 設定を更新
   */
  updateConfig(newConfig: Partial<ChatbotConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * デフォルトのチャットボットインスタンスを作成
 */
export function createChatbot(config?: Partial<ChatbotConfig>): Chatbot {
  return new Chatbot({
    mode: 'support',
    temperature: 0.7,
    maxTokens: 500,
    ...config,
  });
}
