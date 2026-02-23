"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  TrendingUp,
  BarChart3,
  Loader2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface RFMSegment {
  name: string;
  key: string;
  count: number;
  color: string;
  percentage: number;
}

interface TierData {
  tier: string;
  count: number;
  percentage: number;
}

const TIER_LABELS: Record<string, string> = {
  hot: "ホット",
  warm: "ウォーム",
  cold: "コールド",
  vip: "VIP",
};

const SEGMENT_ACTIONS: Record<string, string> = {
  champion: "VIP特典提供、アンバサダープログラム案内",
  loyal: "アップセル提案、ロイヤルティ特典",
  new_customer: "ウェルカムシーケンス、初回特典",
  promising: "エンゲージメント強化、限定オファー",
  needs_attention: "パーソナライズドオファー、アンケート送付",
  at_risk: "緊急リテンションオファー、個別フォローアップ",
  dormant: "Win-backキャンペーン、再活性化オファー",
};

export default function RFMAnalyticsPage() {
  const [segments, setSegments] = useState<RFMSegment[]>([]);
  const [tiers, setTiers] = useState<TierData[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/rfm");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setSegments(data.segments || []);
      setTiers(data.tiers || []);
      setTotalContacts(data.totalContacts || 0);
    } catch (error) {
      console.error("Failed to load RFM data:", error);
      toast.error("RFMデータの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">RFM分析</h1>
        <p className="text-muted-foreground">
          顧客をRecency（最終購入日）、Frequency（頻度）、Monetary（金額）で分類
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">スコア対象顧客</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {segments.length}セグメント
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">上位顧客</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segments
                .filter((s) => ["champion", "loyal"].includes(s.key))
                .reduce((sum, s) => sum + s.count, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              チャンピオン + ロイヤル
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">リスク顧客</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segments
                .filter((s) => ["at_risk", "dormant"].includes(s.key))
                .reduce((sum, s) => sum + s.count, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              要フォローアップ
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>セグメント分布</CardTitle>
            <CardDescription>
              RFMスコアに基づく顧客分類
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {segments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>セグメントデータがありません</p>
                <p className="text-sm mt-1">
                  顧客の購買データが蓄積されると表示されます
                </p>
              </div>
            ) : (
              segments.map((segment) => (
                <div key={segment.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={"w-3 h-3 rounded-full " + segment.color}
                      />
                      <span>{segment.name}</span>
                    </div>
                    <span className="font-medium">
                      {segment.count.toLocaleString()}人 ({segment.percentage}%)
                    </span>
                  </div>
                  <Progress value={segment.percentage} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ティア分布</CardTitle>
            <CardDescription>
              総合スコアに基づくティア分類
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tiers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                スコアデータがありません
              </div>
            ) : (
              tiers.map((tier) => (
                <div key={tier.tier} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{TIER_LABELS[tier.tier] ?? tier.tier}</span>
                    <span className="font-medium">
                      {tier.count.toLocaleString()}人 ({tier.percentage}%)
                    </span>
                  </div>
                  <Progress value={tier.percentage} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>セグメント別推奨アクション</CardTitle>
          <CardDescription>
            各セグメントの顧客に対する推奨施策
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {segments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              セグメントデータが蓄積されると推奨アクションが表示されます
            </div>
          ) : (
            segments.map((segment) => (
              <div
                key={segment.key}
                className="flex items-start gap-3 p-3 rounded-lg border"
              >
                <div
                  className={"w-3 h-3 mt-1.5 rounded-full flex-shrink-0 " + segment.color}
                />
                <div>
                  <p className="font-medium">{segment.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {SEGMENT_ACTIONS[segment.key] ?? "施策を設定してください"}
                  </p>
                </div>
                <div className="ml-auto text-sm font-medium text-muted-foreground">
                  {segment.count.toLocaleString()}人
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
