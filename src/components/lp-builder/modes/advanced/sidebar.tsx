'use client';

/**
 * LP Builder サイドバーコンポーネント（Advanced Mode）
 * UTAGE互換 - 34要素を9カテゴリで表示
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  LayoutGrid,
  Heading,
  FileText,
  Video,
  FileInput,
  MousePointer,
  MessageCircle,
  CreditCard,
  Settings,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  getCategories,
  getComponentsByCategory,
  getComponentCount,
} from '../../components-registry';
import { ComponentCategory, LPComponent } from '../../types';

interface SidebarProps {
  onAddComponent: (component: LPComponent) => void;
}

/**
 * カテゴリアイコンマッピング（UTAGE互換）
 */
const CATEGORY_ICONS: Record<ComponentCategory, React.ComponentType<{ className?: string }>> = {
  basic: LayoutGrid,
  headline: Heading,
  content: FileText,
  video: Video,
  form: FileInput,
  button: MousePointer,
  line: MessageCircle,
  payment: CreditCard,
  other: Settings,
};

/**
 * カテゴリカラーマッピング
 */
const CATEGORY_COLORS: Record<ComponentCategory, string> = {
  basic: 'bg-blue-100 text-blue-600',
  headline: 'bg-purple-100 text-purple-600',
  content: 'bg-green-100 text-green-600',
  video: 'bg-red-100 text-red-600',
  form: 'bg-orange-100 text-orange-600',
  button: 'bg-indigo-100 text-indigo-600',
  line: 'bg-emerald-100 text-emerald-600',
  payment: 'bg-rose-100 text-rose-600',
  other: 'bg-gray-100 text-gray-600',
};

/**
 * コンポーネントカード
 */
function ComponentCard({
  component,
  onAdd,
}: {
  component: LPComponent;
  onAdd: (component: LPComponent) => void;
}) {
  const Icon = CATEGORY_ICONS[component.category];
  const colorClass = CATEGORY_COLORS[component.category];

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border border-gray-200 transition-all hover:border-blue-300 hover:shadow-md"
      onClick={() => onAdd(component)}
    >
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${colorClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm truncate">{component.name}</h4>
            <p className="text-xs text-gray-500 truncate">{component.description}</p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="rounded-full bg-blue-500 p-1">
              <Plus className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * カテゴリビュー
 */
function CategoryView({
  category,
  onAddComponent,
}: {
  category: ComponentCategory;
  onAddComponent: (component: LPComponent) => void;
}) {
  const components = getComponentsByCategory(category);
  const Icon = CATEGORY_ICONS[category];
  const colorClass = CATEGORY_COLORS[category];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <div className={`rounded-lg p-1.5 ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-gray-900">
          {CATEGORY_LABELS[category]}
        </h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {components.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {components.map((component) => (
          <ComponentCard
            key={component.id}
            component={component}
            onAdd={onAddComponent}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 全コンポーネントビュー
 */
function AllComponentsView({ onAddComponent }: { onAddComponent: (component: LPComponent) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const categories = getCategories();

  // 検索フィルタリング
  const filteredComponents = categories.map((category) => {
    const components = getComponentsByCategory(category);
    const filtered = components.filter(
      (comp) =>
        comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { category, components: filtered };
  }).filter((item) => item.components.length > 0);

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="sticky top-0 z-10 bg-white pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="コンポーネントを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* カテゴリ別リスト */}
      {filteredComponents.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-500">該当するコンポーネントが見つかりません</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredComponents.map(({ category, components }) => (
            <div key={category}>
              <div className="mb-2 flex items-center gap-2">
                {(() => {
                  const Icon = CATEGORY_ICONS[category];
                  const colorClass = CATEGORY_COLORS[category];
                  return (
                    <div className={`rounded p-1 ${colorClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  );
                })()}
                <h3 className="font-medium text-gray-700 text-sm">
                  {CATEGORY_LABELS[category]}
                </h3>
                <span className="text-xs text-gray-400">({components.length})</span>
              </div>
              <div className="space-y-2">
                {components.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    onAdd={onAddComponent}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * サイドバーメインコンポーネント
 */
export function Sidebar({ onAddComponent }: SidebarProps) {
  const categories = getCategories();
  const totalComponents = getComponentCount();

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      {/* サイドバーヘッダー */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-bold text-gray-900">コンポーネント</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          {totalComponents}個のコンポーネントから選択
        </p>
      </div>

      {/* タブナビゲーション */}
      <Tabs defaultValue="all" className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-2">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="all" className="text-xs">すべて</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs">カテゴリ別</TabsTrigger>
          </TabsList>
        </div>

        {/* すべてのコンポーネント */}
        <TabsContent value="all" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <AllComponentsView onAddComponent={onAddComponent} />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* カテゴリ別 */}
        <TabsContent value="categories" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              {/* カテゴリボタングリッド */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {categories.map((category) => {
                  const Icon = CATEGORY_ICONS[category];
                  const colorClass = CATEGORY_COLORS[category];
                  const count = getComponentsByCategory(category).length;
                  return (
                    <button
                      key={category}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all`}
                      onClick={() => {
                        const element = document.getElementById(`category-${category}`);
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <div className={`rounded p-1.5 ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {CATEGORY_LABELS[category]}
                      </span>
                      <span className="text-xs text-gray-400">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* カテゴリセクション */}
              <div className="space-y-6">
                {categories.map((category) => (
                  <div key={category} id={`category-${category}`}>
                    <CategoryView category={category} onAddComponent={onAddComponent} />
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* サイドバーフッター */}
      <div className="border-t border-gray-200 bg-gray-50 p-3">
        <div className="text-xs text-gray-500">
          <p className="font-medium mb-1">ヒント:</p>
          <ul className="space-y-0.5 text-gray-400">
            <li>• クリックで追加</li>
            <li>• ドラッグで並び替え</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
