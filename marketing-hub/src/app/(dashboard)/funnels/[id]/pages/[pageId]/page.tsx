'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import { ArrowLeft, Save, Eye, Undo, Redo, Settings, Sparkles, MonitorSmartphone, Smartphone, Tablet, Monitor, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sidebar } from '@/components/lp-builder/sidebar';
import { Canvas } from '@/components/lp-builder/canvas';
import { PropertyPanel } from '@/components/lp-builder/property-panel';
import { BuilderMode, ComponentInstance, LPComponent, PreviewConfig } from '@/components/lp-builder/types';
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
  const router = useRouter();

  // ページデータ
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ビルダー状態
  const [mode, setMode] = useState<BuilderMode>('manual');
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [previewConfig, setPreviewConfig] = useState<PreviewConfig>({
    device: 'desktop',
    width: 1920,
    height: 1080,
  });

  // 履歴管理
  const [history, setHistory] = useState<ComponentInstance[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

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
      const content = Array.isArray(data.page.content) ? data.page.content : [];
      const componentInstances = content.map((item: { type: string; props: Record<string, unknown> }, index: number) => ({
        id: nanoid(),
        componentType: item.type,
        category: getCategoryFromType(item.type),
        order: index,
        props: item.props || {},
      }));

      setComponents(componentInstances);
      setHistory([componentInstances]);
      setHistoryIndex(0);
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

  // コンポーネント追加
  const handleAddComponent = useCallback(
    (component: LPComponent) => {
      const newInstance: ComponentInstance = {
        id: nanoid(),
        componentType: component.type,
        category: component.category,
        order: components.length,
        props: component.defaultProps.reduce(
          (acc, prop) => {
            acc[prop.key] = prop.value;
            return acc;
          },
          {} as Record<string, string | number | boolean>
        ),
      };

      const newComponents = [...components, newInstance];
      setComponents(newComponents);
      setSelectedComponentId(newInstance.id);

      // 履歴に追加
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newComponents);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      toast.success(`${component.name}を追加しました`);
    },
    [components, history, historyIndex]
  );

  // コンポーネント変更
  const handleComponentsChange = useCallback(
    (newComponents: ComponentInstance[]) => {
      setComponents(newComponents);

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newComponents);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  // プロパティ変更
  const handlePropertyChange = useCallback(
    (componentId: string, key: string, value: string | number | boolean) => {
      const newComponents = components.map((comp) =>
        comp.id === componentId
          ? {
              ...comp,
              props: {
                ...comp.props,
                [key]: value,
              },
            }
          : comp
      );
      setComponents(newComponents);

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newComponents);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [components, history, historyIndex]
  );

  // 元に戻す
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setComponents(history[newIndex]);
      toast.info('元に戻しました');
    }
  }, [history, historyIndex]);

  // やり直す
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setComponents(history[newIndex]);
      toast.info('やり直しました');
    }
  }, [history, historyIndex]);

  // 保存
  const handleSave = useCallback(async () => {
    if (!pageData) return;

    setIsSaving(true);
    try {
      // コンポーネントをコンテンツ形式に変換
      const content = components.map((comp) => ({
        type: comp.componentType,
        props: comp.props,
      }));

      const res = await fetch(`/api/funnels/${funnelId}/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error('Failed to save');
      toast.success('保存しました');
    } catch (error) {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [pageData, components, funnelId, pageId]);

  // プレビュー
  const handlePreview = useCallback(() => {
    window.open(`/preview/funnel/${funnelId}/${pageData?.slug}`, '_blank');
  }, [funnelId, pageData]);

  // デバイス変更
  const handleDeviceChange = useCallback((device: 'desktop' | 'tablet' | 'mobile') => {
    const configs = {
      desktop: { device, width: 1920, height: 1080 },
      tablet: { device, width: 768, height: 1024 },
      mobile: { device, width: 375, height: 667 },
    };
    setPreviewConfig(configs[device] as PreviewConfig);
  }, []);

  const selectedComponent = components.find((c) => c.id === selectedComponentId) || null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">ページが見つかりません</p>
        <Button asChild className="mt-4">
          <Link href={`/funnels/${funnelId}`}>ファネルに戻る</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-gray-50 -m-6">
      {/* トップバー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/funnels/${funnelId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{pageData.name}</h1>
            <p className="text-sm text-muted-foreground">/{pageData.slug}</p>
          </div>

          {/* モード切替 */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 ml-4">
            <Sparkles className={`h-4 w-4 ${mode === 'ai-assist' ? 'text-purple-600' : 'text-gray-400'}`} />
            <Label htmlFor="mode-toggle" className="cursor-pointer text-sm font-medium">
              AIアシスト
            </Label>
            <Switch
              id="mode-toggle"
              checked={mode === 'ai-assist'}
              onCheckedChange={(checked) => {
                setMode(checked ? 'ai-assist' : 'manual');
                toast.info(checked ? 'AIアシストモードを有効にしました' : '手動モードに切り替えました');
              }}
            />
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-2">
          {/* デバイスプレビュー */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MonitorSmartphone className="mr-2 h-4 w-4" />
                {previewConfig.device === 'desktop' && 'デスクトップ'}
                {previewConfig.device === 'tablet' && 'タブレット'}
                {previewConfig.device === 'mobile' && 'モバイル'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDeviceChange('desktop')}>
                <Monitor className="mr-2 h-4 w-4" />
                デスクトップ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeviceChange('tablet')}>
                <Tablet className="mr-2 h-4 w-4" />
                タブレット
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeviceChange('mobile')}>
                <Smartphone className="mr-2 h-4 w-4" />
                モバイル
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 履歴 */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex === 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          {/* プレビュー */}
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="mr-2 h-4 w-4" />
            プレビュー
          </Button>

          {/* 保存 */}
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <div className="w-80 flex-shrink-0">
          <Sidebar onAddComponent={handleAddComponent} />
        </div>

        {/* キャンバス */}
        <div className="flex-1">
          <Canvas
            components={components}
            selectedId={selectedComponentId}
            onComponentsChange={handleComponentsChange}
            onSelectComponent={setSelectedComponentId}
          />
        </div>

        {/* プロパティパネル */}
        <div className="w-96 flex-shrink-0">
          <PropertyPanel
            component={selectedComponent}
            onPropertyChange={handlePropertyChange}
            onClose={() => setSelectedComponentId(null)}
          />
        </div>
      </div>
    </div>
  );
}
