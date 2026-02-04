import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { WebinarPlayer } from "@/components/auto-webinar/viewer/webinar-player";
import { ChatSimulation } from "@/components/auto-webinar/viewer/chat-simulation";
import { ParticipantCounter } from "@/components/auto-webinar/viewer/participant-counter";
import { TimedOffersContainer } from "@/components/auto-webinar/viewer/timed-offer-popup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";

interface PreviewPageProps {
  params: {
    id: string;
  };
  searchParams: {
    position?: string; // 再生位置（秒）
  };
}

export default async function AutoWebinarPreviewPage({
  params,
  searchParams,
}: PreviewPageProps) {
  const userInfo = await getCurrentUser();

  if (!userInfo?.tenantId) {
    redirect("/login");
  }

  // ウェビナー情報を取得
  const webinar = await prisma.automatedWebinar.findUnique({
    where: {
      id: params.id,
      tenantId: userInfo.tenantId,
    },
    include: {
      chatMessages: {
        orderBy: { appearAtSeconds: "asc" },
      },
      timedOffers: {
        orderBy: { appearAtSeconds: "asc" },
      },
    },
  });

  if (!webinar) {
    redirect("/auto-webinar");
  }

  // 再生位置（デフォルト: 0秒）
  const currentPosition = searchParams.position ? parseInt(searchParams.position) : 0;

  // チャットメッセージの整形
  const chatMessages = webinar.chatMessages.map((msg) => ({
    id: msg.id,
    appearAtSeconds: msg.appearAtSeconds,
    senderName: msg.senderName,
    senderAvatar: msg.senderAvatar || undefined,
    content: msg.content,
    messageType: msg.messageType,
    reactions: {
      likes: Math.floor(Math.random() * 20), // デモ用のランダムリアクション
      hearts: Math.floor(Math.random() * 15),
    },
  }));

  // オファーの整形
  const offers = webinar.timedOffers.map((offer) => ({
    id: offer.id,
    appearAtSeconds: offer.appearAtSeconds,
    hideAtSeconds: offer.hideAtSeconds,
    title: offer.title,
    description: offer.description,
    buttonText: offer.buttonText,
    buttonUrl: offer.buttonUrl,
    countdownEnabled: offer.countdownEnabled,
    countdownSeconds: offer.countdownSeconds,
    limitedSeats: offer.limitedSeats,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* ヘッダー */}
      <div className="border-b border-white/10 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/auto-webinar/${webinar.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  戻る
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white">{webinar.title}</h1>
                  <Badge variant="secondary" className="gap-1">
                    <Eye className="w-3 h-3" />
                    プレビュー
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  実際の視聴者が見る画面をプレビューしています
                </p>
              </div>
            </div>

            {/* 参加者カウンター（プレビュー） */}
            {webinar.fakeAttendeesEnabled && (
              <ParticipantCounter
                min={webinar.fakeAttendeesMin}
                max={webinar.fakeAttendeesMax}
                progress={currentPosition / webinar.videoDuration}
              />
            )}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 動画プレイヤー */}
          <div className="lg:col-span-2">
            <WebinarPlayer
              videoUrl={webinar.videoUrl}
              videoType={webinar.videoType}
              videoDuration={webinar.videoDuration}
              currentPosition={currentPosition}
              isLive={false}
              isReplay={true}
              onPositionUpdate={(position) => {
                // プレビューモードでは位置を保存しない
                console.log("Position:", position);
              }}
            />

            {/* プレビュー情報 */}
            <Card className="mt-4 bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-500 mb-1">
                      プレビューモード
                    </h3>
                    <p className="text-sm text-slate-300">
                      このページは管理者専用のプレビューです。実際の視聴者には公開URLから別の画面が表示されます。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* チャットシミュレーション */}
            {webinar.simulatedChatEnabled && chatMessages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">チャットシミュレーション</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ChatSimulation
                    messages={chatMessages}
                    currentPosition={currentPosition}
                    className="h-[400px]"
                  />
                </CardContent>
              </Card>
            )}

            {/* オファー情報 */}
            {offers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">時限オファー</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {offers.map((offer, index) => (
                      <div
                        key={offer.id}
                        className="p-3 border rounded-lg space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            オファー {index + 1}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {offer.appearAtSeconds}秒
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {offer.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ウェビナー設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">スケジュールタイプ</span>
                  <span className="font-medium">
                    {webinar.scheduleType === "JUST_IN_TIME" && "登録後開始"}
                    {webinar.scheduleType === "RECURRING" && "定期開催"}
                    {webinar.scheduleType === "SPECIFIC_DATES" && "特定日時"}
                    {webinar.scheduleType === "ON_DEMAND" && "オンデマンド"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">参加者シミュレーション</span>
                  <span className="font-medium">
                    {webinar.fakeAttendeesEnabled ? "有効" : "無効"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">チャット</span>
                  <span className="font-medium">
                    {webinar.simulatedChatEnabled ? "シミュレーション" : "無効"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">リプレイ</span>
                  <span className="font-medium">
                    {webinar.replayEnabled ? "有効" : "無効"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* タイムドオファー（実際の表示） */}
      <TimedOffersContainer
        offers={offers}
        currentPosition={currentPosition}
        videoDuration={webinar.videoDuration}
        onOfferClick={(offerId) => {
          console.log("Offer clicked (preview mode):", offerId);
        }}
      />
    </div>
  );
}
