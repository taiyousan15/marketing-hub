import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Send,
  TrendingUp,
  Mail,
  Plus,
  Layers,
  ShoppingCart,
  Calendar,
} from "lucide-react";
import Link from "next/link";

const stats = [
  {
    title: "コンタクト数",
    value: "0",
    change: "+0%",
    icon: Users,
  },
  {
    title: "アクティブ配信",
    value: "0",
    change: "+0",
    icon: Send,
  },
  {
    title: "今月の売上",
    value: "¥0",
    change: "+0%",
    icon: TrendingUp,
  },
  {
    title: "開封率",
    value: "0%",
    change: "+0%",
    icon: Mail,
  },
];

const quickActions = [
  {
    title: "新規配信",
    icon: Send,
    href: "/campaigns/new",
  },
  {
    title: "LP作成",
    icon: Layers,
    href: "/funnels/new",
  },
  {
    title: "商品登録",
    icon: ShoppingCart,
    href: "/products/new",
  },
  {
    title: "イベント作成",
    icon: Calendar,
    href: "/events/new",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">
          マーケティング活動の概要を確認できます
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                前月比 {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Activity Feed */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>最近のアクティビティ</CardTitle>
            <CardDescription>
              顧客の行動やシステムイベントを表示します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              まだアクティビティがありません
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>
              よく使う機能にすぐアクセスできます
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="justify-start"
                asChild
              >
                <Link href={action.href}>
                  <Plus className="mr-2 h-4 w-4" />
                  {action.title}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>はじめに</CardTitle>
          <CardDescription>
            MarketingHubを最大限に活用するためのステップ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">LINE連携を設定</h3>
                <p className="text-sm text-muted-foreground">
                  LINE公式アカウントを接続して、LINE配信を有効にします
                </p>
                <Button variant="link" className="px-0" asChild>
                  <Link href="/settings/line">設定する →</Link>
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">決済を設定</h3>
                <p className="text-sm text-muted-foreground">
                  Stripeを接続して、オンライン決済を受け付けます
                </p>
                <Button variant="link" className="px-0" asChild>
                  <Link href="/settings/payments">設定する →</Link>
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">最初のファネルを作成</h3>
                <p className="text-sm text-muted-foreground">
                  テンプレートから簡単にLPを作成できます
                </p>
                <Button variant="link" className="px-0" asChild>
                  <Link href="/funnels/new">作成する →</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
