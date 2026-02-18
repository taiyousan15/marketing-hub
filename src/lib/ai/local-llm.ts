/**
 * AI テキスト生成ユーティリティ
 *
 * プロバイダー抽象化レイヤー（provider.ts）を経由し、
 * 環境変数 AI_PROVIDER に応じて Ollama / Claude / OpenAI を自動切替。
 */

import { getAIClient, getProvider } from './provider';
import type { AIMessage, AICompletionOptions } from './provider';

// ==================== 型定義 ====================

export interface GeneratedChatMessage {
  seconds: number;
  name: string;
  message: string;
  type: 'COMMENT' | 'QUESTION' | 'REACTION' | 'TESTIMONIAL';
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
 * AIサービスの接続確認
 */
export async function checkAIHealth(): Promise<{
  available: boolean;
  provider: string;
  error?: string;
}> {
  const provider = getProvider();
  try {
    const client = await getAIClient();
    // 軽量なテストリクエストで疎通確認
    await client.complete(
      [{ role: 'user', content: 'ping' }],
      { maxTokens: 5 }
    );
    return { available: true, provider };
  } catch (error) {
    return {
      available: false,
      provider,
      error: error instanceof Error ? error.message : 'Connection failed',
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
    density?: 'sparse' | 'medium' | 'dense';
    includeQuestions?: boolean;
    includeTestimonials?: boolean;
  } & LLMGenerateOptions = {}
): Promise<GeneratedChatMessage[]> {
  const {
    count = 20,
    density = 'medium',
    includeQuestions = true,
    includeTestimonials = true,
    temperature = 0.8,
  } = options;

  const densityGuide = {
    sparse: '5-10秒に1件程度',
    medium: '3-5秒に1件程度',
    dense: '1-3秒に1件程度',
  };

  const messageTypes = ['コメント', 'リアクション'];
  if (includeQuestions) messageTypes.push('質問');
  if (includeTestimonials) messageTypes.push('感想・体験談');

  const systemPrompt = `あなたはウェビナーの視聴者コメントを生成するアシスタントです。
自然な日本語で、実際のウェビナー参加者が書きそうなコメントを生成してください。

生成ルール:
- 名前は日本人の一般的な名前（苗字のみ、またはニックネーム）
- コメントは1-2文の短いもの
- 絵文字は控えめに使用可（多用しない）
- ${densityGuide[density]}のペースで配置
- タイプ: ${messageTypes.join('、')}
- 秒数は0から${webinarContext.videoDuration}の範囲

出力形式: JSON配列のみ（説明不要）
[{"seconds": 30, "name": "田中", "message": "よろしくお願いします！", "type": "COMMENT"}]

type の値: COMMENT, QUESTION, REACTION, TESTIMONIAL`;

  const userPrompt = `以下のウェビナーに対して${count}件のコメントを生成してください:

タイトル: ${webinarContext.title}
${webinarContext.description ? `説明: ${webinarContext.description}` : ''}
${webinarContext.topic ? `トピック: ${webinarContext.topic}` : ''}
動画長: ${Math.floor(webinarContext.videoDuration / 60)}分${webinarContext.videoDuration % 60}秒

重要: JSON配列のみを出力。説明文は不要。`;

  try {
    const client = await getAIClient();
    const result = await client.complete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature }
    );

    const content = result.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('JSON array not found in response');
    }

    const messages: GeneratedChatMessage[] = JSON.parse(jsonMatch[0]);

