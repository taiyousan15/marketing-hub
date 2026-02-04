/**
 * AIチャット API
 * POST /api/ai/chat - チャット応答
 * POST /api/ai/chat?stream=true - ストリーミング応答
 */

import { NextRequest, NextResponse } from 'next/server';
import { createChatbot, ChatbotConfig } from '@/lib/ai/chatbot';
import { AIMessage } from '@/lib/ai/provider';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      conversationHistory = [],
      config = {},
    } = body as {
      message: string;
      conversationHistory?: AIMessage[];
      config?: Partial<ChatbotConfig>;
    };

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // ストリーミングモードかチェック
    const stream = request.nextUrl.searchParams.get('stream') === 'true';

    const chatbot = createChatbot({
      mode: config.mode || 'support',
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      customPrompt: config.customPrompt,
      handoffKeywords: config.handoffKeywords,
      faqData: config.faqData,
    });

    if (stream) {
      // ストリーミング応答
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of chatbot.respondStream(message, conversationHistory)) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Stream error:', error);
            controller.error(error);
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 通常応答
    const response = await chatbot.respond(message, conversationHistory);

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
