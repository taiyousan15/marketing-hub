"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  MousePointer,
  Calendar,
  MessageSquare,
  Phone,
  Clock,
  ArrowRight,
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

const metrics = [
  {
    title: "総コンタクト数",
    value: "1,234",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "メール配信数",
    value: "45,678",
    change: "+8.2%",
    changeType: "positive" as const,
    icon: Mail,
  },
  {
    title: "平均開封率",
    value: "32.4%",
    change: "+2.1%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
  {
    title: "平均クリック率",
    value: "8.7%",
    change: "-0.5%",
    changeType: "negative" as const,
    icon: MousePointer,
  },
];

const recentActivity = [
  { date: "2025-01-30", contacts: 45, emails: 1200, opens: 420, clicks: 98 },
  { date: "2025-01-29", contacts: 38, emails: 980, opens: 350, clicks: 72 },
  { date: "2025-01-28", contacts: 52, emails: 1450, opens: 510, clicks: 115 },
  { date: "2025-01-27", contacts: 41, emails: 1100, opens: 380, clicks: 88 },
  { date: "2025-01-26", contacts: 33, emails: 890, opens: 290, clicks: 65 },
  { date: "2025-01-25", contacts: 47, emails: 1320, opens: 460, clicks: 102 },
  { date: "2025-01-24", contacts: 39, emails: 1050, opens: 370, clicks: 81 },
];

const topCampaigns = [
  { name: "新規登録者向けステップメール", sent: 12450, openRate: 45.2, clickRate: 12.8 },
  { name: "セミナー告知LINE配信", sent: 5670, openRate: 78.5, clickRate: 23.1 },
  { name: "商品リリース告知", sent: 8900, openRate: 38.9, clickRate: 9.4 },
  { name: "休眠顧客フォローアップ", sent: 3200, openRate: 22.1, clickRate: 5.2 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("7d");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">分析</h1>
          <p className="text-muted-foreground">
            マーケティング活動のパフォーマンスを分析します
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="期間を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">過去7日間</SelectItem>
            <SelectItem value="30d">過去30日間</SelectItem>
            <SelectItem value="90d">過去90日間</SelectItem>
            <SelectItem value="1y">過去1年間</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className={"text-xs " + (metric.changeType === "positive" ? "text-green-600" : "text-red-600")}>
                {metric.change} 前期比
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>日別アクティビティ</CardTitle>
            <CardDescription>過去7日間のアクティビティ推移</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((day) => (
                <div key={day.date} className="flex items-center">
                  <div className="w-20 text-sm text-muted-foreground">
                    {day.date.slice(5)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 bg-primary rounded"
                        style={{ width: (day.contacts / 60 * 100) + "%" }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {day.contacts}件
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>トップキャンペーン</CardTitle>
            <CardDescription>最も効果的なキャンペーン</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCampaigns.map((campaign, index) => (
                <div key={campaign.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.sent.toLocaleString()}件送信
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{campaign.openRate}%</p>
                    <p className="text-xs text-muted-foreground">開封率</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ファネル分析</CardTitle>
          <CardDescription>コンバージョンファネルの各ステップの状況</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">訪問者</span>
                  <span className="text-sm text-muted-foreground">10,000</span>
                </div>
                <div className="h-3 bg-primary rounded" style={{ width: "100%" }} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">リード獲得</span>
                  <span className="text-sm text-muted-foreground">2,500 (25%)</span>
                </div>
                <div className="h-3 bg-primary/80 rounded" style={{ width: "25%" }} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">商談</span>
                  <span className="text-sm text-muted-foreground">500 (5%)</span>
                </div>
                <div className="h-3 bg-primary/60 rounded" style={{ width: "5%" }} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">成約</span>
                  <span className="text-sm text-muted-foreground">125 (1.25%)</span>
                </div>
                <div className="h-3 bg-primary/40 rounded" style={{ width: "1.25%" }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 詳細分析へのリンク */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link href="/analytics/sms">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-500" />
                SMS分析
              </CardTitle>
              <CardDescription>
                SMS配信のパフォーマンス、コスト、配信成功率を分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                詳細を見る
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link href="/analytics/send-times">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                送信時間分析
              </CardTitle>
              <CardDescription>
                最適な配信タイミングを分析し、エンゲージメントを最大化
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                詳細を見る
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link href="/analytics/scores">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                スコア分析
              </CardTitle>
              <CardDescription>
                コンタクトのエンゲージメントスコアと傾向を分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                詳細を見る
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