    return messages
      .filter(
        (m) =>
          typeof m.seconds === 'number' &&
          typeof m.name === 'string' &&
          typeof m.message === 'string'
      )
      .map((m) => ({
        seconds: Math.max(0, Math.min(webinarContext.videoDuration, m.seconds)),
        name: m.name.slice(0, 20),
        message: m.message.slice(0, 200),
        type: ['COMMENT', 'QUESTION', 'REACTION', 'TESTIMONIAL'].includes(m.type)
          ? m.type
          : 'COMMENT',
      }))
      .sort((a, b) => a.seconds - b.seconds);
  } catch (error) {
    console.error('Failed to generate chat:', error);
    throw new Error(
      `チャット生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    style?: 'urgent' | 'benefit' | 'social-proof' | 'scarcity';
    variations?: number;
  } & LLMGenerateOptions = {}
): Promise<GeneratedOffer[]> {
  const {
    style = 'benefit',
    variations = 3,
    temperature = 0.9,
  } = options;

  const styleGuide = {
    urgent: '緊急性を強調（今すぐ、期間限定、残りわずか）',
    benefit: 'ベネフィットを強調（得られる結果、変化）',
    'social-proof': '社会的証明（実績、お客様の声）',
    scarcity: '希少性を強調（限定、特別、あなただけ）',
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
${context.productDescription ? `説明: ${context.productDescription}` : ''}
${context.targetAudience ? `ターゲット: ${context.targetAudience}` : ''}
${context.price ? `価格: ${context.price}` : ''}
${context.originalPrice ? `通常価格: ${context.originalPrice}` : ''}
${context.deadline ? `期限: ${context.deadline}` : ''}

JSON配列のみを出力。`;

  try {
    const client = await getAIClient();
    const result = await client.complete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature }
    );

    const content = result.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('JSON array not found in response');
    }

    const offers: GeneratedOffer[] = JSON.parse(jsonMatch[0]);

    return offers.map((o) => ({
      title: (o.title || '').slice(0, 30),
      description: (o.description || '').slice(0, 100),
      buttonText: (o.buttonText || '申し込む').slice(0, 15),
      urgencyText: o.urgencyText ? o.urgencyText.slice(0, 20) : undefined,
    }));
  } catch (error) {
    console.error('Failed to generate offer:', error);
    throw new Error(
      `オファー生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    format?: 'text' | 'json';
  } & LLMGenerateOptions = {}
): Promise<string> {
  const {
    systemPrompt = 'あなたは優秀なアシスタントです。日本語で回答してください。',
    temperature = 0.7,
  } = options;

  try {
    const client = await getAIClient();
    const result = await client.complete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      { temperature }
    );

    return result.content;
  } catch (error) {
    console.error('Failed to generate text:', error);
    throw new Error(
      `テキスト生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    systemPrompt = 'あなたは優秀なアシスタントです。日本語で回答してください。',
    temperature = 0.7,
  } = options;

  try {
    const client = await getAIClient();
    const stream = client.completeStream(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      { temperature }
    );

    for await (const chunk of stream) {
      yield chunk;
    }
  } catch (error) {
    console.error('Failed to stream text:', error);
    throw new Error(
      `ストリーミング生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    style?: 'bullet' | 'paragraph' | 'highlights';
    maxLength?: number;
  } & LLMGenerateOptions = {}
): Promise<string> {
  const {
    style = 'bullet',
    maxLength = 500,
    temperature = 0.5,
  } = options;

  const styleGuide = {
    bullet: '箇条書きで要点をまとめる',
    paragraph: '段落形式で流れるように説明',
    highlights: '重要なハイライトのみを抽出',
  };

  const systemPrompt = `あなたはウェビナーコンテンツの要約専門家です。
スタイル: ${styleGuide[style]}
最大文字数: ${maxLength}文字以内`;

  try {
    const client = await getAIClient();
    const result = await client.complete(
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `以下のウェビナー内容を要約してください:\n\n${transcript}`,
        },
      ],
      { temperature }
    );

    return result.content.slice(0, maxLength);
  } catch (error) {
    console.error('Failed to summarize:', error);
    throw new Error(
      `要約生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
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
  const { temperature = 0.6 } = options;

  const systemPrompt = `あなたは「${context.webinarTitle}」のウェビナー主催者${context.speakerName ? `（${context.speakerName}）` : ''}です。
視聴者からの質問に丁寧に回答してください。

回答ルール:
- 親しみやすく、専門的すぎない言葉で
- 100-200文字程度で簡潔に
- 具体的なアドバイスや例を含める
${context.webinarTopic ? `\nトピック: ${context.webinarTopic}` : ''}
${context.additionalContext ? `\n追加情報: ${context.additionalContext}` : ''}`;

  try {
    const client = await getAIClient();
    const result = await client.complete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      { temperature }
    );

    return result.content;
  } catch (error) {
    console.error('Failed to generate answer:', error);
    throw new Error(
      `回答生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
