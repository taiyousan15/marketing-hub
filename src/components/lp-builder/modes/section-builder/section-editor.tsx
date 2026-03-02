'use client';

/**
 * セクションビルダー — セクションエディター（右パネル）
 * 1セクション分の内容入力・参照画像アップロード・画像生成を担当
 * 機能: ① 大プレビュー上でテキスト配置・編集 ② ドラッグ移動 ③ 参照再生成 ④ プロンプト編集
 */

import { useState, useRef, useCallback, useEffect } from 'react';
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
  Download,
  ChevronDown,
  ChevronUp,
  Zap,
  Type,
  Plus,
  Trash2,
  Wand2,
} from 'lucide-react';
import { SectionBuilderSection } from '../../types';
import { getSectionAspectRatio } from './section-templates';

// ------------------------------------------------
// Types
// ------------------------------------------------

interface TextOverlay {
  id: string;
  text: string;
  x: number; // % from left
  y: number; // % from top
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  startMouseX: number;
  startMouseY: number;
}

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

// ------------------------------------------------
// Constants
// ------------------------------------------------

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  'nano-banana-2': { label: 'Nano Banana 2',    color: 'bg-orange-100 text-orange-700' },
  gems:            { label: 'NanaBanana (Gems)', color: 'bg-purple-100 text-purple-700' },
  imagen4:         { label: 'Imagen 4 Fast',     color: 'bg-blue-100 text-blue-700' },
  'gemini-flash':  { label: 'Gemini Flash',      color: 'bg-green-100 text-green-700' },
};

const ASPECT_RATIO_OPTIONS = [
  { value: '16:9' as const, label: 'ワイド 16:9',     size: '約1200×675px',  utage: true,  cssClass: 'aspect-video' },
  { value: '4:3'  as const, label: 'スタンダード 4:3', size: '約1200×900px',  utage: true,  cssClass: 'aspect-[4/3]' },
  { value: '1:1'  as const, label: 'スクエア 1:1',    size: '約1024×1024px', utage: false, cssClass: 'aspect-square' },
  { value: '9:16' as const, label: '縦型 9:16',       size: '約675×1200px',  utage: false, cssClass: 'aspect-[9/16]' },
] as const;

