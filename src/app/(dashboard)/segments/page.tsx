"use client";

/**
 * セグメント管理ページ
 *
 * 根拠: research/runs/20260201-082657__step-email-trends/report.md
 * - ev-003: ハイパーセグメンテーション
 * - ev-004: 行動・意図ベースのセグメント化
 */

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Filter,
  RefreshCw,
  Trash2,
  Edit,
  ChevronRight,
  Zap,
} from "lucide-react";

// セグメントの型定義
interface Segment {
  id: string;
  name: string;
  description: string | null;
  color: string;
  rules: SegmentRule[];
  rulesLogic: "AND" | "OR";
  autoUpdate: boolean;
  memberCount: number;
  createdAt: string;
}

interface SegmentRule {
  field: string;
  operator: string;
  value: string | number | boolean | string[] | number[];
}

// フィールドオプション
const FIELD_OPTIONS = [
  { value: "score", label: "スコア", type: "number" },
  { value: "createdAt", label: "登録日", type: "date" },
  { value: "lastActivityAt", label: "最終アクティビティ", type: "date" },
  { value: "totalOrders", label: "購入回数", type: "number" },
  { value: "totalRevenue", label: "累計購入金額", type: "number" },
  { value: "emailOptIn", label: "メール配信許可", type: "boolean" },
  { value: "tagNames", label: "タグ", type: "array" },
];

