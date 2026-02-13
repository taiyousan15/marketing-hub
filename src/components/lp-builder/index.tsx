'use client';

/**
 * LP Builder メインコンポーネント
 * 3モード戦略のモードルーター
 * - AI Wizard: 初心者向け、質問に答えてLP自動生成
 * - Template: 中級者向け、テンプレート選択→インライン編集
 * - Advanced: 上級者向け、80+コンポーネントで自由構築
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Save,
  Download,
  Eye,
  Undo,
  Redo,
  Settings,
  MonitorSmartphone,
  Smartphone,
  Tablet,
  Monitor,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { LPBuilderProvider, useLPBuilder } from './context/lp-builder-context';
import { ModeSelector, CompactModeSelector } from './modes/mode-selector';
import { AdvancedMode } from './modes/advanced';
import { TemplateMode } from './modes/template';
import { AIWizardMode } from './modes/ai-wizard';
import { BuilderMode, ComponentInstance, BUILDER_MODE_LABELS } from './types';

export interface LPBuilderProps {
  /** 初期モード（省略時はモードセレクターを表示） */
  initialMode?: BuilderMode;
  /** 初期コンポーネント */
  initialComponents?: ComponentInstance[];
  /** カスタム保存関数 */
  onSave?: (components: ComponentInstance[]) => Promise<void>;
  /** ページタイトル */
  pageTitle?: string;
  /** ページサブタイトル（slug等） */
  pageSubtitle?: string;
  /** 戻るリンク先 */
  backUrl?: string;
  /** ファネルID */
  funnelId?: string;
  /** ページID */
  pageId?: string;
  /** モードセレクターをスキップするか */
  skipModeSelector?: boolean;
}

interface LPBuilderInnerProps {
  pageTitle?: string;
  pageSubtitle?: string;
  backUrl?: string;
  skipModeSelector?: boolean;
}

/**
 * LP Builder メインコンポーネント（内部）
 */
function LPBuilderInner({
  pageTitle,
  pageSubtitle,
  backUrl,
  skipModeSelector = false,
}: LPBuilderInnerProps) {
  const { state, actions } = useLPBuilder();
  // 既存コンテンツがある場合はモードセレクターをスキップしてAdvancedモードで開く
  const hasExistingContent = state.components.length > 0;
  const [showModeSelector, setShowModeSelector] = useState(!skipModeSelector && !hasExistingContent);

  // モード選択
  const handleSelectMode = useCallback((mode: BuilderMode) => {
    actions.setMode(mode);
    setShowModeSelector(false);
  }, [actions]);

  // モードセレクターに戻る
  const handleBackToModeSelector = useCallback(() => {
    if (skipModeSelector && backUrl) {
      // 外部リンクに戻る
      window.location.href = backUrl;
    } else {
      setShowModeSelector(true);
    }
  }, [skipModeSelector, backUrl]);

  // プレビューを開く
  const handlePreview = useCallback(() => {
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      const html = generatePreviewHTML(state.components);
      previewWindow.document.write(html);
      previewWindow.document.close();
    }
    toast.info('プレビューを開きました');
  }, [state.components]);

  // モードセレクター表示中
  if (showModeSelector) {
    return <ModeSelector onSelectMode={handleSelectMode} />;
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* トップバー */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* 戻るボタン */}
          {backUrl ? (
            <Button variant="ghost" size="sm" asChild className="flex-shrink-0 gap-2">
              <Link href={backUrl}>
                <ArrowLeft className="h-4 w-4" />
                戻る
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToModeSelector}
              className="flex-shrink-0 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
          )}

          <div className="hidden h-6 w-px bg-gray-200 sm:block" />

          {/* ページタイトル */}
          <div className="hidden min-w-0 sm:block">
            <h1 className="truncate text-lg font-bold text-gray-900">
              {pageTitle || 'LP Builder'}
            </h1>
            {pageSubtitle && (
              <p className="truncate text-xs text-muted-foreground">{pageSubtitle}</p>
            )}
          </div>

          {/* モードセレクター（コンパクト版） */}
          <CompactModeSelector
            currentMode={state.mode}
            onChangeMode={(mode) => actions.setMode(mode)}
          />
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-2">
          {/* デバイスプレビュー */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MonitorSmartphone className="mr-2 h-4 w-4" />
                {state.previewConfig.device === 'desktop' && 'デスクトップ'}
                {state.previewConfig.device === 'tablet' && 'タブレット'}
                {state.previewConfig.device === 'mobile' && 'モバイル'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => actions.setPreviewDevice('desktop')}>
                <Monitor className="mr-2 h-4 w-4" />
                デスクトップ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.setPreviewDevice('tablet')}>
                <Tablet className="mr-2 h-4 w-4" />
                タブレット
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.setPreviewDevice('mobile')}>
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
              onClick={actions.undo}
              disabled={state.historyIndex === 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={actions.redo}
              disabled={state.historyIndex === state.history.length - 1}
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
              <DropdownMenuItem onClick={() => actions.exportAs('html')}>
                HTML形式
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.exportAs('react')}>
                React形式
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.exportAs('json')}>
                JSON形式
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 保存 */}
          <Button onClick={actions.save} disabled={state.isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {state.isSaving ? '保存中...' : '保存'}
          </Button>

          {/* 設定 */}
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* メインコンテンツ（モードに応じて切り替え） */}
      {state.mode === 'advanced' && <AdvancedMode />}
      {state.mode === 'template' && <TemplateMode />}
      {state.mode === 'ai-wizard' && <AIWizardMode />}
    </div>
  );
}

