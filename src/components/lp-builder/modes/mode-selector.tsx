'use client';

/**
 * LP Builder モードセレクター
 * 3モード（AI Wizard / Template / Advanced）の選択UI
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, FileText, Wrench, Layers, ArrowRight } from 'lucide-react';
import { BuilderMode, BUILDER_MODE_LABELS } from '../types';

interface ModeSelectorProps {
  onSelectMode: (mode: BuilderMode) => void;
}

interface ModeOption {
  mode: BuilderMode;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  features: string[];
  recommended?: boolean;
  level: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    mode: 'ai-wizard',
    icon: Sparkles,
    title: 'AIウィザード',
    description: 'AIが質問に答えてLPを自動生成',
    features: [
      '5つの質問に答えるだけ',
      'AIが最適なLPを自動生成',
      'プロのコピーライティング',
    ],
    recommended: true,
    level: '初心者向け',
  },
  {
    mode: 'template',
    icon: FileText,
    title: 'テンプレート',
    description: 'プロのテンプレートから選んで編集',
    features: [
      '10種類以上のテンプレート',
      'クリックで簡単編集',
      'すぐに公開可能',
    ],
    level: '中級者向け',
  },
  {
    mode: 'advanced',
    icon: Wrench,
    title: 'アドバンスド',
    description: '80+コンポーネントで自由に構築',
    features: [
      '80種類以上のコンポーネント',
      'ドラッグ&ドロップ',
      '完全カスタマイズ可能',
    ],
    level: '上級者向け',
  },
  {
    mode: 'section-builder',
    icon: Layers,
    title: 'セクションビルダー',
    description: '1セクションずつ画像を生成してLPを組み立て',
    features: [
      'セクションごとに画像生成',
      '参照画像でスタイル指定',
      '台本アップロード対応',
    ],
    level: 'AI画像特化',
  },
];

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-8">
      <div className="w-full max-w-5xl">
        {/* ヘッダー */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            ランディングページを作成
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            あなたのスキルレベルに合った方法を選択してください
          </p>
        </div>

        {/* モードカード */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {MODE_OPTIONS.map((option) => (
            <ModeCard
              key={option.mode}
              option={option}
              onSelect={() => onSelectMode(option.mode)}
            />
          ))}
        </div>

        {/* フッター */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            どのモードで作成しても、後から「アドバンスドで開く」で詳細編集できます
          </p>
        </div>
      </div>
    </div>
  );
}

interface ModeCardProps {
  option: ModeOption;
  onSelect: () => void;
}

function ModeCard({ option, onSelect }: ModeCardProps) {
  const Icon = option.icon;

  return (
    <Card
      className={`group relative cursor-pointer overflow-hidden transition-all hover:shadow-xl ${
        option.recommended
          ? 'border-2 border-purple-500 ring-2 ring-purple-200'
          : 'border border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      {/* 推奨バッジ */}
      {option.recommended && (
        <div className="absolute right-0 top-0">
          <div className="bg-purple-500 px-3 py-1 text-xs font-semibold text-white">
            おすすめ
          </div>
        </div>
      )}

      <div className="p-6">
        {/* アイコンとタイトル */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className={`rounded-xl p-3 ${
              option.recommended
                ? 'bg-purple-100'
                : option.mode === 'template'
                ? 'bg-blue-100'
                : option.mode === 'section-builder'
                ? 'bg-green-100'
                : 'bg-gray-100'
            }`}
          >
            <Icon
              className={`h-8 w-8 ${
                option.recommended
                  ? 'text-purple-600'
                  : option.mode === 'template'
                  ? 'text-blue-600'
                  : option.mode === 'section-builder'
                  ? 'text-green-600'
                  : 'text-gray-600'
              }`}
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{option.title}</h3>
            <Badge variant="secondary" className="mt-1 text-xs">
              {option.level}
            </Badge>
          </div>
        </div>

        {/* 説明 */}
        <p className="mb-6 text-gray-600">{option.description}</p>

        {/* 機能リスト */}
        <ul className="mb-6 space-y-2">
          {option.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
                  option.recommended
                    ? 'bg-purple-500'
                    : option.mode === 'template'
                    ? 'bg-blue-500'
                    : option.mode === 'section-builder'
                    ? 'bg-green-500'
                    : 'bg-gray-500'
                }`}
              >
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>

        {/* 選択ボタン */}
        <div
          className={`flex items-center justify-center gap-2 rounded-lg py-3 font-semibold transition-all ${
            option.recommended
              ? 'bg-purple-600 text-white group-hover:bg-purple-700'
              : option.mode === 'template'
              ? 'bg-blue-600 text-white group-hover:bg-blue-700'
              : option.mode === 'section-builder'
              ? 'bg-green-600 text-white group-hover:bg-green-700'
              : 'bg-gray-900 text-white group-hover:bg-gray-800'
          }`}
        >
          {option.mode === 'ai-wizard' && '✨ '}
          {option.mode === 'template' && '📄 '}
          {option.mode === 'advanced' && '🛠 '}
          {option.mode === 'section-builder' && '🖼 '}
          このモードで始める
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}

/**
 * コンパクトモードセレクター（ヘッダー用）
 */
interface CompactModeSelectorProps {
  currentMode: BuilderMode;
  onChangeMode: (mode: BuilderMode) => void;
}

export function CompactModeSelector({
  currentMode,
  onChangeMode,
}: CompactModeSelectorProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
      {MODE_OPTIONS.map((option) => (
        <button
          key={option.mode}
          onClick={() => onChangeMode(option.mode)}
          className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
            currentMode === option.mode
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <option.icon className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="hidden md:inline">{BUILDER_MODE_LABELS[option.mode]}</span>
        </button>
      ))}
    </div>
  );
}