// オペレーターオプション
const OPERATOR_OPTIONS: Record<string, { value: string; label: string }[]> = {
  number: [
    { value: "eq", label: "=" },
    { value: "neq", label: "≠" },
    { value: "gt", label: ">" },
    { value: "gte", label: "≥" },
    { value: "lt", label: "<" },
    { value: "lte", label: "≤" },
  ],
  date: [
    { value: "within_days", label: "N日以内" },
    { value: "before", label: "N日より前" },
    { value: "after", label: "N日より後" },
  ],
  boolean: [
    { value: "eq", label: "=" },
  ],
  array: [
    { value: "contains", label: "含む" },
    { value: "not_contains", label: "含まない" },
  ],
};

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

  // TODO: 実際のtenantIdを取得
  const tenantId = "demo-tenant";

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/segments?tenantId=${tenantId}`);
      const data = await res.json();
      setSegments(data.segments || []);
    } catch (error) {
      console.error("Failed to fetch segments:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializePresets = async () => {
    try {
      await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          name: "__initialize_presets__",
        }),
      });
      fetchSegments();
    } catch (error) {
      console.error("Failed to initialize presets:", error);
    }
  };

  const deleteSegment = async (id: string) => {
    if (!confirm("このセグメントを削除しますか？")) return;

    try {
      await fetch(`/api/segments?id=${id}`, { method: "DELETE" });
      setSegments(segments.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete segment:", error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7" />
            セグメント管理
          </h1>
          <p className="text-gray-500 mt-1">
            行動・属性ベースのハイパーセグメンテーション
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={initializePresets}
            className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            プリセット追加
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新規セグメント
          </button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="総セグメント数"
          value={segments.length}
          icon={<Filter className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="自動更新有効"
          value={segments.filter((s) => s.autoUpdate).length}
          icon={<RefreshCw className="w-5 h-5 text-green-600" />}
        />
        <StatCard
          title="総メンバー数"
          value={segments.reduce((sum, s) => sum + s.memberCount, 0)}
          icon={<Users className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="平均メンバー数"
          value={
            segments.length > 0
              ? Math.round(
                  segments.reduce((sum, s) => sum + s.memberCount, 0) /
                    segments.length
                )
              : 0
          }
          icon={<Users className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* セグメント一覧 */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">読み込み中...</p>
        </div>
      ) : segments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Users className="w-12 h-12 mx-auto text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            セグメントがありません
          </h3>
          <p className="mt-2 text-gray-500">
            「プリセット追加」でおすすめセグメントを追加するか、
            <br />
            「新規セグメント」でカスタムセグメントを作成してください。
          </p>
          <button
            onClick={initializePresets}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            プリセットを追加
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((segment) => (
            <SegmentCard
              key={segment.id}
              segment={segment}
              onEdit={() => setEditingSegment(segment)}
              onDelete={() => deleteSegment(segment.id)}
            />
          ))}
        </div>
      )}

      {/* 作成モーダル */}
      {showCreateModal && (
        <SegmentModal
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            await fetch("/api/segments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tenantId, ...data }),
            });
            setShowCreateModal(false);
            fetchSegments();
          }}
        />
      )}

      {/* 編集モーダル */}
      {editingSegment && (
        <SegmentModal
          segment={editingSegment}
          onClose={() => setEditingSegment(null)}
          onSave={async (data) => {
            await fetch("/api/segments", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: editingSegment.id, ...data }),
            });
            setEditingSegment(null);
            fetchSegments();
          }}
        />
      )}
    </div>
  );
}

// 統計カード
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

// セグメントカード
function SegmentCard({
  segment,
  onEdit,
  onDelete,
}: {
  segment: Segment;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <div>
              <h3 className="font-medium text-gray-900">{segment.name}</h3>
              {segment.description && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {segment.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ルール表示 */}
        <div className="mt-3 space-y-1">
          {segment.rules.slice(0, 2).map((rule, i) => (
            <div
              key={i}
              className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-600"
            >
              {rule.field} {rule.operator} {String(rule.value)}
            </div>
          ))}
          {segment.rules.length > 2 && (
            <div className="text-xs text-gray-400">
              +{segment.rules.length - 2} more rules
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            {segment.memberCount.toLocaleString()} 人
          </div>
          <div className="flex items-center gap-2">
            {segment.autoUpdate && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                自動更新
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

// セグメント作成/編集モーダル
function SegmentModal({
  segment,
  onClose,
  onSave,
}: {
  segment?: Segment;
  onClose: () => void;
  onSave: (data: Partial<Segment>) => Promise<void>;
}) {
  const [name, setName] = useState(segment?.name || "");
  const [description, setDescription] = useState(segment?.description || "");
  const [color, setColor] = useState(segment?.color || "#6366f1");
  const [rules, setRules] = useState<SegmentRule[]>(segment?.rules || []);
  const [rulesLogic, setRulesLogic] = useState<"AND" | "OR">(
    segment?.rulesLogic || "AND"
  );
  const [autoUpdate, setAutoUpdate] = useState(segment?.autoUpdate ?? true);
  const [saving, setSaving] = useState(false);

  const addRule = () => {
    setRules([...rules, { field: "score", operator: "gte", value: 0 }]);
  };

  const updateRule = (index: number, updates: Partial<SegmentRule>) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updates };
    setRules(newRules);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name,
        description: description || null,
        color,
        rules,
        rulesLogic,
        autoUpdate,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">
            {segment ? "セグメントを編集" : "新規セグメント"}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {/* 基本情報 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              セグメント名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="例: ホットリード"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="例: スコア80以上の高購買意欲顧客"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カラー
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-16 h-10 rounded border cursor-pointer"
            />
          </div>

          {/* ルール */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                条件ルール
              </label>
              <select
                value={rulesLogic}
                onChange={(e) => setRulesLogic(e.target.value as "AND" | "OR")}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="AND">すべて一致 (AND)</option>
                <option value="OR">いずれか一致 (OR)</option>
              </select>
            </div>

            <div className="space-y-2">
              {rules.map((rule, index) => {
                const fieldOption = FIELD_OPTIONS.find(
                  (f) => f.value === rule.field
                );
                const operators =
                  OPERATOR_OPTIONS[fieldOption?.type || "number"] || [];

                return (
                  <div key={index} className="flex gap-2 items-center">
                    <select
                      value={rule.field}
                      onChange={(e) => updateRule(index, { field: e.target.value })}
                      className="flex-1 px-2 py-1.5 border rounded text-sm"
                    >
                      {FIELD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={rule.operator}
                      onChange={(e) =>
                        updateRule(index, { operator: e.target.value })
                      }
                      className="w-24 px-2 py-1.5 border rounded text-sm"
                    >
                      {operators.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type={fieldOption?.type === "number" ? "number" : "text"}
                      value={String(rule.value)}
                      onChange={(e) =>
                        updateRule(index, {
                          value:
                            fieldOption?.type === "number"
                              ? Number(e.target.value)
                              : e.target.value,
                        })
                      }
                      className="w-24 px-2 py-1.5 border rounded text-sm"
                    />
                    <button
                      onClick={() => removeRule(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={addRule}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              ルールを追加
            </button>
          </div>

          {/* 自動更新 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoUpdate"
              checked={autoUpdate}
              onChange={(e) => setAutoUpdate(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label htmlFor="autoUpdate" className="text-sm text-gray-700">
              自動更新を有効にする（条件に一致するコンタクトを自動で追加）
            </label>
          </div>
        </div>

        {/* フッター */}
        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
