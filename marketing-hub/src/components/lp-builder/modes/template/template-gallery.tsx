'use client';

/**
 * テンプレートギャラリー
 * テンプレート一覧を表示し、選択を処理
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Eye, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LPTemplate, TemplateCategory, TEMPLATE_CATEGORY_LABELS } from '../../types';
import { LP_TEMPLATES } from './templates';

interface TemplateGalleryProps {
  onSelectTemplate: (template: LPTemplate) => void;
}

export function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<LPTemplate | null>(null);

  // フィルタリング
  const filteredTemplates = LP_TEMPLATES.filter((template) => {
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">テンプレートを選択</h2>
            <p className="mt-1 text-gray-600">
              プロがデザインした{LP_TEMPLATES.length}種類のテンプレートから選択
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* 検索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="テンプレートを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
          </div>
        </div>

        {/* カテゴリタブ */}
        <div className="mt-4">
          <Tabs
            value={activeCategory}
            onValueChange={(value) => setActiveCategory(value as TemplateCategory | 'all')}
          >
            <TabsList>
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="optin">オプトイン</TabsTrigger>
              <TabsTrigger value="sales">セールス</TabsTrigger>
              <TabsTrigger value="webinar">ウェビナー</TabsTrigger>
              <TabsTrigger value="launch">ローンチ</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* テンプレートグリッド */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {filteredTemplates.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-lg text-gray-600">該当するテンプレートが見つかりません</p>
              <Button variant="outline" className="mt-4" onClick={() => setSearchQuery('')}>
                検索をクリア
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => onSelectTemplate(template)}
                onPreview={() => setPreviewTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* プレビューモーダル */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSelect={() => {
            onSelectTemplate(previewTemplate);
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: LPTemplate;
  onSelect: () => void;
  onPreview: () => void;
}

function TemplateCard({ template, onSelect, onPreview }: TemplateCardProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-xl">
      {/* サムネイル */}
      <div className="relative aspect-[4/3] bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          {/* プレースホルダー画像 */}
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-4xl">📄</span>
            <span className="mt-2 text-sm font-medium text-gray-500">{template.name}</span>
          </div>
        </div>

        {/* ホバーオーバーレイ */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black bg-opacity-0 transition-all group-hover:bg-opacity-60">
          <Button
            variant="secondary"
            size="sm"
            className="translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            <Eye className="mr-1 h-4 w-4" />
            プレビュー
          </Button>
          <Button
            size="sm"
            className="translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100"
            onClick={onSelect}
          >
            使用する
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 情報 */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{template.name}</h3>
            <Badge variant="secondary" className="mt-1 text-xs">
              {TEMPLATE_CATEGORY_LABELS[template.category]}
            </Badge>
          </div>
          {template.popularity > 80 && (
            <Badge className="bg-orange-100 text-orange-700">人気</Badge>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{template.description}</p>

        {/* タグ */}
        <div className="mt-3 flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

interface TemplatePreviewModalProps {
  template: LPTemplate;
  onClose: () => void;
  onSelect: () => void;
}

function TemplatePreviewModal({ template, onClose, onSelect }: TemplatePreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
            <p className="text-gray-600">{template.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              閉じる
            </Button>
            <Button onClick={onSelect}>
              このテンプレートを使用
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* プレビュー */}
        <div className="h-[60vh] overflow-y-auto bg-gray-100 p-6">
          <div className="mx-auto max-w-3xl rounded-lg bg-white shadow-lg">
            {template.components.map((comp, index) => (
              <div key={index} className="border-b border-gray-100 p-8">
                <div className="text-sm font-medium text-gray-400 mb-2">
                  {comp.category}
                </div>
                {comp.props.headline && (
                  <h2 className="text-2xl font-bold text-gray-900">{String(comp.props.headline)}</h2>
                )}
                {comp.props.description && (
                  <p className="mt-2 text-gray-600">{String(comp.props.description)}</p>
                )}
                {comp.props.ctaText && (
                  <button className="mt-4 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white">
                    {String(comp.props.ctaText)}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
