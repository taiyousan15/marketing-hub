"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface SMSAnalytics {
  summary: {
    totalSent: number;
    delivered: number;
    failed: number;
    pending: number;
    deliveryRate: number;
    totalSegments: number;
    estimatedCost: number;
  };
  dailyStats: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
    cost: number;
  }>;
  channelStats: {
    EMAIL: { sent: number; delivered: number; opened: number; clicked: number };
    SMS: { sent: number; delivered: number; opened: number; clicked: number };
    LINE: { sent: number; delivered: number; opened: number; clicked: number };
  };
  hourlyStats: Array<{ hour: number; count: number }>;
  statusBreakdown: {
    QUEUED: number;
    SENDING: number;
    SENT: number;
    DELIVERED: number;
    FAILED: number;
    UNDELIVERED: number;
  };
  period: string;
}

const COLORS = {
  EMAIL: "#6366f1",
  SMS: "#22c55e",
  LINE: "#06b6d4",
};

const STATUS_COLORS = {
  DELIVERED: "#22c55e",
  SENT: "#84cc16",
  QUEUED: "#f59e0b",
  SENDING: "#3b82f6",
  FAILED: "#ef4444",
  UNDELIVERED: "#f87171",
};

export default function SMSAnalyticsPage() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [analytics, setAnalytics] = useState<SMSAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    if (tenantId) {
      fetchAnalytics();
    }
  }, [tenantId, period]);

  const fetchAnalytics = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics/sms?tenantId=${tenantId}&period=${period}`
      );
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch SMS analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
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
      title: "SMS送信数",
      value: analytics?.summary.totalSent?.toLocaleString() || "0",
      subValue: `${analytics?.summary.totalSegments || 0}セグメント`,
      icon: Send,
      color: "text-blue-500",
    },
    {
      title: "配信成功",
      value: analytics?.summary.delivered?.toLocaleString() || "0",
      subValue: `${analytics?.summary.deliveryRate || 0}%配信率`,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "配信失敗",
      value: analytics?.summary.failed?.toLocaleString() || "0",
      subValue: `${
        analytics?.summary.totalSent
          ? Math.round(
              (analytics.summary.failed / analytics.summary.totalSent) * 100
            )
          : 0
      }%失敗率`,
      icon: XCircle,
      color: "text-red-500",
    },
    {
      title: "推定コスト",
      value: formatCurrency(analytics?.summary.estimatedCost || 0),
      subValue: `約¥${
        analytics?.summary.totalSent
          ? Math.round(
              analytics.summary.estimatedCost / analytics.summary.totalSent
            )
          : 0
      }/通`,
      icon: DollarSign,
      color: "text-orange-500",
    },
  ];

  // チャンネル比較データ
  const channelCompareData = analytics
    ? [
        {
          name: "メール",
          送信数: analytics.channelStats.EMAIL.sent,
          配信成功: analytics.channelStats.EMAIL.delivered,
          開封: analytics.channelStats.EMAIL.opened,
        },
        {
          name: "SMS",
          送信数: analytics.channelStats.SMS.sent,
          配信成功: analytics.channelStats.SMS.delivered,
          開封: analytics.channelStats.SMS.opened,
        },
        {
          name: "LINE",
          送信数: analytics.channelStats.LINE.sent,
          配信成功: analytics.channelStats.LINE.delivered,
          開封: analytics.channelStats.LINE.opened,
        },
      ]
    : [];

  // ステータス内訳データ
  const statusPieData = analytics
    ? Object.entries(analytics.statusBreakdown)
        .filter(([, value]) => value > 0)
        .map(([name, value]) => ({
          name,
          value,
          color: STATUS_COLORS[name as keyof typeof STATUS_COLORS],
        }))
    : [];

  // 時間帯別データ（送信可能時間9-20時を強調）
  const hourlyData = analytics?.hourlyStats || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            SMS分析
          </h1>
          <p className="text-muted-foreground">
            SMS配信のパフォーマンスを分析します
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="期間を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">過去7日間</SelectItem>
              <SelectItem value="30d">過去30日間</SelectItem>
              <SelectItem value="90d">過去90日間</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            更新
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.subValue}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 日別送信数 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              日別SMS送信数
            </CardTitle>
            <CardDescription>配信成功と失敗の推移</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.dailyStats && analytics.dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    fontSize={12}
                    stroke="#888"
                  />
                  <YAxis fontSize={12} stroke="#888" />
                  <Tooltip
                    formatter={(value, name) => [
                      value,
                      name === "delivered" ? "配信成功" : "配信失敗",
                    ]}
                    labelFormatter={(label) => `日付: ${formatDate(String(label))}`}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "delivered" ? "配信成功" : "配信失敗"
                    }
                  />
                  <Bar
                    dataKey="delivered"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    stackId="a"
                  />
                  <Bar
                    dataKey="failed"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>

        {/* コスト推移 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              日別コスト推移
            </CardTitle>
            <CardDescription>SMS配信の推定コスト</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.dailyStats && analytics.dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.dailyStats}>
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
                    tickFormatter={(value) => `¥${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "コスト"]}
                    labelFormatter={(label) => `日付: ${formatDate(String(label))}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* チャンネル比較 */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              チャンネル比較
            </CardTitle>
            <CardDescription>EMAIL・SMS・LINEのパフォーマンス比較</CardDescription>
          </CardHeader>
          <CardContent>
            {channelCompareData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={channelCompareData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" fontSize={12} stroke="#888" />
                  <YAxis dataKey="name" type="category" fontSize={12} stroke="#888" width={50} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="送信数" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="配信成功" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="開封" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>

        {/* ステータス内訳 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              ステータス内訳
            </CardTitle>
            <CardDescription>SMSステータスの分布</CardDescription>
          </CardHeader>
          <CardContent>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}件`, "件数"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 時間帯別分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            時間帯別SMS送信数
          </CardTitle>
          <CardDescription>
            推奨送信時間帯（9:00〜20:00）を緑で表示
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="hour"
                  fontSize={12}
                  stroke="#888"
                  tickFormatter={(h) => `${h}時`}
                />
                <YAxis fontSize={12} stroke="#888" />
                <Tooltip
                  formatter={(value) => [`${value}件`, "送信数"]}
                  labelFormatter={(label) => `${label}:00`}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  fill="#94a3b8"
                >
                  {hourlyData.map((entry) => (
                    <Cell
                      key={`cell-${entry.hour}`}
                      fill={
                        entry.hour >= 9 && entry.hour <= 20
                          ? "#22c55e"
                          : "#94a3b8"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              データがありません
            </div>
          )}
        </CardContent>
      </Card>

      {/* パフォーマンス指標 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">配信成功率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-green-500">
                {analytics?.summary.deliveryRate || 0}%
              </div>
              <div className="flex items-center text-xs text-green-500">
                <ArrowUpRight className="h-3 w-3" />
                良好
              </div>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${analytics?.summary.deliveryRate || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">平均セグメント数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">
                {analytics?.summary.totalSent
                  ? (
                      analytics.summary.totalSegments / analytics.summary.totalSent
                    ).toFixed(1)
                  : "0"}
              </div>
              <div className="text-xs text-muted-foreground">セグメント/通</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              70文字超で追加セグメント（日本語SMS）
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">1通あたりコスト</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-orange-500">
                ¥
                {analytics?.summary.totalSent
                  ? Math.round(
                      analytics.summary.estimatedCost / analytics.summary.totalSent
                    )
                  : 0}
              </div>
              <div className="text-xs text-muted-foreground">/通</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Twilioレート: 約¥10/セグメント
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