/**
 * LP Builder メインコンポーネント
 */
export function LPBuilder({
  initialMode,
  initialComponents,
  onSave,
  pageTitle,
  pageSubtitle,
  backUrl,
  funnelId,
  pageId,
  skipModeSelector = false,
}: LPBuilderProps = {}) {
  return (
    <LPBuilderProvider
      initialMode={initialMode}
      initialComponents={initialComponents}
      onSave={onSave}
      pageTitle={pageTitle}
      funnelId={funnelId}
      pageId={pageId}
    >
      <LPBuilderInner
        pageTitle={pageTitle}
        pageSubtitle={pageSubtitle}
        backUrl={backUrl}
        skipModeSelector={skipModeSelector}
      />
    </LPBuilderProvider>
  );
}

/**
 * プレビュー用HTML生成
 */
function generatePreviewHTML(components: any[]): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LP プレビュー</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .component { padding: 0; }
    .component-with-padding { padding: 60px 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .full-width-image { width: 100%; display: block; }
  </style>
</head>
<body class="bg-white">
${components
  .map(
    (comp) => {
      // 画像コンポーネント
      if (comp.componentType === 'image' && comp.props.imageUrl) {
        return `
  <section class="component">
    <img src="${comp.props.imageUrl}" alt="${comp.props.alt || ''}" class="full-width-image" style="width: ${comp.props.width || '100%'}; margin: 0 auto; display: block;" />
  </section>`;
      }
      // テキストベースのコンポーネント
      return `
  <section class="component component-with-padding bg-white border-b">
    <div class="container">
      ${comp.props.headline ? `<h1 class="text-4xl font-bold mb-4">${comp.props.headline}</h1>` : ''}
      ${comp.props.logoText ? `<h1 class="text-2xl font-bold mb-4">${comp.props.logoText}</h1>` : ''}
      ${comp.props.subheadline ? `<p class="text-xl text-gray-600 mb-4">${comp.props.subheadline}</p>` : ''}
      ${comp.props.description ? `<p class="text-lg text-gray-600 mb-6">${comp.props.description}</p>` : ''}
      ${comp.props.ctaText ? `<button class="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700">${comp.props.ctaText}</button>` : ''}
      ${comp.props.buttonText ? `<button class="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700">${comp.props.buttonText}</button>` : ''}
    </div>
  </section>`;
    }
  )
  .join('\n')}
</body>
</html>`;
}

export default LPBuilder;
