/**
 * ローカルLLM統合（Ollama）
 *
 * 対応モデル:
 * - qwen2.5:7b / 14b - 日本語対応、高品質
 * - gemma2:9b - バランス良い
 * - elyza:7b - 日本語特化
 * - llama3.1:8b - 汎用
 *
 * セットアップ:
 * 1. curl -fsSL https://ollama.com/install.sh | sh
 * 2. ollama pull qwen2.5:7b
 * 3. ollama serve
 */

import { Ollama } from "ollama";

// Ollamaクライアント設定
const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
const defaultModel = process.env.OLLAMA_MODEL || "qwen2.5:7b";

let ollamaClient: Ollama | null = null;

function getOllamaClient(): Ollama {
  if (!ollamaClient) {
    ollamaClient = new Ollama({ host: ollamaHost });
  }
  return ollamaClient;
}

// ==================== 型定義 ====================

export interface GeneratedChatMessage {
  seconds: number;
  name: string;
  message: string;
  type: "COMMENT" | "QUESTION" | "REACTION" | "TESTIMONIAL";
}

export interface GeneratedOffer {
  title: string;
  description: string;
  buttonText: string;
  urgencyText?: string;
}

export interface LLMGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// ==================== ヘルスチェック ====================

/**
 * Ollamaサーバーの接続確認
 */
