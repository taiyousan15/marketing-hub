import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  type TaiyoStyleConfig,
  generateHeadlinePrompt,
  generateBodyPrompt,
  generateBulletPrompt,
  generateCTAPrompt,
  generatePSPrompt,
  LP_GENERATION_SYSTEM_PROMPT,
} from '@/lib/ai/taiyo-style';

/**
 * 太陽スタイル AI コピー生成API
 * Claude APIを使用して高成約率コピーを自動生成
 */

const anthropic = new Anthropic();

type CopyType = 'headline' | 'body' | 'bullet' | 'cta' | 'ps' | 'full';

interface GenerateCopyRequest {
  type: CopyType;
  config: TaiyoStyleConfig;
}

interface HeadlineResult {
  headlines: Array<{ text: string; type: string }>;
  recommended: number;
}

interface BodyResult {
  empathy: string;
  problem: string;
  solution: string;
  benefits: string;
  proof: string;
  cta: string;
}

interface BulletResult {
  bullets: Array<{ text: string; emotion: string }>;
}

interface CTAResult {
  buttonText: string;
  subText: string;
  urgencyText: string;
  reassurance: string;
}

interface PSResult {
  ps: Array<{ type: string; text: string }>;
}

interface FullLPResult {
  headline: HeadlineResult;
  body: BodyResult;
  bullets: BulletResult;
  cta: CTAResult;
  ps: PSResult;
}

export async function POST(request: NextRequest) {
  try {
    const { type, config } = await request.json() as GenerateCopyRequest;

    if (!config) {
      return NextResponse.json(
        { error: '設定が必要です' },
        { status: 400 }
      );
    }

    // 生成タイプに応じたプロンプトを選択
    let prompt: string;
    switch (type) {
      case 'headline':
        prompt = generateHeadlinePrompt(config);
        break;
      case 'body':
        prompt = generateBodyPrompt(config);
        break;
      case 'bullet':
        prompt = generateBulletPrompt(config);
        break;
      case 'cta':
        prompt = generateCTAPrompt(config);
        break;
      case 'ps':
        prompt = generatePSPrompt(config);
        break;
      case 'full':
        // フルLP生成（すべてのセクションを一度に）
        return await generateFullLP(config);
      default:
        return NextResponse.json(
          { error: '無効な生成タイプです' },
          { status: 400 }
        );
    }

    // Claude APIで生成
    const result = await generateWithClaude(prompt);

    return NextResponse.json({
      success: true,
      type,
      result,
    });
  } catch (error) {
    console.error('Copy generation error:', error);
    return NextResponse.json(
      { error: 'コピー生成に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Claude APIでコピーを生成
 */
async function generateWithClaude(prompt: string): Promise<unknown> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: LP_GENERATION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // レスポンスからテキストを抽出
  const textContent = message.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in response');
  }

  // JSONを抽出してパース
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * フルLP生成（すべてのセクションを並列生成）
 */
async function generateFullLP(config: TaiyoStyleConfig): Promise<NextResponse> {
  try {
    // 並列で全セクションを生成
    const [headline, body, bullets, cta, ps] = await Promise.all([
      generateWithClaude(generateHeadlinePrompt(config)) as Promise<HeadlineResult>,
      generateWithClaude(generateBodyPrompt(config)) as Promise<BodyResult>,
      generateWithClaude(generateBulletPrompt(config)) as Promise<BulletResult>,
      generateWithClaude(generateCTAPrompt(config)) as Promise<CTAResult>,
      generateWithClaude(generatePSPrompt(config)) as Promise<PSResult>,
    ]);

    const fullResult: FullLPResult = {
      headline,
      body,
      bullets,
      cta,
      ps,
    };

    return NextResponse.json({
      success: true,
      type: 'full',
      result: fullResult,
    });
  } catch (error) {
    throw error;
  }
}
