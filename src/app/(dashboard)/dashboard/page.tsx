"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Send,
  TrendingUp,
  TrendingDown,
  Mail,
  Plus,
  Layers,
  ShoppingCart,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DashboardStats {
  totalContacts: number;
  contactChange: number;
  activeCampaigns: number;
  thisMonthRevenue: number;
  revenueChange: number;
  openRate: number;
  openRateChange: number;
  thisMonthOrders: number;
}

interface ActivityItem {
  id: string;
  type: string;
  direction: string;
  status: string;
  contactName: string;
  createdAt: string;
}

interface DailyStats {
  date: string;
  contacts: number;
  messages: number;
  revenue: number;
}

const quickActions = [
  { title: "新規配信", icon: Send, href: "/campaigns/new" },
  { title: "LP作成", icon: Layers, href: "/funnels/new" },
  { title: "商品登録", icon: ShoppingCart, href: "/products/new" },
  { title: "イベント作成", icon: Calendar, href: "/events/new" },
];

export default function DashboardPage() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId) {
      fetchDashboardData();
    }
  }, [tenantId]);

  const fetchDashboardData = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?tenantId=${tenantId}`);
      const data = await res.json();
      setStats(data.stats);
      setActivity(data.recentActivity || []);
      setDailyStats(data.dailyStats || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatActivityTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}分前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前`;
    return `${Math.floor(hours / 24)}日前`;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      sent: "送信済み",
      delivered: "配信済み",
      opened: "開封",
      clicked: "クリック",
      pending: "送信中",
      failed: "失敗",
    };
    return labels[status] || status;
  };

  const getChannelLabel = (type: string) => {
    return type === "line" ? "LINE" : type === "email" ? "メール" : type.toUpperCase();
  };

  if (tenantLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const statCards = [
    {
      title: "コンタクト数",
      value: stats?.totalContacts?.toLocaleString() || "0",
      change: stats?.contactChange || 0,
      icon: Users,
    },
    {
      title: "アクティブ配信",
      value: stats?.activeCampaigns?.toString() || "0",
      change: 0,
      icon: Send,
      hideChange: true,
    },
    {
      title: "今月の売上",
      value: formatCurrency(stats?.thisMonthRevenue || 0),
      change: stats?.revenueChange || 0,
      icon: TrendingUp,
    },
    {
      title: "開封率",
      value: `${stats?.openRate || 0}%`,
      change: stats?.openRateChange || 0,
      icon: Mail,
    },
  ];

  // 過去7日間のデータを抽出
  const last7Days = dailyStats.slice(-7);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground">
            マーケティング活動の概要を確認できます
          </p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          更新
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {!stat.hideChange && (
                <p className="text-xs text-muted-foreground flex items-center">
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={stat.change >= 0 ? "text-green-500" : "text-red-500"}>
                    {stat.change >= 0 ? "+" : ""}
                    {stat.change}%
                  </span>
                  <span className="ml-1">前月比</span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* コンタクト推移 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">新規コンタクト推移</CardTitle>
            <CardDescription>過去7日間の新規登録数</CardDescription>
          </CardHeader>
          <CardContent>
            {last7Days.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    fontSize={12}
                    stroke="#888"
                  />
                  <YAxis fontSize={12} stroke="#888" />
                  <Tooltip
                    formatter={(value) => [`${value}人`, "新規コンタクト"]}
                    labelFormatter={(label) => `日付: ${formatDate(String(label))}`}
                  />
                  <Bar dataKey="contacts" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>

        {/* 売上推移 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">売上推移</CardTitle>
            <CardDescription>過去7日間の日別売上</CardDescription>
          </CardHeader>
          <CardContent>
            {last7Days.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    fontSize={12}
                    stroke="#888"
                  />
                  <YAxis
                    fontSize={12}
                    stroke="#888"
                    tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "売上"]}
                    labelFormatter={(label) => `日付: ${formatDate(String(label))}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: "#22c55e", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Activity Feed */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>最近のアクティビティ</CardTitle>
            <CardDescription>
              メッセージの送受信履歴
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length > 0 ? (
              <div className="space-y-3">
                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                      ${item.type === "line" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}
                    `}>
                      {getChannelLabel(item.type).slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.contactName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getChannelLabel(item.type)} - {getStatusLabel(item.status)}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatActivityTime(item.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                まだアクティビティがありません
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>
              よく使う機能にすぐアクセス
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
