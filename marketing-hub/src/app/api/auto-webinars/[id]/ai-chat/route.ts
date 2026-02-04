import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

/**
 * AIチャット生成API
 * ウェビナーの内容に基づいてリアルなチャットメッセージを自動生成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();

    if (!userInfo?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      messageCount = 20,
      messageTypes = ["COMMENT", "QUESTION", "REACTION", "TESTIMONIAL"],
      topic = "このウェビナー",
      tone = "friendly", // friendly, professional, enthusiastic
    } = body;

    // ウェビナー情報を取得
    const webinar = await prisma.automatedWebinar.findUnique({
      where: {
        id: id,
        tenantId: userInfo.tenantId,
      },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    // AIチャットメッセージを生成
    const messages = await generateChatMessages({
      webinarTitle: webinar.title,
      videoDuration: webinar.videoDuration,
      messageCount,
      messageTypes,
      topic,
      tone,
    });

    // データベースに保存
    const createdMessages = await prisma.autoWebinarChatMessage.createMany({
      data: messages.map((msg, index) => ({
        webinarId: webinar.id,
        appearAtSeconds: msg.appearAtSeconds,
        senderName: msg.senderName,
        senderAvatar: msg.senderAvatar || null,
        content: msg.content,
        messageType: msg.messageType,
        order: index,
      })),
    });

    return NextResponse.json({
      success: true,
      messagesCreated: createdMessages.count,
      messages,
    });
  } catch (error) {
    console.error("Failed to generate AI chat:", error);
    return NextResponse.json(
      { error: "Failed to generate AI chat" },
      { status: 500 }
    );
  }
}

/**
 * チャットメッセージ生成ロジック
 */
async function generateChatMessages({
  webinarTitle,
  videoDuration,
  messageCount,
  messageTypes,
  topic,
  tone,
}: {
  webinarTitle: string;
  videoDuration: number;
  messageCount: number;
  messageTypes: string[];
  topic: string;
  tone: string;
}) {
  const messages = [];

  // 日本人らしい名前のリスト
  const names = [
    "田中太郎",
    "佐藤花子",
    "鈴木一郎",
    "高橋美咲",
    "伊藤健太",
    "渡辺さくら",
    "山本大輔",
    "中村結衣",
    "小林翔太",
    "加藤愛",
    "吉田拓海",
    "山田優",
    "佐々木蓮",
    "松本陽菜",
    "井上颯太",
    "木村葵",
    "林大和",
    "清水心春",
    "山崎湊",
    "池田さつき",
  ];

  // メッセージテンプレート
  const templates = {
    COMMENT: {
      friendly: [
        "すごくわかりやすい説明ですね！",
        "なるほど、そういうことだったんですね",
        "勉強になります",
        "参加してよかったです！",
        "ありがとうございます",
        "メモ取らせていただきます",
        "これは実践してみたいです",
        "面白い内容ですね",
        "とても参考になります",
        "もっと早く知りたかった",
      ],
      professional: [
        "貴重な情報をありがとうございます",
        "非常に有益な内容です",
        "実務に活かせそうです",
        "具体的な事例が参考になります",
        "データに基づいた説明で理解しやすいです",
        "実践的なアプローチですね",
        "明日から取り入れたいと思います",
      ],
      enthusiastic: [
        "これは素晴らしい！",
        "目から鱗です！",
        "めちゃくちゃ役立つ情報ですね！",
        "やる気が出てきました！",
        "すぐに試してみます！",
        "感動しました！",
        "もっと聞きたいです！",
      ],
    },
    QUESTION: [
      "質問です。初心者でも大丈夫でしょうか？",
      "これはどのくらいの期間で効果が出ますか？",
      "具体的な手順を教えていただけますか？",
      "コストはどのくらいかかりますか？",
      "サポートはありますか？",
      "他のサービスとの違いは何ですか？",
      "どんな方におすすめですか？",
      "質問してもいいですか？",
    ],
    REACTION: [
      "👍",
      "いいね！",
      "わかる〜",
      "それな",
      "確かに",
      "その通りですね",
      "同感です",
      "激しく同意",
    ],
    TESTIMONIAL: [
      "前回のセミナーも参加しましたが、今回も最高です！",
      "実際にやってみたら結果が出ました！",
      "このウェビナーに出会えて人生変わりました",
      "友人にも勧めたいです",
      "以前受講した内容を実践して成果が出ています",
      "毎回学びが多くて感謝しています",
    ],
  };

  // メッセージを生成
  for (let i = 0; i < messageCount; i++) {
    // ランダムな出現時刻（均等分散）
    const appearAtSeconds = Math.floor((videoDuration / messageCount) * i) +
      Math.floor(Math.random() * 30);

    // ランダムな名前
    const senderName = names[Math.floor(Math.random() * names.length)];

    // ランダムなメッセージタイプ
    const messageType =
      messageTypes[Math.floor(Math.random() * messageTypes.length)] as
        | "COMMENT"
        | "QUESTION"
        | "REACTION"
        | "TESTIMONIAL";

    // メッセージ内容の選択
    let content: string;
    if (messageType === "COMMENT") {
      const toneTemplates =
        templates.COMMENT[tone as keyof typeof templates.COMMENT] ||
        templates.COMMENT.friendly;
      content = toneTemplates[Math.floor(Math.random() * toneTemplates.length)];
    } else {
      const typeTemplates = templates[messageType];
      content = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
    }

    messages.push({
      appearAtSeconds,
      senderName,
      senderAvatar: null,
      content,
      messageType,
    });
  }

  // 出現時刻順にソート
  messages.sort((a, b) => a.appearAtSeconds - b.appearAtSeconds);

  return messages;
}

/**
 * 既存のAIチャットメッセージを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();

    if (!userInfo?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ウェビナーの所有権確認
    const webinar = await prisma.automatedWebinar.findUnique({
      where: {
        id: id,
        tenantId: userInfo.tenantId,
      },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    // すべてのチャットメッセージを削除
    const deleted = await prisma.autoWebinarChatMessage.deleteMany({
      where: {
        webinarId: id,
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleted.count,
    });
  } catch (error) {
    console.error("Failed to delete AI chat messages:", error);
    return NextResponse.json(
      { error: "Failed to delete AI chat messages" },
      { status: 500 }
    );
  }
}

/**
 * 既存のAIチャットメッセージを取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();

    if (!userInfo?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // チャットメッセージを取得
    const messages = await prisma.autoWebinarChatMessage.findMany({
      where: {
        webinarId: id,
        webinar: {
          tenantId: userInfo.tenantId,
        },
      },
      orderBy: {
        appearAtSeconds: "asc",
      },
    });

    return NextResponse.json({
      messages,
      total: messages.length,
    });
  } catch (error) {
    console.error("Failed to fetch AI chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI chat messages" },
      { status: 500 }
    );
  }
}
