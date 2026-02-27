'use client';

/**
 * セクションビルダーモード — メインオーケストレーター
 *
 * フロー:
 *   1. SetupScreen  — LP種類・入力方法・デザインスタイルを選択
 *   2. SectionEditor — セクションを1枚ずつ編集・画像生成
 *   3. 完了後にLP全体プレビュー / アドバンスドモードへ
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { SectionBuilderSection } from '../../types';
import { SetupScreen, SetupConfig } from './setup-screen';
import { SectionList } from './section-list';
import { SectionEditor } from './section-editor';
import { createSectionsFromTemplate } from './section-templates';

type Phase = 'setup' | 'editing' | 'done';

export function SectionBuilderMode() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [config, setConfig] = useState<SetupConfig | null>(null);
  const [sections, setSections] = useState<SectionBuilderSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // ------------------------------------------------
  // セットアップ完了
  // ------------------------------------------------
  const handleStart = useCallback((cfg: SetupConfig) => {
    const newSections = createSectionsFromTemplate(cfg.lpType);

    // 台本モードの場合、テキストを単純に先頭セクションに配置
    // (本来はAIで各セクションに振り分けるが、ここでは手動入力に委ねる)
    if (cfg.inputMethod === 'script' && cfg.script) {
      const lines = cfg.script.split('\n\n').filter((l) => l.trim().length > 0);
      lines.forEach((line, i) => {
        if (newSections[i]) {
          newSections[i] = { ...newSections[i], content: line.trim() };
        }
      });
    }

    setConfig(cfg);
    setSections(newSections);
    setActiveSectionId(newSections[0]?.id ?? null);
    setPhase('editing');
  }, []);

  // ------------------------------------------------
  // セクション更新
  // ------------------------------------------------
  const handleUpdateSection = useCallback(
    (id: string, updates: Partial<SectionBuilderSection>) => {
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      );
    },
    [],
  );

  // ------------------------------------------------
  // セクションを「完了」にする
  // ------------------------------------------------
  const handleMarkDone = useCallback((id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'done' } : s)),
    );

    // 全セクション完了チェック
    setSections((prev) => {
      const allDone = prev.every((s) => (s.id === id ? true : s.status === 'done'));
      if (allDone) setPhase('done');
      return prev;
    });
  }, []);

  // ------------------------------------------------
  // ナビゲーション
  // ------------------------------------------------
  const activeIndex = sections.findIndex((s) => s.id === activeSectionId);

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) {
      setActiveSectionId(sections[activeIndex - 1].id);
    }
  }, [activeIndex, sections]);

  const handleNext = useCallback(() => {
    if (activeIndex < sections.length - 1) {
      setActiveSectionId(sections[activeIndex + 1].id);
    } else {
      // 最後のセクションを超えたら完了フェーズへ
      const allDone = sections.every((s) => s.status === 'done');
      if (allDone) setPhase('done');
    }
  }, [activeIndex, sections]);

  // ------------------------------------------------
  // HTML エクスポート
  // ------------------------------------------------
  const handleExport = useCallback(() => {
    const doneSections = sections.filter((s) => s.imageUrl);

    const html = buildExportHTML(doneSections);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'landing-page.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTMLをダウンロードしました');
  }, [sections]);

  // ------------------------------------------------
  // レンダリング
  // ------------------------------------------------
  if (phase === 'setup') {
    return <SetupScreen onStart={handleStart} />;
  }

  if (phase === 'done') {
    return (
      <DoneScreen
        sections={sections}
        onExport={handleExport}
        onEdit={() => {
          setActiveSectionId(sections[0]?.id ?? null);
          setPhase('editing');
        }}
      />
    );
  }

  const activeSection = sections.find((s) => s.id === activeSectionId) ?? sections[0];

  if (!activeSection || !config) return null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左: セクションリスト */}
      <div className="w-64 flex-shrink-0">
        <SectionList
          sections={sections}
          activeSectionId={activeSectionId}
          onSelectSection={setActiveSectionId}
        />
      </div>

      {/* 右: セクションエディター */}
      <div className="flex-1 overflow-hidden">
        <SectionEditor
          section={activeSection}
          sectionIndex={activeIndex}
          totalSections={sections.length}
          designStyleId={config.designStyleId}
          industry={config.industry}
          onUpdateSection={handleUpdateSection}
          onPrev={handlePrev}
          onNext={handleNext}
          onMarkDone={handleMarkDone}
        />
      </div>
    </div>
  );
}

// ------------------------------------------------
// 完了画面
// ------------------------------------------------
interface DoneScreenProps {
  sections: SectionBuilderSection[];
  onExport: () => void;
  onEdit: () => void;
}

function DoneScreen({ sections, onExport, onEdit }: DoneScreenProps) {
  const doneSections = sections.filter((s) => s.imageUrl);

  return (
    <div className="flex min-h-full flex-col items-center bg-gray-50 p-8">
      <div className="w-full max-w-3xl">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900">LPが完成しました！</h1>
          <p className="mt-2 text-gray-600">
            {doneSections.length}枚のセクション画像が生成されました
          </p>
        </div>

        {/* セクションプレビュー */}
        <div className="mb-8 space-y-4 rounded-xl border border-gray-200 bg-white p-4">
          {sections.map((section) => (
            <div key={section.id} className="flex items-center gap-4">
              {section.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={section.imageUrl}
                  alt={section.name}
                  className="h-16 w-28 flex-shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-28 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                  未生成
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{section.name}</p>
                {section.content && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">
                    {section.content}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={onExport}
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            HTMLでダウンロード
          </Button>
          <Button
            variant="outline"
            onClick={onEdit}
            className="flex-1 gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            編集に戻る
          </Button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------
// HTML エクスポートビルダー
// ------------------------------------------------
function buildExportHTML(sections: SectionBuilderSection[]): string {
  const bodyContent = sections
    .map((section) => {
      if (!section.imageUrl) return '';
      return `
  <section data-type="${section.type}" style="margin:0;padding:0;line-height:0;">
    <img src="${section.imageUrl}" alt="${section.name}" style="width:100%;display:block;max-width:100%;" />
  </section>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; }
    img { display: block; width: 100%; }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}
