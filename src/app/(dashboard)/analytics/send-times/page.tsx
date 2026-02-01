"use client";

/**
 * 送信時間最適化ダッシュボード
 *
 * 根拠: research/runs/20260201-082657__step-email-trends/report.md
 * - ev-002: AIが購読者行動から学習し最適送信時間を予測
 */

import { useState, useEffect } from "react";
import {
  Clock,
  RefreshCw,
  BarChart3,
  Users,
  Zap,
  Sun,
  Moon,
  Coffee,
} from "lucide-react";

interface SendTimeSummary {
  totalAnalyzed: number;
  hourDistribution: number[];
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  peakHour: number;
  avgDataPoints: number;
  avgConfidence: number;
}

interface SendWindow {
  label: string;
  hours: number[];
  description: string;
}

const HOUR_LABELS = [
  "0時", "1時", "2時", "3時", "4時", "5時",
  "6時", "7時", "8時", "9時", "10時", "11時",
  "12時", "13時", "14時", "15時", "16時", "17時",
  "18時", "19時", "20時", "21時", "22時", "23時",
];

export default function SendTimesPage() {
  const [summary, setSummary] = useState<SendTimeSummary | null>(null);
  const [windows, setWindows] = useState<SendWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [audienceType, setAudienceType] = useState<"business" | "consumer">("business");

  // TODO: 実際のtenantIdを取得
  const tenantId = "demo-tenant";

  useEffect(() => {
    fetchData();
  }, [audienceType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, windowsRes] = await Promise.all([
        fetch(`/api/send-times?tenantId=${tenantId}&action=summary`),
        fetch(`/api/send-times?action=recommendations&type=${audienceType}`),
      ]);

      const summaryData = await summaryRes.json();
      const windowsData = await windowsRes.json();

      setSummary(summaryData.summary);
      setWindows(windowsData.windows || []);
    } catch (error) {
      console.error("Failed to fetch send times:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAll = async () => {
    if (!confirm("全コンタクトの送信時間を分析しますか？")) return;

    setAnalyzing(true);
    try {
      const res = await fetch("/api/send-times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, action: "analyze_all" }),
      });
      const data = await res.json();
      alert(`分析完了: ${data.result.analyzed}件分析, ${data.result.updated}件更新`);
      fetchData();
    } catch (error) {
      console.error("Analysis error:", error);
      alert("分析に失敗しました");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const maxHourCount = Math.max(...(summary?.hourDistribution || [1]));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-7 h-7" />
            送信時間最適化
          </h1>
          <p className="text-gray-500 mt-1">
            個人別の最適送信時間を分析・予測
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={audienceType}
            onChange={(e) => setAudienceType(e.target.value as "business" | "consumer")}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="business">ビジネス向け</option>
            <option value="consumer">コンシューマー向け</option>
          </select>
          <button
            onClick={handleAnalyzeAll}
            disabled={analyzing}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? "animate-spin" : ""}`} />
            {analyzing ? "分析中..." : "全件分析"}
          </button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="分析済み"
          value={summary?.totalAnalyzed || 0}
          icon={<Users className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="ピーク時間"
          value={`${summary?.peakHour || 9}:00`}
          isText
          icon={<Clock className="w-5 h-5 text-green-600" />}
        />
        <StatCard
          title="平均データ数"
          value={summary?.avgDataPoints || 0}
          icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="平均信頼度"
          value={summary?.avgConfidence || 0}
          suffix="%"
          icon={<Zap className="w-5 h-5 text-yellow-600" />}
        />
      </div>

      {/* 時間帯別分布グラフ */}
      <div className="bg-white rounded-xl border p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">時間帯別の最適送信時間分布</h2>
        <div className="flex items-end gap-1 h-48">
          {(summary?.hourDistribution || new Array(24).fill(0)).map((count, hour) => {
            const height = maxHourCount > 0 ? (count / maxHourCount) * 100 : 0;
            const isBusinessHour = hour >= 9 && hour <= 18;
            const isPeakHour = hour === summary?.peakHour;

            return (
              <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t transition-all ${
                    isPeakHour
                      ? "bg-indigo-600"
                      : isBusinessHour
                      ? "bg-indigo-400"
                      : "bg-gray-300"
                  }`}
                  style={{ height: `${height}%`, minHeight: count > 0 ? 4 : 0 }}
                  title={`${hour}時: ${count}人`}
                />
                <span className="text-xs text-gray-400">{hour}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-indigo-600" />
            <span className="text-gray-600">ピーク時間</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-indigo-400" />
            <span className="text-gray-600">業務時間帯</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-300" />
            <span className="text-gray-600">その他</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 信頼度分布 */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">信頼度分布</h2>
          <div className="space-y-4">
            {[
              { label: "高（80%以上）", key: "high", color: "bg-green-500" },
              { label: "中（50-79%）", key: "medium", color: "bg-yellow-500" },
              { label: "低（50%未満）", key: "low", color: "bg-red-500" },
            ].map(({ label, key, color }) => {
              const count = summary?.confidenceDistribution[key as keyof typeof summary.confidenceDistribution] || 0;
              const total = summary?.totalAnalyzed || 1;
              const percentage = Math.round((count / total) * 100);

              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium">{count}人 ({percentage}%)</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 推奨送信時間帯 */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">
            推奨送信時間帯（{audienceType === "business" ? "ビジネス" : "コンシューマー"}向け）
          </h2>
          <div className="space-y-3">
            {windows.map((window, index) => {
              const Icon = index === 0 ? Sun : index === 1 ? Coffee : index === 2 ? Sun : Moon;

              return (
                <div
                  key={window.label}
                  className="p-3 bg-gray-50 rounded-lg flex items-start gap-3"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {window.label}
                      <span className="ml-2 text-sm text-indigo-600">
                        {window.hours.map((h) => `${h}:00`).join("-")}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{window.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 使い方ガイド */}
      <div className="mt-8 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
        <h3 className="font-medium text-indigo-900 mb-2">使い方</h3>
        <ul className="text-sm text-indigo-800 space-y-1">
          <li>• 「全件分析」をクリックすると、全コンタクトの開封パターンを分析します</li>
          <li>• 分析結果は各コンタクトの最適送信時間として保存されます</li>
          <li>• ステップメールの「最適時間で送信」オプションを有効にすると自動適用されます</li>
          <li>• データが蓄積されるほど予測精度が向上します（最低3件の開封データが必要）</li>
        </ul>
      </div>

      {/* 研究根拠 */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600">
          <strong>研究根拠:</strong> AIが購読者行動から学習し、最適送信時間を予測することで
          開封率・クリック率の向上が期待できます（ev-002）。
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
  isText,
}: {
  title: string;
  value: number | string;
  suffix?: string;
  icon: React.ReactNode;
  isText?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-50">{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">
            {isText ? value : typeof value === "number" ? value.toLocaleString() : value}
            {suffix && <span className="text-sm text-gray-400">{suffix}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
