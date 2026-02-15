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
import { getContact } from "@/actions/contacts";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContact(id);

  if (!contact) {
    notFound();
  }

  // カスタムフィールドをオブジェクトに変換
  const customFields = (contact.customFields || {}) as Record<string, string>;

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
                  <p className="font-medium">
                    {new Date(contact.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.keys(customFields).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>カスタムフィールド</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(customFields).map(([key, value]) => (
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
          )}

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
                {contact.tags.length > 0 ? (
                  contact.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="cursor-pointer"
                      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                    >
                      {tag.name}
                      <span className="ml-1 hover:text-red-500">×</span>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">タグなし</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>スコア情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">総合スコア</span>
                <span className="font-bold text-lg">{contact.score}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    contact.score >= 70
                      ? "bg-green-500"
                      : contact.score >= 40
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                  }`}
                  style={{ width: `${Math.min(contact.score, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {contact.score >= 70
                  ? "高スコア - 購買意欲が高いリードです"
                  : contact.score >= 40
                  ? "中スコア - フォローアップ推奨"
                  : "低スコア - ナーチャリング段階"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* メインコンテンツ */}
        <div className="md:col-span-2 space-y-6">
          {/* クイックアクション */}
          <Card>
            <CardContent className="flex items-center gap-2 py-4">
              <Button disabled={!contact.lineUserId}>
                <Send className="mr-2 h-4 w-4" />
                LINEを送る
              </Button>
              <Button variant="outline" disabled={!contact.email}>
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
                  {contact.messageHistories && contact.messageHistories.length > 0 ? (
                    <div className="space-y-4">
                      {contact.messageHistories.map((history, index) => (
                        <div key={history.id}>
                          <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              {history.channel === "LINE" && (
                                <MessageSquare className="h-4 w-4 text-green-500" />
                              )}
                              {history.channel === "EMAIL" && (
                                <Mail className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">
                                {history.direction === "OUTBOUND"
                                  ? `${history.channel}メッセージを送信`
                                  : `${history.channel}メッセージを受信`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(history.createdAt).toLocaleString("ja-JP")}
                              </p>
                            </div>
                          </div>
                          {index < contact.messageHistories.length - 1 && (
                            <Separator className="my-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                      アクティビティはまだありません
                    </div>
                  )}
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
                    {contact.source || "メモはありません"}
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
