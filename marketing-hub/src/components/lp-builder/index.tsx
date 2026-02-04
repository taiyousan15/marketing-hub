'use client';

/**
 * LP Builder メインコンポーネント
 * 手動モード + AIアシストモードのビジュアルLPビルダー
 */

import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Save,
  Download,
  Eye,
  Undo,
  Redo,
  Settings,
  Sparkles,
  MonitorSmartphone,
  Smartphone,
  Tablet,
  Monitor,
  HelpCircle,
} from 'lucide-react';
import { Sidebar } from './sidebar';
import { Canvas } from './canvas';
import { PropertyPanel } from './property-panel';
import { BuilderMode, ComponentInstance, LPComponent, PreviewConfig } from './types';
import { toast } from 'sonner';

/**
 * LP Builder メインコンポーネント
 */
export function LPBuilder() {
  // ビルダー状態
  const [mode, setMode] = useState<BuilderMode>('manual');
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [previewConfig, setPreviewConfig] = useState<PreviewConfig>({
    device: 'desktop',
    width: 1920,
    height: 1080,
  });

  // 履歴管理（簡易版）
  const [history, setHistory] = useState<ComponentInstance[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  /**
   * コンポーネント追加
   */
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

  /**
   * コンポーネント変更
   */
  const handleComponentsChange = useCallback(
    (newComponents: ComponentInstance[]) => {
      setComponents(newComponents);

      // 履歴に追加
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newComponents);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  /**
   * プロパティ変更
   */
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

      // 履歴に追加（頻繁すぎるので省略可能）
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newComponents);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [components, history, historyIndex]
  );

  /**
   * 元に戻す
   */
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setComponents(history[newIndex]);
      toast.info('元に戻しました');
    }
  }, [history, historyIndex]);

  /**
   * やり直す
   */
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setComponents(history[newIndex]);
      toast.info('やり直しました');
    }
  }, [history, historyIndex]);

  /**
   * 保存
   */
  const handleSave = useCallback(() => {
    // 実際の実装ではAPIに保存
    const lpData = {
      id: nanoid(),
      name: 'マイLP',
      mode,
      components,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('保存データ:', lpData);
    localStorage.setItem('lp-builder-draft', JSON.stringify(lpData));
    toast.success('保存しました');
  }, [mode, components]);

  /**
   * エクスポート
   */
  const handleExport = useCallback(
    (format: 'html' | 'react' | 'json') => {
      const data = {
        mode,
        components,
        exportedAt: new Date().toISOString(),
      };

      let content = '';
      let filename = '';
      let mimeType = '';

      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          filename = 'landing-page.json';
          mimeType = 'application/json';
          break;
        case 'html':
          content = generateHTML(components);
          filename = 'landing-page.html';
          mimeType = 'text/html';
          break;
        case 'react':
          content = generateReact(components);
          filename = 'LandingPage.tsx';
          mimeType = 'text/plain';
          break;
      }

      // ダウンロード
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()}形式でエクスポートしました`);
    },
    [mode, components]
  );

  /**
   * プレビュー
   */
  const handlePreview = useCallback(() => {
    // 新しいウィンドウでプレビューを開く
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(generateHTML(components));
      previewWindow.document.close();
    }
    toast.info('プレビューを開きました');
  }, [components]);

  /**
   * デバイス変更
   */
  const handleDeviceChange = useCallback((device: 'desktop' | 'tablet' | 'mobile') => {
    const configs = {
      desktop: { device, width: 1920, height: 1080 },
      tablet: { device, width: 768, height: 1024 },
      mobile: { device, width: 375, height: 667 },
    };
    setPreviewConfig(configs[device] as PreviewConfig);
  }, []);

  /**
   * AI画像生成（NanoBanana Pro連携）
   */
  const handleAiGenerateImage = useCallback(async (prompt: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '画像生成に失敗しました');
      }

      return data.url;
    } catch (err) {
      console.error('AI image generation error:', err);
      toast.error(err instanceof Error ? err.message : '画像生成に失敗しました');
      return null;
    }
  }, []);

  const selectedComponent = components.find((c) => c.id === selectedComponentId) || null;
  const isAiAssistEnabled = mode === 'ai-assist';

  // Debug: Check mode and isAiAssistEnabled
  console.log('LPBuilder mode:', mode, 'isAiAssistEnabled:', isAiAssistEnabled);

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* トップバー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">LP Builder</h1>

          {/* モード切替 */}
          <TooltipProvider>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <Sparkles className={`h-4 w-4 ${mode === 'ai-assist' ? 'text-purple-600' : 'text-gray-400'}`} />
              <Label htmlFor="mode-toggle" className="cursor-pointer text-sm font-medium">
                AIアシスト
              </Label>
              <Switch
                id="mode-toggle"
                checked={mode === 'ai-assist'}
                onCheckedChange={(checked) => {
                  setMode(checked ? 'ai-assist' : 'manual');
                  toast.info(
                    checked
                      ? 'AIアシストモード有効: 画像アップロード時にAI生成タブが使えます'
                      : '手動モードに切り替えました'
                  );
                }}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">AIアシスト機能</p>
                  <ul className="text-xs space-y-1">
                    <li>• 画像プロパティでAI生成タブが有効に</li>
                    <li>• NanoBanana Proで画像を自動生成</li>
                    <li>• プロンプトを入力するだけでOK</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
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

          {/* エクスポート */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                エクスポート
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('html')}>
                HTML形式
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('react')}>
                React形式
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                JSON形式
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 保存 */}
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>

          {/* 設定 */}
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
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
            aiAssistEnabled={isAiAssistEnabled}
            onAiGenerateImage={handleAiGenerateImage}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * HTML生成（簡易版）
 */
function generateHTML(components: ComponentInstance[]): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ランディングページ</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: sans-serif; line-height: 1.6; }
    .component { padding: 60px 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { font-size: 1.25rem; margin-bottom: 1rem; }
    button { padding: 16px 32px; font-size: 1.125rem; cursor: pointer; }
  </style>
</head>
<body>
${components
  .map(
    (comp) => `
  <section class="component">
    <div class="container">
      <h1>${comp.props.headline || comp.props.logoText || ''}</h1>
      <p>${comp.props.description || comp.props.subheadline || ''}</p>
      ${comp.props.ctaText || comp.props.buttonText ? `<button>${comp.props.ctaText || comp.props.buttonText}</button>` : ''}
    </div>
  </section>
`
  )
  .join('\n')}
</body>
</html>`;
}

/**
 * React生成（簡易版）
 */
function generateReact(components: ComponentInstance[]): string {
  return `import React from 'react';

export function LandingPage() {
  return (
    <div>
${components
  .map(
    (comp) => `
      <section className="component">
        <div className="container">
          <h1>${comp.props.headline || comp.props.logoText || ''}</h1>
          <p>${comp.props.description || comp.props.subheadline || ''}</p>
          ${comp.props.ctaText || comp.props.buttonText ? `<button>${comp.props.ctaText || comp.props.buttonText}</button>` : ''}
        </div>
      </section>
`
  )
  .join('\n')}
    </div>
  );
}

export default LandingPage;`;
}
