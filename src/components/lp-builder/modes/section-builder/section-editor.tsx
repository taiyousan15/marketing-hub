'use client';

/**
 * セクションビルダー — セクションエディター（右パネル）
 * 1セクション分の内容入力・参照画像アップロード・画像生成を担当
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { SectionBuilderSection } from '../../types';
import { getSectionAspectRatio } from './section-templates';

interface SectionEditorProps {
  section: SectionBuilderSection;
  sectionIndex: number;
  totalSections: number;
  designStyleId: string;
  industry: string;
  onUpdateSection: (id: string, updates: Partial<SectionBuilderSection>) => void;
  onPrev: () => void;
  onNext: () => void;
  onMarkDone: (id: string) => void;
}

export function SectionEditor({
  section,
  sectionIndex,
  totalSections,
  designStyleId,
  industry,
  onUpdateSection,
  onPrev,
  onNext,
  onMarkDone,
}: SectionEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatio = getSectionAspectRatio(section.type);

  // ------------------------------------------------
  // 参照画像のアップロード
  // ------------------------------------------------
  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = String(ev.target?.result ?? '');
      onUpdateSection(section.id, {
        referenceImageBase64: base64,
        referenceImageName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReferenceImage = () => {
    onUpdateSection(section.id, {
      referenceImageBase64: null,
      referenceImageName: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ------------------------------------------------
  // 画像生成
  // ------------------------------------------------
  const handleGenerateImage = async () => {
    setIsGenerating(true);
    setError(null);
    onUpdateSection(section.id, { status: 'generating' });

    try {
      const res = await fetch('/api/ai/section-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionType: section.type,
          content: section.content,
          designStyleId,
          industry: industry || undefined,
          aspectRatio,
          referenceImageBase64: section.referenceImageBase64 || undefined,
          customPrompt: section.imagePrompt || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { imageUrl: string; provider?: string };
      onUpdateSection(section.id, {
        imageUrl: data.imageUrl,
        status: 'editing',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '画像生成に失敗しました';
      setError(msg);
      onUpdateSection(section.id, { status: 'editing' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkDone = () => {
    onMarkDone(section.id);
    onNext();
  };

  const isDone = section.status === 'done';
  const generating = isGenerating || section.status === 'generating';

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      {/* ヘッダー */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {sectionIndex + 1} / {totalSections}
            </span>
            <h2 className="text-lg font-bold text-gray-900">{section.name}</h2>
            {isDone && (
              <Badge className="gap-1 bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3" />
                完了
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-600">{section.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={sectionIndex === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={sectionIndex === totalSections - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* 左列: 入力エリア */}
        <div className="flex w-1/2 flex-col overflow-y-auto border-r border-gray-200 bg-white p-6">
          {/* コンテンツ入力 */}
          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              セクションの内容
            </label>
            <textarea
              value={section.content}
              onChange={(e) =>
                onUpdateSection(section.id, { content: e.target.value, status: 'editing' })
              }
              placeholder={`このセクションの内容を入力してください。\n\n例: ヘッドライン、本文、キャッチフレーズなど`}
              rows={8}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm leading-relaxed focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* 画像プロンプト（詳細設定） */}
          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              画像プロンプト（任意）
            </label>
            <input
              type="text"
              value={section.imagePrompt}
              onChange={(e) =>
                onUpdateSection(section.id, { imagePrompt: e.target.value })
              }
              placeholder="空欄にするとAIが自動でプロンプトを生成します"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              英語で入力すると画像に文字が入らず、きれいな仕上がりになります
            </p>
          </div>

          {/* 参照画像 */}
          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              参照画像（任意）
            </label>
            <p className="mb-2 text-xs text-gray-500">
              スタイルや構図の参考画像をアップロードすると、近いイメージで生成されます
            </p>

            {section.referenceImageBase64 ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={section.referenceImageBase64}
                  alt="参照画像"
                  className="h-32 w-auto rounded-lg border border-gray-200 object-cover"
                />
                <button
                  onClick={handleRemoveReferenceImage}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="mt-1 text-xs text-gray-500">{section.referenceImageName}</p>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-green-400 hover:bg-green-50 hover:text-green-700">
                <Upload className="h-4 w-4" />
                画像をアップロード
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReferenceImageUpload}
                />
              </label>
            )}
          </div>
        </div>

        {/* 右列: 画像プレビュー */}
        <div className="flex w-1/2 flex-col overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">生成画像</h3>
            <Badge variant="outline" className="text-xs">
              {aspectRatio === '16:9' ? 'ワイド (16:9)' : 'スクエア (1:1)'}
            </Badge>
          </div>

          {/* 画像表示エリア */}
          <div
            className={`relative mb-4 overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-100 ${
              aspectRatio === '16:9' ? 'aspect-video' : 'aspect-square'
            }`}
          >
            {section.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={section.imageUrl}
                alt={section.name}
                className="h-full w-full object-cover"
              />
            ) : generating ? (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-green-500" />
                <p className="text-sm text-gray-600">画像を生成中...</p>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
                <ImageIcon className="h-12 w-12" />
                <p className="text-sm">画像がまだ生成されていません</p>
              </div>
            )}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* アクションボタン */}
          <div className="space-y-3">
            <Button
              onClick={handleGenerateImage}
              disabled={generating}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : section.imageUrl ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  再生成する
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  画像を生成する
                </>
              )}
            </Button>

            {section.imageUrl && !generating && (
              <Button
                onClick={handleMarkDone}
                variant="outline"
                className="w-full gap-2 border-green-500 text-green-700 hover:bg-green-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                この画像でOK → 次のセクションへ
              </Button>
            )}
          </div>

          {/* 生成のヒント */}
          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <h4 className="mb-2 text-xs font-semibold text-blue-800">
              画像生成のコツ
            </h4>
            <ul className="space-y-1 text-xs text-blue-700">
              <li>• 参照画像をアップロードすると近いスタイルで生成</li>
              <li>• 気に入らない場合は「再生成する」でやり直し</li>
              <li>• プロンプトを英語で書くと文字が入りにくい</li>
              <li>• セクション内容を入力すると概念が反映される</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
