"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  Search,
} from "lucide-react";

interface AutoReplyRule {
  id: string;
  name: string;
  keyword: string;
  matchType: string;
  replyType: string;
  replyContent: { text?: string; altText?: string; contents?: unknown };
  isActive: boolean;
  priority: number;
  createdAt: string;
}

const MATCH_TYPE_LABELS: Record<string, string> = {
  exact: "完全一致",
  contains: "部分一致",
  startsWith: "前方一致",
  regex: "正規表現",
};

const REPLY_TYPE_LABELS: Record<string, string> = {
  text: "テキスト",
  flex: "Flexメッセージ",
  image: "画像",
  video: "動画",
  sticker: "スタンプ",
};

export default function LineAutoReplyPage() {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    keyword: string;
    matchType: string;
    replyType: string;
    replyContent: { text?: string; altText?: string; contents?: unknown };
    priority: number;
  }>({
    name: "",
    keyword: "",
    matchType: "contains",
    replyType: "text",
    replyContent: { text: "" },
    priority: 0,
  });

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/line/auto-reply", {
        headers: { "x-tenant-id": "default" },
      });
      const data = await res.json();
      if (data.success) {
        setRules(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch rules:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const method = editingRule ? "PATCH" : "POST";
    const body = editingRule
      ? { id: editingRule.id, ...formData }
      : formData;

    try {
      const res = await fetch("/api/line/auto-reply", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "default",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingRule(null);
        setFormData({
          name: "",
          keyword: "",
          matchType: "contains",
          replyType: "text",
          replyContent: { text: "" },
          priority: 0,
        });
        await fetchRules();
      }
    } catch (error) {
      console.error("Failed to save rule:", error);
    }
  };

  const handleToggle = async (rule: AutoReplyRule) => {
    try {
      await fetch("/api/line/auto-reply", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "default",
        },
        body: JSON.stringify({ id: rule.id, isActive: !rule.isActive }),
      });
      await fetchRules();
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この自動応答ルールを削除しますか？")) return;

    try {
      await fetch(`/api/line/auto-reply?id=${id}`, {
        method: "DELETE",
        headers: { "x-tenant-id": "default" },
      });
      await fetchRules();
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  const handleEdit = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      keyword: rule.keyword,
      matchType: rule.matchType,
      replyType: rule.replyType,
      replyContent: rule.replyContent,
      priority: rule.priority,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            LINE自動応答
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            キーワードに基づく自動応答ルールを管理します
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRule(null);
            setFormData({
              name: "",
              keyword: "",
              matchType: "contains",
              replyType: "text",
              replyContent: { text: "" },
              priority: 0,
            });
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          ルール追加
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {editingRule ? "ルール編集" : "新規ルール"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ルール名
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  キーワード
                </label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={(e) =>
                    setFormData({ ...formData, keyword: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  マッチタイプ
                </label>
                <select
                  value={formData.matchType}
                  onChange={(e) =>
                    setFormData({ ...formData, matchType: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {Object.entries(MATCH_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  返信タイプ
                </label>
                <select
                  value={formData.replyType}
                  onChange={(e) =>
                    setFormData({ ...formData, replyType: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {Object.entries(REPLY_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  優先度
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                返信メッセージ
              </label>
              <textarea
                value={
                  typeof formData.replyContent === "object"
                    ? formData.replyContent.text || ""
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    replyContent: { text: e.target.value },
                  })
                }
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                {editingRule ? "更新" : "作成"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRule(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : rules.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
            自動応答ルールがありません
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            キーワードに基づく自動応答ルールを作成してください
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  状態
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  ルール名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  キーワード
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  マッチ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  返信タイプ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  優先度
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(rule)}>
                      {rule.isActive ? (
                        <ToggleRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {rule.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <Search className="h-3 w-3" />
                      {rule.keyword}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {MATCH_TYPE_LABELS[rule.matchType] || rule.matchType}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {REPLY_TYPE_LABELS[rule.replyType] || rule.replyType}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {rule.priority}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="text-gray-400 hover:text-blue-500"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
