import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getAIClient } from '@/lib/ai/provider';

const LP_SYSTEM_PROMPT = `あなたはLPビルダーのAIアシスタントです。ランディングページの改善を専門としています。

## 役割
- LP（ランディングページ）のコピーライティング改善
- デザイン・レイアウトの最適化提案
- CTA（Call to Action）の最適化
- コンバージョン率向上のための提案
- コンテンツ構成の見直し

## 使用可能なフレームワーク
- PASBECONA（Problem→Affinity→Solution→Benefit→Evidence→Contents→Offer→Narrow→Action）
- QUEST（Qualify→Understand→Educate→Stimulate→Transition）
- Russell Brunson "The Stack"（価値積み上げ→価格提示）

## 応答ルール
- 日本語で回答する
- 具体的で実用的なアドバイスを提供する
- 変更を提案する際は、なぜそうするべきかの理由も説明する
- マーケティング心理学（Cialdini 7原則等）に基づいた提案をする
- 回答は簡潔に、要点をまとめて答える
- 見出し・箇条書きを使って読みやすくフォーマットする
- 改善前→改善後の比較を示す
- ツールは使わず、必ずテキストで回答する`;

/**
 * UIMessage[] からシンプルな { role, content } 配列に変換
 */
function extractSimpleMessages(
  rawMessages: unknown
): Array<{ role: string; content: string }> {
  if (!Array.isArray(rawMessages)) return [];

  return rawMessages
    .filter(
      (msg): msg is { role: string; parts?: Array<{ type: string; text?: string }>; content?: string } =>
        msg != null && typeof msg === 'object' && 'role' in msg
    )
    .map((msg) => {
      // UIMessage format (parts-based)
      if (Array.isArray(msg.parts)) {
        const text = msg.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
          .map((p) => p.text)
          .join('');
        return { role: msg.role === 'user' ? 'user' : 'assistant', content: text };
      }
      // Legacy format (content-based)
      if (typeof msg.content === 'string') {
        return { role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content };
      }
      return { role: msg.role === 'user' ? 'user' : 'assistant', content: '' };
    })
    .filter((msg) => msg.content.length > 0);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: { messages: unknown; components: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'リクエストの解析に失敗しました' },
      { status: 400 },
    );
  }

  const { messages: rawMessages, components } = body;

  const componentsContext = components
    ? `\n\n## 現在のLPコンポーネント構成\n${JSON.stringify(components, null, 2)}`
    : '';

  const systemPrompt = LP_SYSTEM_PROMPT + componentsContext;
  const simpleMessages = extractSimpleMessages(rawMessages);

  try {
    const client = await getAIClient();
    const stream = client.completeStream(
      [
        { role: 'system', content: systemPrompt },
        ...simpleMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      { temperature: 0.7, maxTokens: 2048 }
    );

    // AsyncGenerator → ReadableStream 変換
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : '不明なエラー';
          controller.enqueue(encoder.encode(`\n\nエラー: ${msg}`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json(
      { error: `AIアシスタントでエラーが発生しました: ${message}` },
      { status: 500 },
    );
  }
}
