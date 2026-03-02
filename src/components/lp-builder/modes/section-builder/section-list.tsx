'use client';

/**
 * セクションビルダー — セクションリスト（左サイドバー）
 * 全セクションの一覧と進捗状態を表示する
 */

import { CheckCircle2, Circle, Loader2, Pencil, Image as ImageIcon, MonitorPlay } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionBuilderSection } from '../../types';

interface SectionListProps {
  sections: SectionBuilderSection[];
  activeSectionId: string | null;
  onSelectSection: (id: string) => void;
  onShowFullPreview?: () => void;
  generatedCount?: number;
}

const STATUS_CONFIG = {
  pending: {
    icon: Circle,
    color: 'text-gray-400',
    bg: 'bg-gray-50',
    label: '未着手',
  },
  editing: {
    icon: Pencil,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    label: '編集中',
  },
  generating: {
    icon: Loader2,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
    label: '生成中',
  },
  done: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-50',
    label: '完了',
  },
};

export function SectionList({
  sections,
  activeSectionId,
  onSelectSection,
  onShowFullPreview,
  generatedCount = 0,
}: SectionListProps) {
  const doneCount = sections.filter((s) => s.status === 'done').length;
  const progress = sections.length > 0 ? Math.round((doneCount / sections.length) * 100) : 0;

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 px-4 py-4">
        <h2 className="font-bold text-gray-900">セクション一覧</h2>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
            <span>進捗</span>
            <span className="font-semibold text-green-600">
              {doneCount}/{sections.length}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* セクションリスト */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section, index) => {
          const cfg = STATUS_CONFIG[section.status];
          const StatusIcon = cfg.icon;
          const isActive = section.id === activeSectionId;

          return (
            <button
              key={section.id}
              onClick={() => onSelectSection(section.id)}
              className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-green-50 border-l-4 border-l-green-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* ステータスアイコン */}
                <div className="mt-0.5 flex-shrink-0">
                  <StatusIcon
                    className={`h-4 w-4 ${cfg.color} ${
                      section.status === 'generating' ? 'animate-spin' : ''
                    }`}
                  />
                </div>

                {/* セクション情報 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        isActive ? 'text-green-700' : 'text-gray-800'
                      }`}
                    >
                      {section.name}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                    {section.description}
                  </p>

                  {/* サムネイルとテキスト状態 */}
                  <div className="mt-1.5 flex items-center gap-2">
                    {section.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={section.imageUrl}
                        alt={section.name}
                        className="h-8 w-14 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-14 items-center justify-center rounded bg-gray-100">
                        <ImageIcon className="h-3 w-3 text-gray-400" />
                      </div>
                    )}
                    {section.content && (
                      <span className="truncate text-xs text-gray-500">
                        {section.content.slice(0, 30)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* フッター */}
      <div className="border-t border-gray-200 px-4 py-3 space-y-2">
        {onShowFullPreview && (
          <Button
            variant="outline"
            size="sm"
            onClick={onShowFullPreview}
            disabled={generatedCount === 0}
            className="w-full gap-2 text-xs"
          >
            <MonitorPlay className="h-3.5 w-3.5" />
            LP全体を見る
            {generatedCount > 0 && (
              <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-green-700">
                {generatedCount}
              </span>
            )}
          </Button>
        )}
        {generatedCount === 0 && (
          <p className="text-center text-xs text-gray-400">
            画像を生成するとLP全体を確認できます
          </p>
        )}
      </div>
    </div>
  );
}
