import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  Tag,
  Edit,
  Trash2,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 仮のデータ（後でServer Actionから取得）
async function getContactData(id: string) {
  // TODO: 実際のデータ取得
  const sampleContact = {
    id,
    name: "田中 太郎",
    email: "tanaka@example.com",
    lineUserId: "U1234567890",
    phone: "090-1234-5678",
    score: 85,
    note: "VIPのお客様。セミナーに積極的に参加。",
    tags: [
      { id: "1", name: "購入者", color: "#22c55e" },
      { id: "2", name: "VIP", color: "#eab308" },
    ],
    createdAt: "2025-01-15",
    activities: [
      {
        id: "1",
        type: "email_opened",
        description: "メール「新商品のご案内」を開封しました",
        createdAt: "2025-01-30 14:30",
      },
      {
        id: "2",
        type: "page_view",
        description: "商品ページを閲覧しました",
        createdAt: "2025-01-29 10:15",
      },
      {
        id: "3",
        type: "purchase",
        description: "「オンラインコース基礎編」を購入しました",
        createdAt: "2025-01-20 09:00",
      },
      {
        id: "4",
        type: "signup",
        description: "リストに登録しました",
        createdAt: "2025-01-15 15:00",
      },
    ],
    customFields: {
      company: "株式会社ABC",
      position: "マーケティング部長",
      source: "セミナー参加",
    },
  };

  return sampleContact;
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContactData(id);

  if (!contact) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/contacts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {contact.name?.slice(0, 2) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {contact.name || "名前なし"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {contact.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.color, color: "#fff" }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>
          <Button variant="outline" className="text-red-600 hover:text-red-700">
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 基本情報 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>連絡先情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">メール</p>
                    <p className="font-medium">{contact.email}</p>
                  </div>
                </div>
              )}
              {contact.lineUserId && (
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">LINE ID</p>
                    <p className="font-medium">{contact.lineUserId}</p>
                  </div>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">電話番号</p>
                    <p className="font-medium">{contact.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">登録日</p>
                  <p className="font-medium">{contact.createdAt}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>カスタムフィールド</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(contact.customFields).map(([key, value]) => (
                <div key={key}>
                  <p className="text-sm text-muted-foreground capitalize">
                    {key === "company"
                      ? "会社名"
                      : key === "position"
                      ? "役職"
                      : key === "source"
                      ? "流入元"
                      : key}
                  </p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>タグ</CardTitle>
              <Button variant="outline" size="sm">
                <Tag className="mr-2 h-4 w-4" />
                タグ追加
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="cursor-pointer"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.name}
                    <span className="ml-1 hover:text-red-500">×</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* メインコンテンツ */}
        <div className="md:col-span-2 space-y-6">
          {/* クイックアクション */}
          <Card>
            <CardContent className="flex items-center gap-2 py-4">
              <Button>
                <Send className="mr-2 h-4 w-4" />
                LINEを送る
              </Button>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                メールを送る
              </Button>
              <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                チャットを開く
              </Button>
            </CardContent>
          </Card>

          {/* タブコンテンツ */}
          <Tabs defaultValue="activity" className="w-full">
            <TabsList>
              <TabsTrigger value="activity">アクティビティ</TabsTrigger>
              <TabsTrigger value="campaigns">配信履歴</TabsTrigger>
              <TabsTrigger value="orders">購入履歴</TabsTrigger>
              <TabsTrigger value="notes">メモ</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>アクティビティ</CardTitle>
                  <CardDescription>
                    このコンタクトの行動履歴
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contact.activities.map((activity, index) => (
                      <div key={activity.id}>
                        <div className="flex items-start gap-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {activity.type === "email_opened" && (
                              <Mail className="h-4 w-4" />
                            )}
                            {activity.type === "page_view" && (
                              <Calendar className="h-4 w-4" />
                            )}
                            {activity.type === "purchase" && (
                              <Tag className="h-4 w-4" />
                            )}
                            {activity.type === "signup" && (
                              <Calendar className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.createdAt}
                            </p>
                          </div>
                        </div>
                        {index < contact.activities.length - 1 && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="campaigns" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>配信履歴</CardTitle>
                  <CardDescription>
                    送信されたキャンペーンの履歴
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    配信履歴はまだありません
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="orders" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>購入履歴</CardTitle>
                  <CardDescription>
                    購入した商品やサービス
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    購入履歴はまだありません
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>メモ</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {contact.note || "メモはありません"}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
