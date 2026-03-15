"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Grid3X3,
  Users,
  Tag,
  ChevronRight,
} from "lucide-react";

interface RichMenu {
  id: string;
  name: string;
  lineRichMenuId: string | null;
  imageUrl: string | null;
  conditions: { rules: Array<{ field: string; operator: string; value: unknown }>; logic: string } | null;
  tabGroup: string | null;
  tabOrder: number | null;
  isDefault: boolean;
}

export default function LineRichMenuPage() {
  const [menus, setMenus] = useState<RichMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [reEvaluating, setReEvaluating] = useState(false);
  const [tabGroups, setTabGroups] = useState<Record<string, RichMenu[]>>({});

  const fetchMenus = useCallback(async () => {
    try {
      const res = await fetch("/api/line/rich-menu", {
        headers: { "x-tenant-id": "default" },
      });
      const data = await res.json();
      if (data.success) {
        setMenus(data.data || []);

        // Group by tabGroup
        const groups: Record<string, RichMenu[]> = {};
        for (const menu of (data.data || [])) {
          if (menu.tabGroup) {
            if (!groups[menu.tabGroup]) {
              groups[menu.tabGroup] = [];
            }
            groups[menu.tabGroup].push(menu);
          }
        }
        setTabGroups(groups);
      }
    } catch (error) {
      console.error("Failed to fetch menus:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const handleReEvaluate = async () => {
    setReEvaluating(true);
    try {
      const res = await fetch("/api/line/rich-menu/segments", {
        method: "POST",
        headers: { "x-tenant-id": "default" },
      });
      const data = await res.json();
      if (data.success) {
        alert(`${data.data.updated}件のコンタクトを更新しました（失敗: ${data.data.failed}件）`);
      }
    } catch (error) {
      console.error("Failed to re-evaluate:", error);
      alert("再評価に失敗しました");
    } finally {
      setReEvaluating(false);
    }
  };

  const conditionMenus = menus.filter((m) => m.conditions && !m.tabGroup);
  const defaultMenus = menus.filter((m) => !m.conditions && !m.tabGroup);
  const tabGroupNames = Object.keys(tabGroups);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            リッチメニュー管理
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            セグメント条件付きリッチメニューとタブグループを管理します
          </p>
        </div>
        <button
          onClick={handleReEvaluate}
          disabled={reEvaluating}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${reEvaluating ? "animate-spin" : ""}`} />
          {reEvaluating ? "再評価中..." : "全コンタクト再評価"}
        </button>
      </div>

      {/* Segment Condition Menus */}
      {conditionMenus.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Users className="h-5 w-5 text-indigo-500" />
            セグメント条件付きメニュー
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {conditionMenus.map((menu) => (
              <div
                key={menu.id}
                className="rounded-lg border border-indigo-200 bg-white p-4 dark:border-indigo-800 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {menu.name}
                  </h3>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    条件付き
                  </span>
                </div>
                {menu.conditions && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500">
                      ロジック: {menu.conditions.logic}
                    </p>
                    {menu.conditions.rules?.map((rule, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400"
                      >
                        <ChevronRight className="h-3 w-3" />
                        {rule.field} {rule.operator} {String(rule.value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Groups */}
      {tabGroupNames.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Grid3X3 className="h-5 w-5 text-green-500" />
            タブ切り替えグループ
          </h2>
          {tabGroupNames.map((groupName) => (
            <div
              key={groupName}
              className="mb-4 rounded-lg border border-green-200 bg-white p-4 dark:border-green-800 dark:bg-gray-800"
            >
              <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
                グループ: {groupName}
              </h3>
              <div className="flex gap-3">
                {tabGroups[groupName]
                  .sort((a, b) => (a.tabOrder || 0) - (b.tabOrder || 0))
                  .map((menu) => (
                    <div
                      key={menu.id}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600"
                    >
                      <Tag className="h-4 w-4 text-green-500" />
                      <span className="text-gray-900 dark:text-white">
                        {menu.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        Tab {(menu.tabOrder || 0) + 1}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Default Menus */}
      {defaultMenus.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            その他のメニュー
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {defaultMenus.map((menu) => (
              <div
                key={menu.id}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {menu.name}
                  </h3>
                  {menu.isDefault && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      デフォルト
                    </span>
                  )}
                </div>
                {menu.lineRichMenuId && (
                  <p className="mt-1 truncate text-xs text-gray-400">
                    ID: {menu.lineRichMenuId}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-gray-500">読み込み中...</div>
      )}

      {!loading && menus.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
          <Grid3X3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
            リッチメニューがありません
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            LINE公式アカウント設定からリッチメニューを作成してください
          </p>
        </div>
      )}
    </div>
  );
}
