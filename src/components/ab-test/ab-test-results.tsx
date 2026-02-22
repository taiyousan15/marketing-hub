'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp } from 'lucide-react';

interface VariantStats {
  id: string;
  name: string;
  weight: number;
  totalImpressions: number;
  totalConversions: number;
  conversionRate: number;
}

interface ABTestResultsProps {
  testName: string;
  status: string;
  variantStats: VariantStats[];
  winner: VariantStats | null;
}

const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export function ABTestResults({ testName, status, variantStats, winner }: ABTestResultsProps) {
  const chartData = variantStats.map((v, i) => ({
    name: v.name,
    インプレッション: v.totalImpressions,
    コンバージョン率: parseFloat(v.conversionRate.toFixed(2)),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const getStatusBadge = () => {
    const map: Record<string, { label: string; class: string }> = {
      DRAFT: { label: '下書き', class: 'bg-gray-100 text-gray-600' },
      RUNNING: { label: '実行中', class: 'bg-green-100 text-green-700' },
      PAUSED: { label: '一時停止', class: 'bg-yellow-100 text-yellow-700' },
      COMPLETED: { label: '完了', class: 'bg-blue-100 text-blue-700' },
    };
    const { label, class: cls } = map[status] ?? { label: status, class: '' };
    return <Badge className={cls}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{testName}</h3>
        {getStatusBadge()}
      </div>

      {winner && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Trophy className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              現在の勝者: {winner.name}
            </p>
            <p className="text-xs text-amber-600">
              CV率 {winner.conversionRate.toFixed(2)}% ({winner.totalConversions}/{winner.totalImpressions})
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {variantStats.map((v, i) => (
          <div
            key={v.id}
            className={`p-3 rounded-lg border ${winner?.id === v.id ? 'border-amber-300 bg-amber-50' : 'bg-gray-50'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="text-sm font-medium">{v.name}</span>
              {winner?.id === v.id && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
            </div>
            <div className="space-y-1 text-xs">
              <p className="text-muted-foreground">
                インプレッション: <span className="font-semibold text-foreground">{v.totalImpressions.toLocaleString()}</span>
              </p>
              <p className="text-muted-foreground">
                コンバージョン: <span className="font-semibold text-foreground">{v.totalConversions.toLocaleString()}</span>
              </p>
              <p className="text-muted-foreground flex items-center gap-1">
                CV率: <span className="font-bold text-primary text-sm">{v.conversionRate.toFixed(2)}%</span>
                <TrendingUp className="h-3 w-3 text-primary" />
              </p>
            </div>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} unit="%" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="インプレッション" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="コンバージョン率" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
