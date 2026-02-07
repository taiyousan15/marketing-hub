'use client';

/**
 * LP Builder コンテキスト
 * 3モード戦略の共有状態管理
 */

import { createContext, useContext, useCallback, useState, ReactNode, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import {
  BuilderMode,
  ComponentInstance,
  LPComponent,
  LPBuilderContextType,
  LPBuilderState,
  LPBuilderActions,
  PreviewConfig,
  WizardAnswers,
  WizardState,
  TemplateState,
  LPTemplate,
  EditableField,
  ExportFormat,
} from '../types';

const initialWizardState: WizardState = {
  step: 0,
  totalSteps: 5,
  answers: {},
  generatedLP: null,
  isGenerating: false,
  error: null,
};

const initialTemplateState: TemplateState = {
  selectedTemplate: null,
  editedComponents: [],
  editingField: null,
  hasChanges: false,
};

const initialState: LPBuilderState = {
  mode: 'advanced',
  components: [],
  selectedComponentId: null,
  previewConfig: {
    device: 'desktop',
    width: 1920,
    height: 1080,
  },
  history: [[]],
  historyIndex: 0,
  wizardState: initialWizardState,
  templateState: initialTemplateState,
  isSaving: false,
  lastSaved: null,
};

const LPBuilderContext = createContext<LPBuilderContextType | null>(null);

export function useLPBuilder() {
  const context = useContext(LPBuilderContext);
  if (!context) {
    throw new Error('useLPBuilder must be used within LPBuilderProvider');
  }
  return context;
}

interface LPBuilderProviderProps {
  children: ReactNode;
  initialMode?: BuilderMode;
  initialComponents?: ComponentInstance[];
  onSave?: (components: ComponentInstance[]) => Promise<void>;
  pageTitle?: string;
  funnelId?: string;
  pageId?: string;
}

export function LPBuilderProvider({
  children,
  initialMode = 'advanced',
  initialComponents = [],
  onSave,
  pageTitle,
  funnelId,
  pageId,
}: LPBuilderProviderProps) {
  const [state, setState] = useState<LPBuilderState>({
    ...initialState,
    mode: initialMode,
    components: initialComponents,
    history: [initialComponents],
  });

  // 外部保存関数を保持
  const externalSave = onSave;

  // ヘルパー: 履歴に追加
  const addToHistory = useCallback((newComponents: ComponentInstance[]) => {
    setState((prev) => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newComponents);
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  // モード切替
  const setMode = useCallback((mode: BuilderMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  // コンポーネント追加
  const addComponent = useCallback(
    (component: LPComponent) => {
      const newInstance: ComponentInstance = {
        id: nanoid(),
        componentType: component.type,
        category: component.category,
        order: state.components.length,
        props: component.defaultProps.reduce(
          (acc, prop) => {
            acc[prop.key] = prop.value;
            return acc;
          },
          {} as Record<string, string | number | boolean>
        ),
      };

      const newComponents = [...state.components, newInstance];
      setState((prev) => ({
        ...prev,
        components: newComponents,
        selectedComponentId: newInstance.id,
      }));
      addToHistory(newComponents);
      toast.success(`${component.name}を追加しました`);
    },
    [state.components, addToHistory]
  );

  // コンポーネント更新
  const updateComponent = useCallback(
    (componentId: string, key: string, value: string | number | boolean) => {
      const newComponents = state.components.map((comp) =>
        comp.id === componentId
          ? { ...comp, props: { ...comp.props, [key]: value } }
          : comp
      );
      setState((prev) => ({ ...prev, components: newComponents }));
      addToHistory(newComponents);
    },
    [state.components, addToHistory]
  );

  // コンポーネント削除
  const deleteComponent = useCallback(
    (componentId: string) => {
      const newComponents = state.components
        .filter((c) => c.id !== componentId)
        .map((comp, idx) => ({ ...comp, order: idx }));
      setState((prev) => ({
        ...prev,
        components: newComponents,
        selectedComponentId: prev.selectedComponentId === componentId ? null : prev.selectedComponentId,
      }));
      addToHistory(newComponents);
      toast.info('コンポーネントを削除しました');
    },
    [state.components, addToHistory]
  );

  // コンポーネント並び替え
  const reorderComponents = useCallback(
    (newComponents: ComponentInstance[]) => {
      setState((prev) => ({ ...prev, components: newComponents }));
      addToHistory(newComponents);
    },
    [addToHistory]
  );

  // コンポーネント選択
  const selectComponent = useCallback((componentId: string | null) => {
    setState((prev) => ({ ...prev, selectedComponentId: componentId }));
  }, []);

  // コンポーネントクリア
  const clearComponents = useCallback(() => {
    setState((prev) => ({
      ...prev,
      components: [],
      selectedComponentId: null,
    }));
    addToHistory([]);
  }, [addToHistory]);

  // 元に戻す
  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        return {
          ...prev,
          components: prev.history[newIndex],
          historyIndex: newIndex,
        };
      }
      return prev;
    });
    toast.info('元に戻しました');
  }, []);

  // やり直し
  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        return {
          ...prev,
          components: prev.history[newIndex],
          historyIndex: newIndex,
        };
      }
      return prev;
    });
    toast.info('やり直しました');
  }, []);

  // プレビューデバイス変更
  const setPreviewDevice = useCallback((device: 'desktop' | 'tablet' | 'mobile') => {
    const configs: Record<string, PreviewConfig> = {
      desktop: { device: 'desktop', width: 1920, height: 1080 },
      tablet: { device: 'tablet', width: 768, height: 1024 },
      mobile: { device: 'mobile', width: 375, height: 667 },
    };
    setState((prev) => ({ ...prev, previewConfig: configs[device] }));
  }, []);

  // ウィザード: 回答設定
  const setWizardAnswer = useCallback(
    (key: keyof WizardAnswers, value: string | string[]) => {
      setState((prev) => ({
        ...prev,
        wizardState: {
          ...prev.wizardState,
          answers: { ...prev.wizardState.answers, [key]: value },
        },
      }));
    },
    []
  );

  // ウィザード: 次のステップ
  const nextWizardStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      wizardState: {
        ...prev.wizardState,
        step: Math.min(prev.wizardState.step + 1, prev.wizardState.totalSteps - 1),
      },
    }));
  }, []);

  // ウィザード: 前のステップ
  const prevWizardStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      wizardState: {
        ...prev.wizardState,
        step: Math.max(prev.wizardState.step - 1, 0),
      },
    }));
  }, []);

  // ウィザード: LP生成
  const generateLPFromWizard = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      wizardState: { ...prev.wizardState, isGenerating: true, error: null },
    }));

    try {
      const response = await fetch('/api/ai/lp-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: state.wizardState.answers }),
      });

      if (!response.ok) {
        throw new Error('LP生成に失敗しました');
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        wizardState: {
          ...prev.wizardState,
          generatedLP: data.components,
          isGenerating: false,
        },
        components: data.components,
      }));

      toast.success('LPを生成しました');
    } catch (error) {
      setState((prev) => ({
        ...prev,
        wizardState: {
          ...prev.wizardState,
          isGenerating: false,
          error: error instanceof Error ? error.message : '生成エラー',
        },
      }));
      toast.error('LP生成に失敗しました');
    }
  }, [state.wizardState.answers]);

  // ウィザード: リセット
  const resetWizard = useCallback(() => {
    setState((prev) => ({
      ...prev,
      wizardState: initialWizardState,
    }));
  }, []);

  // テンプレート: 選択
  const selectTemplate = useCallback((template: LPTemplate) => {
    setState((prev) => ({
      ...prev,
      templateState: {
        ...prev.templateState,
        selectedTemplate: template,
        editedComponents: template.components.map((c) => ({ ...c, id: nanoid() })),
        hasChanges: false,
      },
    }));
  }, []);

  // テンプレート: コンポーネント更新
  const updateTemplateComponent = useCallback(
    (componentId: string, key: string, value: string) => {
      setState((prev) => ({
        ...prev,
        templateState: {
          ...prev.templateState,
          editedComponents: prev.templateState.editedComponents.map((comp) =>
            comp.id === componentId
              ? { ...comp, props: { ...comp.props, [key]: value } }
              : comp
          ),
          hasChanges: true,
        },
      }));
    },
    []
  );

  // テンプレート: フィールド編集開始
  const startEditingField = useCallback((field: EditableField) => {
    setState((prev) => ({
      ...prev,
      templateState: { ...prev.templateState, editingField: field },
    }));
  }, []);

  // テンプレート: フィールド編集終了
  const stopEditingField = useCallback(() => {
    setState((prev) => ({
      ...prev,
      templateState: { ...prev.templateState, editingField: null },
    }));
  }, []);

  // テンプレート: 適用
  const applyTemplate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      components: prev.templateState.editedComponents,
      mode: 'advanced',
    }));
    addToHistory(state.templateState.editedComponents);
    toast.success('テンプレートを適用しました');
  }, [state.templateState.editedComponents, addToHistory]);

  // 保存
  const save = useCallback(async () => {
    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      // 外部保存関数があれば使用
      if (externalSave) {
        await externalSave(state.components);
      } else {
        // ローカルストレージに保存（フォールバック）
        const lpData = {
          id: nanoid(),
          name: pageTitle || 'マイLP',
          mode: state.mode,
          components: state.components,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        localStorage.setItem('lp-builder-draft', JSON.stringify(lpData));
      }

      setState((prev) => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
      }));
      toast.success('保存しました');
    } catch {
      setState((prev) => ({ ...prev, isSaving: false }));
      toast.error('保存に失敗しました');
    }
  }, [state.mode, state.components, externalSave, pageTitle]);

  // エクスポート
  const exportAs = useCallback(
    (format: ExportFormat) => {
      const data = {
        mode: state.mode,
        components: state.components,
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
          content = generateHTML(state.components);
          filename = 'landing-page.html';
          mimeType = 'text/html';
          break;
        case 'react':
          content = generateReact(state.components);
          filename = 'LandingPage.tsx';
          mimeType = 'text/plain';
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()}形式でエクスポートしました`);
    },
    [state.mode, state.components]
  );

  // アドバンスドモードで開く
  const openAdvancedMode = useCallback(() => {
    setState((prev) => {
      const components =
        prev.mode === 'template'
          ? prev.templateState.editedComponents
          : prev.wizardState.generatedLP || prev.components;

      return {
        ...prev,
        mode: 'advanced',
        components,
      };
    });
  }, []);

  const actions: LPBuilderActions = useMemo(
    () => ({
      setMode,
      addComponent,
      updateComponent,
      deleteComponent,
      reorderComponents,
      selectComponent,
      clearComponents,
      undo,
      redo,
      setPreviewDevice,
      setWizardAnswer,
      nextWizardStep,
      prevWizardStep,
      generateLPFromWizard,
      resetWizard,
      selectTemplate,
      updateTemplateComponent,
      startEditingField,
      stopEditingField,
      applyTemplate,
      save,
      exportAs,
      openAdvancedMode,
    }),
    [
      setMode,
      addComponent,
      updateComponent,
      deleteComponent,
      reorderComponents,
      selectComponent,
      clearComponents,
      undo,
      redo,
      setPreviewDevice,
      setWizardAnswer,
      nextWizardStep,
      prevWizardStep,
      generateLPFromWizard,
      resetWizard,
      selectTemplate,
      updateTemplateComponent,
      startEditingField,
      stopEditingField,
      applyTemplate,
      save,
      exportAs,
      openAdvancedMode,
    ]
  );

  const contextValue = useMemo(
    () => ({ state, actions }),
    [state, actions]
  );

  return (
    <LPBuilderContext.Provider value={contextValue}>
      {children}
    </LPBuilderContext.Provider>
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