type AspectRatioValue = (typeof ASPECT_RATIO_OPTIONS)[number]['value'];

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ------------------------------------------------
// Component
// ------------------------------------------------

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
  const [showPrompt, setShowPrompt] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioValue>(
    getSectionAspectRatio(section.type) as AspectRatioValue,
  );
  // テキストオーバーレイ
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [addingText, setAddingText] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  // プロンプト編集
  const [editablePrompt, setEditablePrompt] = useState(section.usedPrompt ?? '');
  // カスタムプロンプト
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [customPromptText, setCustomPromptText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  // 大きなプレビュー画像コンテナ（テキスト編集の操作対象）
  const previewContainerRef = useRef<HTMLDivElement>(null);
  // テキスト入力フィールドの自動フォーカス
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (section.usedPrompt) setEditablePrompt(section.usedPrompt);
  }, [section.usedPrompt]);

  // 選択中のオーバーレイが変わったら入力欄にフォーカス
  useEffect(() => {
    if (selectedOverlayId && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [selectedOverlayId]);

  const selectedRatio = ASPECT_RATIO_OPTIONS.find((o) => o.value === aspectRatio) ?? ASPECT_RATIO_OPTIONS[0];
  const selectedOverlay = textOverlays.find((o) => o.id === selectedOverlayId) ?? null;

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
      onUpdateSection(section.id, { referenceImageBase64: base64, referenceImageName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReferenceImage = () => {
    onUpdateSection(section.id, { referenceImageBase64: null, referenceImageName: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ------------------------------------------------
  // 画像生成
  // ------------------------------------------------
  const handleGenerateImage = useCallback(async (opts?: {
    overridePrompt?: string;
    useCurrentAsRef?: boolean;
  }) => {
    setIsGenerating(true);
    setError(null);
    onUpdateSection(section.id, { status: 'generating' });

    try {
      const refBase64 = opts?.useCurrentAsRef && section.imageUrl
        ? await urlToBase64(section.imageUrl)
        : (section.referenceImageBase64 || undefined);

      const directPrompt = useCustomPrompt && customPromptText.trim()
        ? customPromptText.trim()
        : undefined;

      const res = await fetch('/api/ai/section-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionType: section.type,
          content: section.content,
          designStyleId,
          industry: industry || undefined,
          aspectRatio,
          referenceImageBase64: refBase64,
          customPrompt: directPrompt ? undefined : ((opts?.overridePrompt ?? section.imagePrompt) || undefined),
          directPrompt,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as {
        imageUrl: string;
        provider?: 'nano-banana-2' | 'gems' | 'imagen4' | 'gemini-flash';
        usedPrompt?: string;
      };
      onUpdateSection(section.id, {
        imageUrl: data.imageUrl,
        provider: data.provider,
        usedPrompt: data.usedPrompt,
        status: 'editing',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '画像生成に失敗しました';
      setError(msg);
      onUpdateSection(section.id, { status: 'editing' });
    } finally {
      setIsGenerating(false);
    }
  }, [section, designStyleId, industry, aspectRatio, onUpdateSection]);

  // ------------------------------------------------
  // 画像ダウンロード（テキストオーバーレイを Canvas で合成）
  // ------------------------------------------------
  const handleDownloadImage = async () => {
    if (!section.imageUrl) return;

    if (textOverlays.length === 0) {
      const a = document.createElement('a');
      a.href = section.imageUrl;
      a.download = `${section.type}-${section.id.slice(0, 6)}.png`;
      a.click();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      textOverlays.forEach((overlay) => {
        ctx.save();
        const scaledSize = Math.round((overlay.fontSize * img.width) / 800);
        ctx.font = `${overlay.fontWeight} ${scaledSize}px sans-serif`;
        ctx.fillStyle = overlay.color;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(overlay.text, (overlay.x / 100) * img.width, (overlay.y / 100) * img.height);
        ctx.restore();
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${section.type}-${section.id.slice(0, 6)}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = section.imageUrl;
  };

  const handleMarkDone = () => {
    onMarkDone(section.id);
    onNext();
  };

  // ------------------------------------------------
  // テキスト追加ボタン — クリックで即座に追加 → 選択状態に
  // ------------------------------------------------
  const handleAddTextClick = () => {
    if (addingText) {
      setAddingText(false);
      return;
    }
    setAddingText(true);
  };

  // ------------------------------------------------
  // プレビュー画像クリック → テキストを配置
  // ------------------------------------------------
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!addingText || !previewContainerRef.current) return;
    e.stopPropagation();
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newOverlay: TextOverlay = {
      id: generateId(),
      text: 'テキストを入力',
      x,
      y,
      fontSize: 32,
      color: '#ffffff',
      fontWeight: 'bold',
    };
    setTextOverlays((prev) => [...prev, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
    setAddingText(false);
  };

  // プレビュー上のオーバーレイをクリックして選択
  const handleOverlayClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedOverlayId(id);
  };

  // プレビュー背景クリック → 選択解除
  const handlePreviewBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!addingText) {
      setSelectedOverlayId(null);
    }
    handlePreviewClick(e);
  };

  // ------------------------------------------------
  // ドラッグ操作
  // ------------------------------------------------
  const handleOverlayMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const overlay = textOverlays.find((o) => o.id === id);
    if (!overlay) return;
    setSelectedOverlayId(id);
    setDragState({ id, startX: overlay.x, startY: overlay.y, startMouseX: e.clientX, startMouseY: e.clientY });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragState.startMouseX) / rect.width) * 100;
    const dy = ((e.clientY - dragState.startMouseY) / rect.height) * 100;
    setTextOverlays((prev) =>
      prev.map((o) =>
        o.id === dragState.id
          ? {
              ...o,
              x: Math.max(0, Math.min(95, dragState.startX + dx)),
              y: Math.max(2, Math.min(98, dragState.startY + dy)),
            }
          : o,
      ),
    );
  }, [dragState]);

  const handleMouseUp = useCallback(() => setDragState(null), []);

  // ------------------------------------------------
  // オーバーレイ編集 / 削除
  // ------------------------------------------------
  const updateOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const removeOverlay = (id: string) => {
    setTextOverlays((prev) => prev.filter((o) => o.id !== id));
    if (selectedOverlayId === id) setSelectedOverlayId(null);
  };

  // ------------------------------------------------
  // Derived state
  // ------------------------------------------------
  const isDone = section.status === 'done';
  const generating = isGenerating || section.status === 'generating';
  const providerInfo = section.provider ? PROVIDER_LABELS[section.provider] : null;

  // ------------------------------------------------
  // Render
  // ------------------------------------------------
  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      {/* ヘッダー */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{sectionIndex + 1} / {totalSections}</span>
            <h2 className="text-lg font-bold text-gray-900">{section.name}</h2>
            {isDone && (
              <Badge className="gap-1 bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3" />完了
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-600">{section.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={sectionIndex === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onNext} disabled={sectionIndex === totalSections - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex flex-1 gap-0 overflow-hidden">

        {/* ===== 左列: 入力エリア ===== */}
        <div className="flex w-1/2 flex-col overflow-y-auto border-r border-gray-200 bg-white p-6">

          {/* コンテンツ入力 */}
          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">セクションの内容</label>
            <textarea
              value={section.content}
              onChange={(e) => onUpdateSection(section.id, { content: e.target.value, status: 'editing' })}
              placeholder={`このセクションの内容を入力してください。\n\n例: ヘッドライン、本文、キャッチフレーズなど`}
              rows={8}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm leading-relaxed focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* 追加キーワード */}
          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">追加キーワード（任意）</label>
            <input
              type="text"
              value={section.imagePrompt}
              onChange={(e) => onUpdateSection(section.id, { imagePrompt: e.target.value })}
              placeholder="例: blue gradient, technology, professional office"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              画像に含めたい雰囲気・色・モチーフを英語で。空欄でも自動生成します。
            </p>
          </div>

          {/* カスタムプロンプト */}
          <div className="mb-6 rounded-xl border border-purple-200 bg-purple-50 p-4">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={useCustomPrompt}
                onChange={(e) => setUseCustomPrompt(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-purple-400 accent-purple-600"
              />
              <span className="flex items-center gap-1.5 text-sm font-semibold text-purple-800">
                <Wand2 className="h-4 w-4 text-purple-600" />
                カスタムプロンプトを使用する
              </span>
            </label>
            <p className="mt-1.5 pl-6 text-[11px] text-purple-600">
              チェックを入れてプロンプトを入力すると、AI強化をスキップしてそのプロンプトで直接画像を生成します。
            </p>
            {useCustomPrompt && (
              <div className="mt-3">
                <textarea
                  value={customPromptText}
                  onChange={(e) => setCustomPromptText(e.target.value)}
                  placeholder={`画像生成プロンプトを入力してください（英語推奨）\n\n例:\nA professional Japanese landing page hero section showing a modern marketing dashboard with AI analytics, clean minimal design, blue gradient background, bold white Japanese headline text "AIで売上を自動化する" prominently displayed, technology concept with data flow visualization`}
                  maxLength={10000}
                  rows={8}
                  className="w-full resize-y rounded-lg border border-purple-300 bg-white px-3 py-2.5 text-xs leading-relaxed text-gray-800 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[10px] text-purple-500">
                    最大10,000文字 · AIプロンプト強化をスキップ
                  </p>
                  <span className={`text-[10px] font-medium ${customPromptText.length > 9000 ? 'text-red-500' : 'text-purple-400'}`}>
                    {customPromptText.length.toLocaleString()} / 10,000
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 参照画像 */}
          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">参照画像（任意）</label>
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

          {/* AIプロンプト編集（折りたたみ） */}
          {section.usedPrompt && (
            <div className="rounded-lg border border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowPrompt((p) => !p)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold text-gray-600 hover:text-gray-900"
              >
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-yellow-500" />
                  AIが生成したプロンプト（編集・再生成可）
                </span>
                {showPrompt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {showPrompt && (
                <div className="space-y-2 border-t border-gray-200 px-4 py-3">
                  <textarea
                    value={editablePrompt}
                    onChange={(e) => setEditablePrompt(e.target.value)}
                    rows={6}
                    className="w-full resize-y rounded border border-gray-300 font-mono px-3 py-2 text-xs leading-relaxed text-gray-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={generating}
                    onClick={() => handleGenerateImage({ overridePrompt: editablePrompt })}
                    className="w-full gap-1.5 border-yellow-400 text-xs text-yellow-700 hover:bg-yellow-50"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    このプロンプトで再生成
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== 右列: 画像プレビュー + 編集ツール ===== */}
        <div className="flex w-1/2 flex-col overflow-y-auto p-6">

          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">生成画像</h3>
            {providerInfo && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${providerInfo.color}`}>
                {providerInfo.label}
              </span>
            )}
          </div>

          {/* アスペクト比選択 */}
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">画像サイズ</span>
              <span className="text-xs font-medium text-green-600">UTAGE推奨: 横幅1000〜1200px・1MB以下</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ASPECT_RATIO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAspectRatio(opt.value)}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                    aspectRatio === opt.value
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-semibold">{opt.label}</span>
                  <div className="text-right">
                    <div className={`text-xs ${aspectRatio === opt.value ? 'text-green-700' : 'text-gray-400'}`}>
                      {opt.size}
                    </div>
                    {opt.utage && (
                      <div className="text-[10px] font-medium text-green-600">UTAGE推奨</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* サムネイル表示（操作なし） */}
          <div className={`relative mb-4 overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-100 shadow-sm ${selectedRatio.cssClass}`}>
            {section.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={section.imageUrl} alt={section.name} className="h-full w-full object-cover" draggable={false} />
            ) : generating ? (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-green-500" />
                <p className="text-sm text-gray-600">画像を生成中...</p>
                <p className="text-xs text-gray-400">プロンプト強化 → 画像生成（20〜30秒）</p>
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
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* アクションボタン */}
          <div className="space-y-2.5">
            <Button
              onClick={() => handleGenerateImage()}
              disabled={generating}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" />生成中...</>
              ) : section.imageUrl ? (
                <><RefreshCw className="h-4 w-4" />再生成する</>
              ) : (
                <><Sparkles className="h-4 w-4" />画像を生成する</>
              )}
            </Button>

            {section.imageUrl && !generating && (
              <>
                <Button
                  onClick={handleMarkDone}
                  variant="outline"
                  className="w-full gap-2 border-green-500 text-green-700 hover:bg-green-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  この画像でOK → 次のセクションへ
                </Button>
                <Button
                  onClick={handleDownloadImage}
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-gray-500 hover:text-gray-700"
                >
                  <Download className="h-4 w-4" />
                  この画像をダウンロード
                </Button>
              </>
            )}
          </div>

          {/* ===== プレビュー + テキスト編集エリア ===== */}
          {section.imageUrl && (
            <div className="mt-5">

              {/* ヘッダー: テキスト追加ボタン */}
              <div className="mb-2 flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <Type className="h-3.5 w-3.5" />
                  プレビュー / テキスト修正
                </h4>
                <div className="flex items-center gap-2">
                  {addingText && (
                    <span className="text-[10px] font-medium text-blue-600 animate-pulse">
                      画像をクリックして配置
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant={addingText ? 'default' : 'outline'}
                    onClick={handleAddTextClick}
                    className={`gap-1 text-xs ${addingText ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  >
                    <Plus className="h-3 w-3" />
                    {addingText ? 'キャンセル' : 'テキストを追加'}
                  </Button>
                </div>
              </div>

              {/* 大きなプレビュー（テキスト操作の対象） */}
              <div
                ref={previewContainerRef}
                onClick={handlePreviewBgClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative w-full overflow-hidden rounded-xl border-2 shadow-md transition-colors ${
                  addingText
                    ? 'cursor-crosshair border-blue-400 ring-2 ring-blue-200'
                    : 'cursor-default border-gray-200'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={section.imageUrl}
                  alt="プレビュー"
                  className="block w-full"
                  draggable={false}
                />

                {/* テキストオーバーレイ群 */}
                {textOverlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    onMouseDown={(e) => handleOverlayMouseDown(e, overlay.id)}
                    onClick={(e) => handleOverlayClick(e, overlay.id)}
                    style={{
                      position: 'absolute',
                      left: `${overlay.x}%`,
                      top: `${overlay.y}%`,
                      fontSize: `${overlay.fontSize}px`,
                      color: overlay.color,
                      fontWeight: overlay.fontWeight,
                      cursor: dragState?.id === overlay.id ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                      outline: selectedOverlayId === overlay.id
                        ? '2px solid #3b82f6'
                        : '1px dashed rgba(255,255,255,0.4)',
                      outlineOffset: '4px',
                      padding: '2px 4px',
                      whiteSpace: 'nowrap',
                      borderRadius: '2px',
                    }}
                  >
                    {overlay.text}
                  </div>
                ))}

                {/* addingText 時のオーバーレイヒント */}
                {addingText && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-lg bg-blue-600/80 px-4 py-2 text-sm font-bold text-white shadow-lg">
                      クリックしてテキストを配置
                    </div>
                  </div>
                )}
              </div>

              {/* テキスト未追加時のヒント */}
              {textOverlays.length === 0 && !addingText && (
                <p className="mt-2 text-center text-[11px] text-gray-400">
                  「テキストを追加」→ 画像上をクリックで配置。ドラッグで移動できます。
                </p>
              )}

              {/* 選択中オーバーレイの編集パネル */}
              {selectedOverlay && (
                <div className="mt-3 rounded-xl border-2 border-blue-300 bg-blue-50 p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-700">テキストを編集</span>
                    <span className="text-[10px] text-blue-500">（画像上でドラッグして移動）</span>
                    <button
                      onClick={() => removeOverlay(selectedOverlay.id)}
                      className="ml-auto flex items-center gap-1 rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      削除
                    </button>
                  </div>

                  {/* テキスト入力（大きく・目立つ） */}
                  <input
                    ref={textInputRef}
                    value={selectedOverlay.text}
                    onChange={(e) => updateOverlay(selectedOverlay.id, { text: e.target.value })}
                    placeholder="テキストを入力..."
                    className="mb-3 w-full rounded-lg border-2 border-blue-300 bg-white px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />

                  {/* スタイル操作 */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-600">サイズ</span>
                      <input
                        type="number"
                        value={selectedOverlay.fontSize}
                        min={8}
                        max={200}
                        onChange={(e) => updateOverlay(selectedOverlay.id, { fontSize: Number(e.target.value) })}
                        className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-600">色</span>
                      <input
                        type="color"
                        value={selectedOverlay.color}
                        onChange={(e) => updateOverlay(selectedOverlay.id, { color: e.target.value })}
                        className="h-8 w-10 cursor-pointer rounded border border-gray-300"
                      />
                    </div>
                    <button
                      onClick={() =>
                        updateOverlay(selectedOverlay.id, {
                          fontWeight: selectedOverlay.fontWeight === 'bold' ? 'normal' : 'bold',
                        })
                      }
                      className={`rounded border px-3 py-1 text-sm font-bold transition-colors ${
                        selectedOverlay.fontWeight === 'bold'
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      B
                    </button>
                    <button
                      onClick={() => setSelectedOverlayId(null)}
                      className="ml-auto rounded border border-gray-300 px-3 py-1 text-xs text-gray-500 hover:bg-gray-100"
                    >
                      完了
                    </button>
                  </div>
                </div>
              )}

              {/* 追加済みテキスト一覧 */}
              {textOverlays.length > 0 && (
                <div className="mt-3 space-y-1">
                  {textOverlays.map((overlay) => (
                    <button
                      key={overlay.id}
                      onClick={() => setSelectedOverlayId(overlay.id)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                        selectedOverlayId === overlay.id
                          ? 'border-blue-400 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Type className="h-3 w-3 flex-shrink-0" />
                      <span className="flex-1 truncate font-medium">{overlay.text}</span>
                      <span className="text-[10px] text-gray-400">{overlay.fontSize}px</span>
                    </button>
                  ))}
                </div>
              )}

              {/* リファレンス再生成 */}
              {!generating && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateImage({ useCurrentAsRef: true })}
                    className="w-full gap-2 border-purple-300 text-xs text-purple-700 hover:bg-purple-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    この画像を参照して再生成
                  </Button>
                  <p className="mt-1 text-center text-[10px] text-gray-400">
                    現在の画像をスタイル参照として次の生成に使用します
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 生成のヒント */}
          <div className="mt-5 rounded-lg bg-blue-50 p-4">
            <h4 className="mb-2 text-xs font-semibold text-blue-800">画像生成のコツ</h4>
            <ul className="space-y-1 text-xs text-blue-700">
              <li>• <strong>セクション内容</strong>のテキストが画像内に描画されます</li>
              <li>• ヘッドライン・箇条書きを日本語でそのまま入力してください</li>
              <li>• サイズは<strong>16:9 ワイド</strong>がUTAGE LP推奨（横幅1200px相当）</li>
              <li>• 気に入らない場合は「再生成する」でやり直し可能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------
// Utilities
// ------------------------------------------------

async function urlToBase64(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}
