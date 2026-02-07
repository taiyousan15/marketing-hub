'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { Loader2 } from 'lucide-react';
import { LPBuilder } from '@/components/lp-builder';
import { ComponentInstance } from '@/components/lp-builder/types';
import { toast } from 'sonner';

interface PageData {
  id: string;
  name: string;
  slug: string;
  content: ComponentInstance[];
  funnelId: string;
}

export default function PageEditorPage({
  params,
}: {
  params: Promise<{ id: string; pageId: string }>;
}) {
  const { id: funnelId, pageId } = use(params);

  // ページデータ
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialComponents, setInitialComponents] = useState<ComponentInstance[]>([]);

  // ページデータを取得
  useEffect(() => {
    fetchPageData();
  }, [pageId]);

  const fetchPageData = async () => {
    try {
      const res = await fetch(`/api/funnels/${funnelId}/pages/${pageId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPageData(data.page);

      // コンテンツをコンポーネントに変換
      // 保存形式は2種類:
      // 1. 旧形式: { type, props }
      // 2. 新形式: { id, componentType, category, order, props }
      const content = Array.isArray(data.page.content) ? data.page.content : [];
      const componentInstances = content.map((item: ComponentInstance | { type: string; props: Record<string, unknown> }, index: number) => {
        // 新形式（componentType がある）の場合はそのまま使用
        if ('componentType' in item && item.componentType) {
          return {
            id: item.id || nanoid(),
            componentType: item.componentType,
            category: item.category || getCategoryFromType(item.componentType),
            order: item.order ?? index,
            props: item.props || {},
          } as ComponentInstance;
        }
        // 旧形式（type がある）の場合は変換
        const oldItem = item as { type: string; props: Record<string, unknown> };
        return {
          id: nanoid(),
          componentType: oldItem.type,
          category: getCategoryFromType(oldItem.type),
          order: index,
          props: oldItem.props || {},
        } as ComponentInstance;
      });

      setInitialComponents(componentInstances);
    } catch (error) {
      toast.error('ページの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // コンポーネントタイプからカテゴリを取得
  const getCategoryFromType = (type: string): string => {
    const categoryMap: Record<string, string> = {
      'header': 'header',
      'hero': 'hero',
      'problem': 'problem',
      'solution': 'solution',
      'testimonial': 'testimonials',
      'cta': 'cta',
      'form': 'form',
      'pricing': 'pricing',
      'faq': 'faq',
      'countdown': 'countdown',
      'footer': 'footer',
    };

    for (const [key, category] of Object.entries(categoryMap)) {
      if (type.includes(key)) return category;
    }
    return 'content';
  };

  // 保存処理
  const handleSave = useCallback(async (components: ComponentInstance[]) => {
    // コンポーネントをそのまま保存（新形式）
    const content = components.map((comp, index) => ({
      id: comp.id,
      componentType: comp.componentType,
      category: comp.category,
      order: index,
      props: comp.props,
    }));

    const res = await fetch(`/api/funnels/${funnelId}/pages/${pageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) throw new Error('Failed to save');
  }, [funnelId, pageId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">ページが見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-6 h-[calc(100vh-64px)]">
      <LPBuilder
        initialComponents={initialComponents}
        onSave={handleSave}
        pageTitle={pageData.name}
        pageSubtitle={`/${pageData.slug}`}
        backUrl={`/funnels/${funnelId}`}
        funnelId={funnelId}
        pageId={pageId}
      />
    </div>
  );
}
