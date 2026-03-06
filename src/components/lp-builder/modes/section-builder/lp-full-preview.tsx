'use client';

/**
 * LP全体プレビューパネル
 * 全セクション画像を縦に積み上げてLPの全体像を確認できるスライドインパネル
 */

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink, ImageIcon } from 'lucide-react';
import { SectionBuilderSection } from '../../types';

interface LPFullPreviewProps {
  sections: SectionBuilderSection[];
  onClose: () => void;
  onExport: () => void;
}

export function LPFullPreview({ sections, onClose, onExport }: LPFullPreviewProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // パネル外クリックで閉じる
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const generatedCount = sections.filter((s) => s.imageUrl).length;
  const totalCount = sections.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* スライドインパネル */}
      <div
        ref={panelRef}
        className="flex h-full w-full max-w-2xl animate-in slide-in-from-right flex-col bg-white shadow-2xl duration-300"
      >
        {/* パネルヘッダー */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">LP全体プレビュー</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {generatedCount} / {totalCount} セクション生成済み
            </p>
          </div>
          <div className="flex items-center gap-2">
            {generatedCount > 0 && (
              <Button
                onClick={onExport}
                size="sm"
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                HTMLで保存
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* プレビュー進捗バー */}
        <div className="flex-shrink-0 bg-gray-50 px-6 py-2">
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${(generatedCount / totalCount) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-green-600">
              {Math.round((generatedCount / totalCount) * 100)}%
            </span>
          </div>
        </div>

        {/* LP プレビュー本体（スクロール可） */}
        <div className="flex-1 overflow-y-auto">
          {/* スマホ幅でLP表示するための中央カラム */}
          <div className="mx-auto max-w-[390px]">
            {sections.map((section, index) => (
              <LPSectionPreviewItem
                key={section.id}
                section={section}
                index={index}
              />
            ))}

            {/* 空の場合のメッセージ */}
            {generatedCount === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                <ExternalLink className="mb-3 h-10 w-10" />
                <p className="text-sm font-medium">まだ画像が生成されていません</p>
                <p className="mt-1 text-xs">各セクションで画像を生成するとここに表示されます</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------
// 各セクションのプレビューアイテム
// ------------------------------------------------
interface LPSectionPreviewItemProps {
  section: SectionBuilderSection;
  index: number;
}

function LPSectionPreviewItem({ section, index }: LPSectionPreviewItemProps) {
  if (section.imageUrl) {
    return (
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={section.imageUrl}
          alt={section.name}
          className="block w-full"
          style={{ display: 'block', margin: 0, padding: 0 }}
        />
        {/* セクションラベル（ホバー時表示） */}
        <div className="absolute left-2 top-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity hover:opacity-100">
          {String(index + 1).padStart(2, '0')} {section.name}
        </div>
      </div>
    );
  }

  // 未生成セクションのプレースホルダー
  return (
    <div className="flex aspect-video w-full items-center justify-center border-b border-dashed border-gray-200 bg-gray-50">
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <ImageIcon className="h-6 w-6" />
        <p className="text-xs">{section.name}（未生成）</p>
      </div>
    </div>
  );
}
