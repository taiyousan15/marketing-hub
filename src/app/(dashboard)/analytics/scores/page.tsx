"use client";

/**
 * スコアリングダッシュボード
 *
 * 根拠: research/runs/20260201-082657__step-email-trends/report.md
 * - ev-005: AIスコアリングで成約率向上
 * - ev-006: 有料化率20%→71%
 */

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Zap,
  RefreshCw,
  BarChart3,
  Target,
  ThermometerSun,
} from "lucide-react";

interface ScoreSummary {
  totalScored: number;
  tierCounts: {
    hot: number;
    warm: number;
    cold: number;
    frozen: number;
  };
  rfmSegmentCounts: Record<string, number>;
  avgLeadScore: number;
  avgEngagementScore: number;
  highRiskCount: number;
}

interface ContactScore {
  id: string;
  contactId: string;
  recency: number;
  frequency: number;
  monetary: number;
  rfmSegment: string | null;
  leadScore: number;
  engagementScore: number;
  churnScore: number;
  tier: string;
  calculatedAt: string;
}

const TIER_COLORS = {
  hot: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  warm: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  cold: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  frozen: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
};

const RFM_SEGMENT_LABELS: Record<string, string> = {
  champions: "最優良顧客",
  loyal_customers: "ロイヤル顧客",
  potential_loyalist: "潜在ロイヤル",
  new_customers: "新規顧客",
  promising: "有望顧客",
  needs_attention: "要注意",
  about_to_sleep: "休眠予備軍",
  at_risk: "リスク顧客",
  cant_lose: "失いたくない",
  hibernating: "休眠",
  lost: "離脱",
};

export default function ScoresDashboard() {
  const [summary, setSummary] = useState<ScoreSummary | null>(null);
  const [hotLeads, setHotLeads] = useState<ContactScore[]>([]);
  const [atRisk, setAtRisk] = useState<ContactScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  // TODO: 実際のtenantIdを取得
  const tenantId = "demo-tenant";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, hotRes, riskRes] = await Promise.all([
        fetch(`/api/scores?tenantId=${tenantId}&action=summary`),
        fetch(`/api/scores?tenantId=${tenantId}&action=hot_leads&limit=5`),
        fetch(`/api/scores?tenantId=${tenantId}&action=at_risk&limit=5`),
      ]);

      const summaryData = await summaryRes.json();
      const hotData = await hotRes.json();
      const riskData = await riskRes.json();

      setSummary(summaryData.summary);
      setHotLeads(hotData.hotLeads || []);
      setAtRisk(riskData.atRisk || []);
    } catch (error) {
      console.error("Failed to fetch scores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!confirm("全コンタクトのスコアを再計算しますか？")) return;

    setRecalculating(true);
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, action: "recalculate_all" }),
      });
      const data = await res.json();
      alert(`再計算完了: ${data.result.updated}件更新, ${data.result.errors}件エラー`);
      fetchData();
    } catch (error) {
      console.error("Recalculation error:", error);
      alert("再計算に失敗しました");
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7" />
            スコアリングダッシュボード
          </h1>
          <p className="text-gray-500 mt-1">
            RFM分析 + リードスコア + エンゲージメント分析
          </p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${recalculating ? "animate-spin" : ""}`} />
          {recalculating ? "再計算中..." : "全件再計算"}
        </button>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="スコア済み"
          value={summary?.totalScored || 0}
          icon={<Users className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="平均リードスコア"
          value={summary?.avgLeadScore || 0}
          suffix="/100"
          icon={<Target className="w-5 h-5 text-green-600" />}
        />
        <StatCard
          title="平均エンゲージメント"
          value={summary?.avgEngagementScore || 0}
          suffix="/100"
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="高リスク顧客"
          value={summary?.highRiskCount || 0}
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          alert={(summary?.highRiskCount ?? 0) > 0}
        />
      </div>

      {/* ティア分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ThermometerSun className="w-5 h-5" />
            ティア分布
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {(["hot", "warm", "cold", "frozen"] as const).map((tier) => {
              const count = summary?.tierCounts[tier] || 0;
              const total = summary?.totalScored || 1;
              const percentage = Math.round((count / total) * 100);
              const colors = TIER_COLORS[tier];

              return (
                <div
                  key={tier}
                  className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}
                >
                  <div className={`text-2xl font-bold ${colors.text}`}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">{tier}</div>
                  <div className="mt-2 h-2 bg-white/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${tier === "hot" ? "bg-red-500" : tier === "warm" ? "bg-orange-500" : tier === "cold" ? "bg-blue-500" : "bg-gray-400"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RFMセグメント分布 */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">RFMセグメント分布</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(summary?.rfmSegmentCounts || {})
              .sort((a, b) => b[1] - a[1])
              .map(([segment, count]) => {
                const total = summary?.totalScored || 1;
                const percentage = Math.round((count / total) * 100);

                return (
                  <div key={segment} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-gray-600 truncate">
                      {RFM_SEGMENT_LABELS[segment] || segment}
                    </div>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-12 text-sm text-gray-500 text-right">
                      {count}
                    </div>
                  </div>
                );
              })}
            {Object.keys(summary?.rfmSegmentCounts || {}).length === 0 && (
              <div className="text-gray-400 text-center py-8">
                データがありません
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ホットリードとリスク顧客 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ホットリード */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            ホットリード TOP5
          </h2>
          {hotLeads.length > 0 ? (
            <div className="space-y-3">
              {hotLeads.map((score, index) => (
                <div
                  key={score.id}
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {score.contactId.slice(0, 8)}...
                    </div>
                    <div className="text-xs text-gray-500">
                      {RFM_SEGMENT_LABELS[score.rfmSegment || ""] || score.rfmSegment}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">
                      {score.leadScore}
                    </div>
                    <div className="text-xs text-gray-500">リードスコア</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-8">
              ホットリードがいません
            </div>
          )}
        </div>

        {/* リスク顧客 */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            高リスク顧客 TOP5
          </h2>
          {atRisk.length > 0 ? (
            <div className="space-y-3">
              {atRisk.map((score, index) => (
                <div
                  key={score.id}
                  className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {score.contactId.slice(0, 8)}...
                    </div>
                    <div className="text-xs text-gray-500">
                      {RFM_SEGMENT_LABELS[score.rfmSegment || ""] || score.rfmSegment}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600">
                      {score.churnScore}
                    </div>
                    <div className="text-xs text-gray-500">チャーンリスク</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-8">
              高リスク顧客がいません
            </div>
          )}
        </div>
      </div>

      {/* 研究根拠 */}
      <div className="mt-8 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
        <div className="text-sm text-indigo-800">
          <strong>研究根拠:</strong> AIスコアリングを活用した企業では、
          スコアの高いリードに優先対応することで成約率が向上（ev-005）、
          有料化率が20%→71%に改善（ev-006）という実績があります。
        </div>
      </div>
    </div>
  );
}

// 統計カード
function StatCard({
  title,
  value,
  suffix,
  icon,
  alert,
}: {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${alert ? "border-red-300" : ""}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${alert ? "bg-red-50" : "bg-gray-50"}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">
            {value.toLocaleString()}
            {suffix && <span className="text-sm text-gray-400">{suffix}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
