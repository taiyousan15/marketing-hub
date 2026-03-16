import { prisma } from "@/lib/db/prisma";
import { Radio } from "lucide-react";
import { Countdown } from "@/components/livestream/viewer/countdown";
import { ViewerRoom, type PublicLiveStream } from "@/components/livestream/viewer/viewer-room";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ contactId?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const livestream = await prisma.liveStream.findFirst({
    where: { eventId },
    select: { name: true, description: true },
  });

  return {
    title: livestream?.name ?? "ライブ配信",
    description: livestream?.description ?? undefined,
  };
}

export default async function LiveViewerPage({
  params,
  searchParams,
}: PageProps) {
  const { eventId } = await params;
  const { contactId } = await searchParams;

  const livestream = await prisma.liveStream.findFirst({
    where: { eventId },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      startAt: true,
      chatEnabled: true,
      timedOffers: true,
    },
  });

  // 配信が見つからない場合
  if (!livestream) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <Radio className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h1 className="text-xl font-bold mb-2">配信が見つかりません</h1>
          <p className="text-gray-400 text-sm">
            このライブ配信は存在しないか、まだ設定されていません
          </p>
        </div>
      </div>
    );
  }

  // 配信開始前: カウントダウン表示
  if (livestream.status === "SCHEDULED") {
    return (
      <Countdown
        startAt={livestream.startAt.toISOString()}
        title={livestream.name}
        description={livestream.description ?? undefined}
      />
    );
  }

  // 配信終了 / キャンセル
  if (
    livestream.status === "COMPLETED" ||
    livestream.status === "CANCELED"
  ) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <Radio className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h1 className="text-xl font-bold mb-2">
            {livestream.status === "CANCELED" ? "配信はキャンセルされました" : "配信終了"}
          </h1>
          <p className="text-gray-400 text-sm">
            {livestream.status === "CANCELED"
              ? "このライブ配信はキャンセルされました"
              : "このライブ配信は終了しました。ご視聴ありがとうございました。"}
          </p>
        </div>
      </div>
    );
  }

  // LIVE: ビデオ + チャット表示
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* ヘッダー */}
      <header className="border-b border-gray-800 px-4 py-3 shrink-0">
        <div className="max-w-full flex items-center gap-3">
          <Badge />
          <h1 className="font-bold text-white truncate">{livestream.name}</h1>
        </div>
      </header>

      <ViewerRoom
        eventId={eventId}
        livestream={{
          id: livestream.id,
          name: livestream.name,
          description: livestream.description,
          status: livestream.status,
          startAt: livestream.startAt.toISOString(),
          chatEnabled: livestream.chatEnabled,
          timedOffers: Array.isArray(livestream.timedOffers)
            ? (livestream.timedOffers as unknown as PublicLiveStream["timedOffers"])
            : [],
        }}
        contactId={contactId}
      />
    </div>
  );
}

function Badge() {
  return (
    <span className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">
      <Radio className="w-3 h-3" />
      LIVE
    </span>
  );
}