export async function checkOllamaHealth(): Promise<{
  available: boolean;
  models: string[];
  error?: string;
}> {
  try {
    const client = getOllamaClient();
    const response = await client.list();
    return {
      available: true,
      models: response.models.map((m) => m.name),
    };
  } catch (error) {
    return {
      available: false,
      models: [],
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

// ==================== チャット生成 ====================

/**
 * シミュレートチャットを生成
 */
export async function generateSimulatedChat(
  webinarContext: {
    title: string;
    description?: string;
    videoDuration: number;
    topic?: string;
  },
  options: {
    count?: number;
    density?: "sparse" | "medium" | "dense";
    includeQuestions?: boolean;
    includeTestimonials?: boolean;
  } & LLMGenerateOptions = {}
): Promise<GeneratedChatMessage[]> {
  const {
    count = 20,
    density = "medium",
    includeQuestions = true,
    includeTestimonials = true,
    model = defaultModel,
    temperature = 0.8,
  } = options;

  const densityGuide = {
    sparse: "5-10秒に1件程度",
    medium: "3-5秒に1件程度",
    dense: "1-3秒に1件程度",
  };

  const messageTypes = ["コメント", "リアクション"];
  if (includeQuestions) messageTypes.push("質問");
  if (includeTestimonials) messageTypes.push("感想・体験談");

  const systemPrompt = `あなたはウェビナーの視聴者コメントを生成するアシスタントです。
自然な日本語で、実際のウェビナー参加者が書きそうなコメントを生成してください。

生成ルール:
- 名前は日本人の一般的な名前（苗字のみ、またはニックネーム）
- コメントは1-2文の短いもの
- 絵文字は控えめに使用可（多用しない）
- ${densityGuide[density]}のペースで配置
- タイプ: ${messageTypes.join("、")}
- 秒数は0から${webinarContext.videoDuration}の範囲

出力形式: JSON配列のみ（説明不要）
[{"seconds": 30, "name": "田中", "message": "よろしくお願いします！", "type": "COMMENT"}]

type の値: COMMENT, QUESTION, REACTION, TESTIMONIAL`;

  const userPrompt = `以下のウェビナーに対して${count}件のコメントを生成してください:

タイトル: ${webinarContext.title}
${webinarContext.description ? `説明: ${webinarContext.description}` : ""}
${webinarContext.topic ? `トピック: ${webinarContext.topic}` : ""}
動画長: ${Math.floor(webinarContext.videoDuration / 60)}分${webinarContext.videoDuration % 60}秒

重要: JSON配列のみを出力。説明文は不要。`;

  try {
    const client = getOllamaClient();
    const response = await client.chat({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      options: {
        temperature,
      },
    });

    // JSONをパース
    const content = response.message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("JSON array not found in response");
    }

    const messages: GeneratedChatMessage[] = JSON.parse(jsonMatch[0]);

    // バリデーションと正規化
    return messages
      .filter(
        (m) =>
          typeof m.seconds === "number" &&
          typeof m.name === "string" &&
          typeof m.message === "string"
      )
      .map((m) => ({
        seconds: Math.max(0, Math.min(webinarContext.videoDuration, m.seconds)),
        name: m.name.slice(0, 20),
        message: m.message.slice(0, 200),
        type: ["COMMENT", "QUESTION", "REACTION", "TESTIMONIAL"].includes(m.type)
          ? m.type
          : "COMMENT",
      }))
      .sort((a, b) => a.seconds - b.seconds);
  } catch (error) {
    console.error("Failed to generate chat:", error);
    throw new Error(
      `チャット生成に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// ==================== オファーコピー生成 ====================

/**
 * オファーのコピーを生成
 */
export async function generateOfferCopy(
  context: {
    productName: string;
    productDescription?: string;
    targetAudience?: string;
    price?: string;
    originalPrice?: string;
    deadline?: string;
  },
  options: {
    style?: "urgent" | "benefit" | "social-proof" | "scarcity";
    variations?: number;
  } & LLMGenerateOptions = {}
): Promise<GeneratedOffer[]> {
  const {
    style = "benefit",
    variations = 3,
    model = defaultModel,
    temperature = 0.9,
  } = options;

  const styleGuide = {
    urgent: "緊急性を強調（今すぐ、期間限定、残りわずか）",
    benefit: "ベネフィットを強調（得られる結果、変化）",
    "social-proof": "社会的証明（実績、お客様の声）",
    scarcity: "希少性を強調（限定、特別、あなただけ）",
  };

  const systemPrompt = `あなたはセールスコピーライターです。
ウェビナーのオファーポップアップ用のコピーを生成してください。

スタイル: ${styleGuide[style]}

生成ルール:
- title: 20文字以内、インパクトのあるヘッドライン
- description: 50文字以内、行動を促す説明
- buttonText: 8文字以内、アクション動詞を含む
- urgencyText: 15文字以内（任意）、緊急性を表現

出力形式: JSON配列のみ
[{"title": "...", "description": "...", "buttonText": "...", "urgencyText": "..."}]`;

  const userPrompt = `以下の商品/サービスに対して${variations}パターンのオファーコピーを生成:

商品名: ${context.productName}
${context.productDescription ? `説明: ${context.productDescription}` : ""}
${context.targetAudience ? `ターゲット: ${context.targetAudience}` : ""}
${context.price ? `価格: ${context.price}` : ""}
${context.originalPrice ? `通常価格: ${context.originalPrice}` : ""}
${context.deadline ? `期限: ${context.deadline}` : ""}

JSON配列のみを出力。`;

  try {
    const client = getOllamaClient();
    const response = await client.chat({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      options: {
        temperature,
      },
    });

    const content = response.message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("JSON array not found in response");
    }

    const offers: GeneratedOffer[] = JSON.parse(jsonMatch[0]);

    return offers.map((o) => ({
      title: (o.title || "").slice(0, 30),
      description: (o.description || "").slice(0, 100),
      buttonText: (o.buttonText || "申し込む").slice(0, 15),
      urgencyText: o.urgencyText ? o.urgencyText.slice(0, 20) : undefined,
    }));
  } catch (error) {
    console.error("Failed to generate offer:", error);
    throw new Error(
      `オファー生成に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// ==================== 汎用テキスト生成 ====================

/**
 * 汎用テキスト生成
 */
export async function generateText(
  prompt: string,
  options: {
    systemPrompt?: string;
    format?: "text" | "json";
  } & LLMGenerateOptions = {}
): Promise<string> {
  const {
    systemPrompt = "あなたは優秀なアシスタントです。日本語で回答してください。",
    format = "text",
    model = defaultModel,
    temperature = 0.7,
  } = options;

  try {
    const client = getOllamaClient();
    const response = await client.chat({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      options: {
        temperature,
      },
    });

    return response.message.content;
  } catch (error) {
    console.error("Failed to generate text:", error);
    throw new Error(
      `テキスト生成に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// ==================== ストリーミング生成 ====================

/**
 * ストリーミングでテキスト生成
 */
export async function* generateTextStream(
  prompt: string,
  options: {
    systemPrompt?: string;
  } & LLMGenerateOptions = {}
): AsyncGenerator<string> {
  const {
    systemPrompt = "あなたは優秀なアシスタントです。日本語で回答してください。",
    model = defaultModel,
    temperature = 0.7,
  } = options;

  try {
    const client = getOllamaClient();
    const response = await client.chat({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      stream: true,
      options: {
        temperature,
      },
    });

    for await (const chunk of response) {
      if (chunk.message?.content) {
        yield chunk.message.content;
      }
    }
  } catch (error) {
    console.error("Failed to stream text:", error);
    throw new Error(
      `ストリーミング生成に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// ==================== ウェビナー要約 ====================

/**
 * ウェビナーの内容を要約
 */
export async function summarizeWebinarContent(
  transcript: string,
  options: {
    style?: "bullet" | "paragraph" | "highlights";
    maxLength?: number;
  } & LLMGenerateOptions = {}
): Promise<string> {
  const {
    style = "bullet",
    maxLength = 500,
    model = defaultModel,
    temperature = 0.5,
  } = options;

  const styleGuide = {
    bullet: "箇条書きで要点をまとめる",
    paragraph: "段落形式で流れるように説明",
    highlights: "重要なハイライトのみを抽出",
  };

  const systemPrompt = `あなたはウェビナーコンテンツの要約専門家です。
スタイル: ${styleGuide[style]}
最大文字数: ${maxLength}文字以内`;

  try {
    const client = getOllamaClient();
    const response = await client.chat({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `以下のウェビナー内容を要約してください:\n\n${transcript}`,
        },
      ],
      options: {
        temperature,
      },
    });

    return response.message.content.slice(0, maxLength);
  } catch (error) {
    console.error("Failed to summarize:", error);
    throw new Error(
      `要約生成に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// ==================== 質問回答生成 ====================

/**
 * 視聴者の質問に対する回答を生成
 */
export async function generateQuestionAnswer(
  question: string,
  context: {
    webinarTitle: string;
    webinarTopic?: string;
    speakerName?: string;
    additionalContext?: string;
  },
  options: LLMGenerateOptions = {}
): Promise<string> {
  const { model = defaultModel, temperature = 0.6 } = options;

  const systemPrompt = `あなたは「${context.webinarTitle}」のウェビナー主催者${context.speakerName ? `（${context.speakerName}）` : ""}です。
視聴者からの質問に丁寧に回答してください。

回答ルール:
- 親しみやすく、専門的すぎない言葉で
- 100-200文字程度で簡潔に
- 具体的なアドバイスや例を含める
${context.webinarTopic ? `\nトピック: ${context.webinarTopic}` : ""}
${context.additionalContext ? `\n追加情報: ${context.additionalContext}` : ""}`;

  try {
    const client = getOllamaClient();
    const response = await client.chat({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      options: {
        temperature,
      },
    });

    return response.message.content;
  } catch (error) {
    console.error("Failed to generate answer:", error);
    throw new Error(
      `回答生成に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
