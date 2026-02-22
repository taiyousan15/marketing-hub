"use client";

import Link from "next/link";
import {
  BarChart3,
  Users,
  MessageSquare,
  Phone,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsTabs } from "@/components/analytics/analytics-tabs";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">分析</h1>
        <p className="text-muted-foreground">
          マーケティング活動のパフォーマンスを分析します
        </p>
      </div>

      <AnalyticsTabs />

      {/* 高度な分析ダッシュボードへのリンク */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link href="/analytics/cart-recovery">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                カート放棄リカバリー
              </CardTitle>
              <CardDescription>
                放棄カートの回収状況・リマインダー効果・回収売上を分析
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
          <Link href="/analytics/rfm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                RFMセグメンテーション
              </CardTitle>
              <CardDescription>
                Recency・Frequency・Monetary分析による顧客セグメント分類
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
          <Link href="/analytics/sentiment">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-red-500" />
                センチメント分析
              </CardTitle>
              <CardDescription>
                顧客メッセージの感情分析・アラート・エスカレーション管理
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
