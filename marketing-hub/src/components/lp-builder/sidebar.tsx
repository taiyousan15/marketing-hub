'use client';

/**
 * LP Builder サイドバーコンポーネント
 * コンポーネントライブラリを表示し、キャンバスへの追加を処理
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  LayoutPanelTop,
  Rocket,
  AlertCircle,
  Lightbulb,
  MessageSquare,
  Hand,
  Mail,
  DollarSign,
  ChevronDown,
  Timer,
  PanelBottom,
} from 'lucide-react';
import {
  COMPONENT_REGISTRY,
  CATEGORY_LABELS,
  getCategories,
  getComponentsByCategory,
} from './components-registry';
import { ComponentCategory, LPComponent } from './types';

interface SidebarProps {
  onAddComponent: (component: LPComponent) => void;
}

/**
 * カテゴリアイコンマッピング
 */
const CATEGORY_ICONS: Record<ComponentCategory, React.ComponentType<{ className?: string }>> = {
  header: LayoutPanelTop,
  hero: Rocket,
  problem: AlertCircle,
  solution: Lightbulb,
  testimonial: MessageSquare,
  cta: Hand,
  form: Mail,
  pricing: DollarSign,
  faq: ChevronDown,
  countdown: Timer,
  footer: PanelBottom,
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

  return (
    <Card className="group relative cursor-pointer overflow-hidden transition-all hover:shadow-lg">
      <button
        onClick={() => onAdd(component)}
        className="w-full text-left"
      >
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-2">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{component.name}</h4>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {CATEGORY_LABELS[component.category]}
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">{component.description}</p>

          {/* プロパティ数 */}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span>{component.defaultProps.length}個のプロパティ</span>
          </div>
        </div>

        {/* ホバーオーバーレイ */}
        <div className="absolute inset-0 flex items-center justify-center bg-blue-600 bg-opacity-0 transition-all group-hover:bg-opacity-90">
          <div className="translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
            <div className="flex items-center gap-2 text-white">
              <Plus className="h-5 w-5" />
              <span className="font-semibold">追加</span>
            </div>
          </div>
        </div>
      </button>
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

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 bg-white pb-2">
        <h3 className="text-sm font-semibold text-gray-500">
          {CATEGORY_LABELS[category]} ({components.length})
        </h3>
      </div>
      <div className="grid gap-3">
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
    <div className="space-y-6">
      {/* 検索バー */}
      <div className="sticky top-0 z-10 bg-white pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="コンポーネントを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* カテゴリ別リスト */}
      {filteredComponents.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-500">該当するコンポーネントが見つかりません</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredComponents.map(({ category, components }) => (
            <div key={category}>
              <div className="mb-3 flex items-center gap-2">
                {(() => {
                  const Icon = CATEGORY_ICONS[category];
                  return <Icon className="h-5 w-5 text-blue-600" />;
                })()}
                <h3 className="font-semibold text-gray-900">
                  {CATEGORY_LABELS[category]} ({components.length})
                </h3>
              </div>
              <div className="grid gap-3">
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

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      {/* サイドバーヘッダー */}
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900">コンポーネント</h2>
        <p className="mt-1 text-sm text-gray-500">
          80+のコンポーネントから選択
        </p>
      </div>

      {/* タブナビゲーション */}
      <Tabs defaultValue="all" className="flex flex-1 flex-col">
        <div className="border-b border-gray-200 px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">すべて</TabsTrigger>
            <TabsTrigger value="categories">カテゴリ別</TabsTrigger>
          </TabsList>
        </div>

        {/* すべてのコンポーネント */}
        <TabsContent value="all" className="mt-0 flex-1">
          <ScrollArea className="h-full">
            <div className="p-6">
              <AllComponentsView onAddComponent={onAddComponent} />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* カテゴリ別 */}
        <TabsContent value="categories" className="mt-0 flex-1">
          <ScrollArea className="h-full">
            <div className="p-6">
              <Tabs defaultValue={categories[0]} orientation="vertical" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 gap-1">
                  {categories.map((category) => {
                    const Icon = CATEGORY_ICONS[category];
                    return (
                      <TabsTrigger
                        key={category}
                        value={category}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {CATEGORY_LABELS[category]}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {categories.map((category) => (
                  <TabsContent key={category} value={category} className="mt-0">
                    <CategoryView category={category} onAddComponent={onAddComponent} />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* サイドバーフッター */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <div className="text-xs text-gray-500">
          <div className="mb-1 font-semibold">ヒント:</div>
          <ul className="space-y-1">
            <li>• コンポーネントをクリックして追加</li>
            <li>• キャンバスでドラッグ&ドロップで並び替え</li>
            <li>• 右パネルでプロパティを編集</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
