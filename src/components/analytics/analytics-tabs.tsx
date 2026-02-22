'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Mail, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import {
  getCampaignAnalytics,
  getContactGrowthAnalytics,
  getRevenueAnalytics,
  getEmailMetrics,
  getDashboardSummary,
} from '@/actions/analytics';

type DateRange = '7d' | '30d' | '90d';

interface KPICardProps {
  title: string;
  value: string;
  description?: string;
  icon: typeof Users;
}

function KPICard({ title, value, description, icon: Icon }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </CardContent>
    </Card>
  );
}

export function AnalyticsTabs() {
  const [range, setRange] = useState<DateRange>('30d');
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getDashboardSummary>> | null>(null);
  const [campaigns, setCampaigns] = useState<Awaited<ReturnType<typeof getCampaignAnalytics>> | null>(null);
  const [growth, setGrowth] = useState<Awaited<ReturnType<typeof getContactGrowthAnalytics>> | null>(null);
  const [revenue, setRevenue] = useState<Awaited<ReturnType<typeof getRevenueAnalytics>> | null>(null);
  const [emailMetrics, setEmailMetrics] = useState<Awaited<ReturnType<typeof getEmailMetrics>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, c, g, r, e] = await Promise.all([
          getDashboardSummary(),
          getCampaignAnalytics(range),
          getContactGrowthAnalytics(range),
          getRevenueAnalytics(range),
          getEmailMetrics(range),
        ]);
        setSummary(s);
        setCampaigns(c);
        setGrowth(g);
        setRevenue(r);
        setEmailMetrics(e);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">分析ダッシュボード</h2>
        <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7日間</SelectItem>
            <SelectItem value="30d">30日間</SelectItem>
            <SelectItem value="90d">90日間</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="campaigns">キャンペーン</TabsTrigger>
          <TabsTrigger value="funnel">ファネル</TabsTrigger>
          <TabsTrigger value="revenue">収益</TabsTrigger>
          <TabsTrigger value="contacts">コンタクト</TabsTrigger>
        </TabsList>

        {/* 概要タブ */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <KPICard
              title="総コンタクト"
              value={(summary?.totalContacts ?? 0).toLocaleString()}
              description={`+${summary?.newContacts ?? 0} 新規 (${range})`}
              icon={Users}
            />
            <KPICard
              title="配信数"
              value={(campaigns?.total ?? 0).toLocaleString()}
              description={`開封率 ${(campaigns?.openRate ?? 0).toFixed(1)}%`}
              icon={Mail}
            />
            <KPICard
              title="収益"
              value={formatCurrency(revenue?.totalRevenue ?? 0)}
              description={`${revenue?.orderCount ?? 0}件の注文`}
              icon={DollarSign}
            />
            <KPICard
              title="アクティブキャンペーン"
              value={(summary?.activeCampaigns ?? 0).toString()}
              description="稼働中"
              icon={TrendingUp}
            />
          </div>

          {growth?.dailyGrowth && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">コンタクト成長推移</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={growth.dailyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f120" name="新規コンタクト" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* キャンペーンタブ */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <KPICard
              title="総配信数"
              value={(campaigns?.total ?? 0).toLocaleString()}
              icon={Mail}
            />
            <KPICard
              title="平均開封率"
              value={`${(campaigns?.openRate ?? 0).toFixed(1)}%`}
              icon={TrendingUp}
            />
            <KPICard
              title="平均クリック率"
              value={`${(campaigns?.clickRate ?? 0).toFixed(1)}%`}
              icon={BarChart3}
            />
          </div>

          {emailMetrics?.dailyMetrics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">メール開封率・クリック率推移</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={emailMetrics.dailyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis unit="%" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="openRate" stroke="#6366f1" name="開封率" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="clickRate" stroke="#f59e0b" name="クリック率" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ファネルタブ */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ライフサイクルステージ分布</CardTitle>
            </CardHeader>
            <CardContent>
              {growth?.lifecycleBreakdown && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={growth.lifecycleBreakdown.map((l) => ({
                      stage: l.lifecycleStage,
                      count: l._count,
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" name="コンタクト数" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 収益タブ */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <KPICard
              title="総収益"
              value={formatCurrency(revenue?.totalRevenue ?? 0)}
              icon={DollarSign}
            />
            <KPICard
              title="注文件数"
              value={(revenue?.orderCount ?? 0).toString()}
              icon={TrendingUp}
            />
            <KPICard
              title="平均注文額"
              value={formatCurrency(revenue?.avgOrderValue ?? 0)}
              icon={BarChart3}
            />
          </div>

          {revenue?.dailyRevenue && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">日別収益推移</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={revenue.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(v as number)} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b98120" name="収益" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* コンタクト成長タブ */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <KPICard
              title="総コンタクト"
              value={(growth?.totalContacts ?? 0).toLocaleString()}
              icon={Users}
            />
            <KPICard
              title="新規コンタクト"
              value={(growth?.newContacts ?? 0).toLocaleString()}
              description={`過去${range}`}
              icon={TrendingUp}
            />
          </div>

          {growth?.dailyGrowth && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">日別新規コンタクト</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={growth.dailyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" name="新規コンタクト" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
