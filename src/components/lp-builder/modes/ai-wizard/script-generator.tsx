'use client';

/**
 * 台本→LP一括生成コンポーネント
 *
 * フロー:
 *   1. input     — 台本貼り付け + 画像設定（スタイルプロンプト / 参照画像）
 *   2. analyzing — Gemini で台本 → セクション構成を解析
 *   3. reviewing — セクションを1枚ずつ確認（画像生成→確認→次へ）
 *   4. complete  — 全セクション完了 / ダウンロード / 統合プレビュー
 */

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  Loader2,
  Download,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  RefreshCw,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { LPFullPreview } from '../section-builder/lp-full-preview';
import { SectionBuilderSection } from '../../types';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type GenerationPhase = 'input' | 'analyzing' | 'reviewing' | 'complete';

interface ScriptSection extends Omit<SectionBuilderSection, 'status'> {
  status: 'pending' | 'generating' | 'done' | 'error';
  title?: string;
  industry?: string;
  order: number;
}

interface ScriptGeneratorProps {
  onReset?: () => void;
}

// ─────────────────────────────────────────────
// Size presets
// ─────────────────────────────────────────────

interface SizePreset {
  label: string;
  width: number;
  height: number;
  /** Imagen 4 / API に渡す最近似アスペクト比 */
  apiAspectRatio: '16:9' | '4:3' | '1:1' | '9:16';
}

const SIZE_PRESETS: SizePreset[] = [
  { label: 'ヘッダー (1200×160)',    width: 1200, height: 160,  apiAspectRatio: '16:9' },
  { label: 'ワイドバナー (1200×300)', width: 1200, height: 300,  apiAspectRatio: '16:9' },
  { label: 'ハーフ横型 (1200×500)',   width: 1200, height: 500,  apiAspectRatio: '16:9' },
  { label: 'LP標準 (1200×675)',       width: 1200, height: 675,  apiAspectRatio: '16:9' },
  { label: 'スクエア (1024×1024)',    width: 1024, height: 1024, apiAspectRatio: '1:1'  },
  { label: '縦型 (675×1200)',         width: 675,  height: 1200, apiAspectRatio: '9:16' },
];


// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

function downloadImage(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

const SECTION_LABEL: Record<string, string> = {
  header: 'ヘッダー',
  hero: 'ヒーロー',
  problem: '課題',
  benefit: 'ベネフィット',
  testimonial: '実績',
  cta: 'CTA',
  faq: 'FAQ',
  footer: 'フッター',
};

// ─────────────────────────────────────────────
// Section visual style descriptors for Nano Banana 2
// ─────────────────────────────────────────────

const SECTION_VISUAL_STYLE: Record<string, string> = {
  hero:        'dramatic hero banner with bold eye-catching design, anime illustration or photographic background, high-impact marketing composition, vivid colors',
  problem:     'dark moody emotive background, problem-focused visual with dramatic red lighting and tension',
  benefit:     'bright vibrant optimistic background, gold accents, success and solution visual theme',
  cta:         'urgent high-contrast call-to-action design, bright red and gold accent colors, compelling dynamic visual',
  testimonial: 'warm trustworthy background, testimonial quote styling, social proof visual, professional portrait elements',
  header:      'clean professional header banner design with subtle gradient background and brand color elements',
  faq:         'clean organized informational layout, light background with structured visual elements',
  footer:      'professional footer banner with subtle dark background pattern and brand elements',
};

/**
 * Nano Banana 2 向けの LP バックグラウンドビジュアルプロンプトを構築する。
 * テキスト描画指示は含めない（Canvas で後合成するため）。
 * 参照画像がある場合はスタイル継承を明示指示する。
 */
function buildVisualBackgroundPrompt(
  section: ScriptSection,
  hasReference: boolean,
  preset: SizePreset,
): string {
  const visualStyle = SECTION_VISUAL_STYLE[section.type] || 'professional LP banner background';
  const extraVisual = section.imagePrompt || '';
  const aspectHint  = `${preset.width}×${preset.height}px (${preset.width > preset.height ? 'wide landscape' : preset.width === preset.height ? 'square' : 'portrait'} format)`;

  const referenceHint = hasReference
    ? 'Generate a NEW background image that faithfully inherits the visual style, color palette, mood, and design language from the reference image provided. Do NOT copy content, only the visual style.'
    : '';

  return [
    `LP marketing banner background image without any text. Target size: ${aspectHint}.`,
    visualStyle + '.',
    referenceHint,
    extraVisual,
    'No text, no letters, no words anywhere in the image. Pure visual background only. High-impact professional composition.',
  ]
    .filter(Boolean)
    .join(' ');
}

// ─────────────────────────────────────────────
// Canvas: テキストの折り返し
// ─────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const chars = Array.from(text);
  let current = '';
  for (const char of chars) {
    const test = current + char;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─────────────────────────────────────────────
// Canvas: 背景画像に日本語テキストを合成
// ─────────────────────────────────────────────

const FONT_STACK =
  '"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic","Meiryo","Noto Sans JP",sans-serif';

// セクション種別ごとの配色
const SECTION_TEXT_COLOR: Record<string, { fill: string[]; stroke: string }> = {
  hero:        { fill: ['#FFE566', '#FFB800', '#FF8C00'], stroke: 'rgba(0,0,0,0.95)' },
  cta:         { fill: ['#FF6B6B', '#FF2222', '#CC0000'], stroke: 'rgba(0,0,0,0.95)' },
  problem:     { fill: ['#FF4444', '#CC0000', '#990000'], stroke: 'rgba(0,0,0,0.95)' },
  benefit:     { fill: ['#66FFB2', '#00CC66', '#009944'], stroke: 'rgba(0,0,0,0.9)'  },
  testimonial: { fill: ['#FFFFFF', '#E0E0E0', '#C0C0C0'],  stroke: 'rgba(0,0,0,0.85)' },
  header:      { fill: ['#FFFFFF', '#F0F0F0', '#D0D0D0'],  stroke: 'rgba(0,0,0,0.8)'  },
  faq:         { fill: ['#4488FF', '#2255CC', '#1133AA'], stroke: 'rgba(0,0,0,0.9)'  },
  footer:      { fill: ['#CCCCCC', '#AAAAAA', '#888888'], stroke: 'rgba(0,0,0,0.8)'  },
};

async function compositeTextOnImage(
  imageUrl: string,
  section: ScriptSection,
  outputWidth: number,
  outputHeight: number,
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) { resolve(imageUrl); return; }

    const img = new Image();
    img.onload = () => {
      const W = outputWidth;
      const H = outputHeight;
      canvas.width  = W;
      canvas.height = H;

      // "object-fit: cover" と同等のクロップで背景描画
      const srcW = img.naturalWidth  || 1280;
      const srcH = img.naturalHeight || 720;
      const srcAspect = srcW / srcH;
      const dstAspect = W / H;
      let sx = 0, sy = 0, sw = srcW, sh = srcH;
      if (srcAspect > dstAspect) {
        // ソースが横長 → 左右をクロップ
        sw = srcH * dstAspect;
        sx = (srcW - sw) / 2;
      } else {
        // ソースが縦長 → 上下をクロップ
        sh = srcW / dstAspect;
        sy = (srcH - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

      const title   = section.title   || '';
      const content = section.content || '';
      if (!title && !content) { resolve(canvas.toDataURL('image/png')); return; }

      // 読みやすさのためのグラデーションオーバーレイ
      const grad = ctx.createLinearGradient(0, H * 0.30, 0, H);
      grad.addColorStop(0,   'rgba(0,0,0,0)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.60)');
      grad.addColorStop(1,   'rgba(0,0,0,0.80)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';

      const colors = SECTION_TEXT_COLOR[section.type] ?? SECTION_TEXT_COLOR['hero'];

      // ── タイトル描画 ──
      if (title) {
        const titleSize = Math.max(40, Math.floor(W / 16));
        ctx.font = `bold ${titleSize}px ${FONT_STACK}`;

        const lines     = wrapText(ctx, title, W * 0.84);
        const lineH     = titleSize * 1.35;
        const totalH    = lines.length * lineH;
        // 中央よりやや下に配置
        let y = H * 0.52 - totalH / 2 + lineH / 2;

        for (const line of lines) {
          // アウトライン（影）
          ctx.strokeStyle = colors.stroke;
          ctx.lineWidth   = titleSize / 4;
          ctx.lineJoin    = 'round';
          ctx.strokeText(line, W / 2, y, W * 0.88);

          // グラデーション塗り
          const fillGrad = ctx.createLinearGradient(0, y - titleSize * 0.6, 0, y + titleSize * 0.6);
          fillGrad.addColorStop(0,   colors.fill[0]);
          fillGrad.addColorStop(0.5, colors.fill[1]);
          fillGrad.addColorStop(1,   colors.fill[2]);
          ctx.fillStyle = fillGrad;
          ctx.fillText(line, W / 2, y, W * 0.88);

          y += lineH;
        }

        // ── サブテキスト（content 先頭4行）──
        const subLines = content.split('\n').filter(Boolean).slice(0, 4);
        if (subLines.length > 0) {
          const subSize = Math.max(20, Math.floor(W / 38));
          ctx.font = `${subSize}px ${FONT_STACK}`;
          let sy = y + subSize * 0.6;

          for (const sub of subLines) {
            ctx.strokeStyle = 'rgba(0,0,0,0.9)';
            ctx.lineWidth   = 3;
            ctx.strokeText(sub, W / 2, sy, W * 0.88);
            ctx.fillStyle = 'rgba(255,255,255,0.92)';
            ctx.fillText(sub,  W / 2, sy, W * 0.88);
            sy += subSize * 1.6;
          }
        }
      }

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => resolve(imageUrl);
    img.src     = imageUrl;
  });
}

// ─────────────────────────────────────────────
// Subcomponent: Section image
// ─────────────────────────────────────────────

function SectionImage({
  section,
  compact = false,
}: {
  section: ScriptSection;
  compact?: boolean;
}) {
  const heightClass = compact ? 'h-[120px]' : 'max-h-[360px]';
  return (
    <img
      src={section.imageUrl!}
      alt={section.name}
      className={`w-full object-cover object-center ${heightClass}`}
    />
  );
}

// ─────────────────────────────────────────────
// Main: ScriptGenerator
// ─────────────────────────────────────────────

export function ScriptGenerator({ onReset }: ScriptGeneratorProps) {
  const [phase, setPhase] = useState<GenerationPhase>('input');
  const [scriptText, setScriptText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Image settings
  const [stylePromptEnabled, setStylePromptEnabled] = useState(false);
  const [stylePrompt, setStylePrompt] = useState('');
  const [referenceEnabled, setReferenceEnabled] = useState(false);
  const [referenceImageBase64, setReferenceImageBase64] = useState<string | null>(null);
  const [referenceImageName, setReferenceImageName] = useState<string | null>(null);

  const [sections, setSections] = useState<ScriptSection[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullPreview, setShowFullPreview] = useState(false);

  // サイズ設定: グローバルデフォルト + セクション個別オーバーライド
  const [globalPresetIndex, setGlobalPresetIndex] = useState(3); // LP標準 (1200×675)
  const [sectionSizeOverrides, setSectionSizeOverrides] = useState<Record<string, number>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Keep a ref to the latest sections for use inside async callbacks
  const sectionsRef = useRef<ScriptSection[]>([]);

  /** セクションに適用するプリセットを解決する */
  const resolveSectionPreset = useCallback(
    (section: ScriptSection): SizePreset => {
      const overrideIdx = sectionSizeOverrides[section.id];
      if (overrideIdx !== undefined) return SIZE_PRESETS[overrideIdx];
      return SIZE_PRESETS[globalPresetIndex];
    },
    [globalPresetIndex, sectionSizeOverrides],
  );

  const updateSections = (updater: (prev: ScriptSection[]) => ScriptSection[]) => {
    setSections((prev) => {
      const next = updater(prev);
      sectionsRef.current = next;
      return next;
    });
  };

  // ── Reference image upload ────────────────
  const handleReferenceUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setReferenceImageBase64(e.target?.result as string);
      setReferenceImageName(file.name);
    };
    reader.readAsDataURL(file);
  }, []);

  // ── Generate image for a single section ──
  // overridePreset: サイズ変更直後など、state 反映前に新しいプリセットを直接渡す場合に使用
  const generateImageForSection = useCallback(
    async (section: ScriptSection, overridePreset?: SizePreset): Promise<void> => {
      updateSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, status: 'generating' } : s))
      );

      const preset     = overridePreset ?? resolveSectionPreset(section);
      const hasRef     = referenceEnabled && !!referenceImageBase64;
      const directPrompt = buildVisualBackgroundPrompt(section, hasRef, preset);

      const body: Record<string, unknown> = {
        sectionType:  section.type,
        content:      section.content,
        industry:     section.industry || 'business',
        aspectRatio:  preset.apiAspectRatio,
        directPrompt,
      };
      if (stylePromptEnabled && stylePrompt.trim()) body.customPrompt = stylePrompt.trim();
      // 参照画像がある場合は必ず渡す（Nano Banana 2 がマルチモーダルで読み込む）
      if (hasRef) body.referenceImageBase64 = referenceImageBase64;

      try {
        const res = await fetch('/api/ai/section-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = res.ok ? await res.json() : null;
        const rawImageUrl: string | null = data?.imageUrl ?? null;

        // Canvas で日本語テキストを合成し、指定サイズにリサイズして最終画像を作成
        const imageUrl = rawImageUrl
          ? await compositeTextOnImage(rawImageUrl, section, preset.width, preset.height)
          : null;

        updateSections((prev) =>
          prev.map((s) =>
            s.id === section.id
              ? { ...s, status: imageUrl ? 'done' : 'error', imageUrl: imageUrl ?? null }
              : s
          )
        );
      } catch {
        updateSections((prev) =>
          prev.map((s) => (s.id === section.id ? { ...s, status: 'error' } : s))
        );
      }
    },
    [stylePromptEnabled, stylePrompt, referenceEnabled, referenceImageBase64, resolveSectionPreset]
  );

  // ── Analyze script → sections, start first ─
  const handleAnalyze = useCallback(async () => {
    if (!scriptText.trim()) return;
    setError(null);
    setPhase('analyzing');

    try {
      const res = await fetch('/api/ai/lp-analyze-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptText,
          ...(stylePromptEnabled && stylePrompt.trim() ? { stylePrompt: stylePrompt.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '解析失敗' }));
        throw new Error(err.error || '台本の解析に失敗しました');
      }

      const data = await res.json();
      const parsedSections: ScriptSection[] = (data.sections as ScriptSection[]).map(
        (s, i) => ({ ...s, status: 'pending', order: i })
      );

      sectionsRef.current = parsedSections;
      setSections(parsedSections);
      setCurrentIndex(0);
      setPhase('reviewing');

      // Generate the first section immediately
      await generateImageForSection(parsedSections[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
      setPhase('input');
    }
  }, [scriptText, stylePromptEnabled, stylePrompt, generateImageForSection]);

  // ── Advance to next section ───────────────
  const handleNext = useCallback(async () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= sectionsRef.current.length) {
      setPhase('complete');
      return;
    }
    setCurrentIndex(nextIdx);
    await generateImageForSection(sectionsRef.current[nextIdx]);
  }, [currentIndex, generateImageForSection]);

  // ── Regenerate current section ────────────
  const handleRegenerate = useCallback(async () => {
    const section = sectionsRef.current[currentIndex];
    if (section) await generateImageForSection(section);
  }, [currentIndex, generateImageForSection]);

  // ── Download all ──────────────────────────
  const handleDownloadAll = useCallback(() => {
    sections.filter((s) => s.imageUrl).forEach((s, i) => {
      setTimeout(() => downloadImage(s.imageUrl!, `lp-section-${i + 1}-${s.type}.png`), i * 300);
    });
  }, [sections]);

  const currentSection = sections[currentIndex];
  const isLastSection = currentIndex === sections.length - 1;
  const isCurrentDone =
    currentSection?.status === 'done' || currentSection?.status === 'error';

  // ─────────────────────────────────────────
  // Render: Input Phase
  // ─────────────────────────────────────────
  if (phase === 'input') {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto p-5 space-y-5">
        {/* Info */}
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 p-4 border border-purple-100">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 flex-shrink-0">
              <Layers className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-purple-900 text-sm">台本から1枚ずつ確認生成</p>
              <p className="text-xs text-purple-600 mt-0.5 leading-relaxed">
                台本を貼り付けると Gemini がLP構成を分析し、セクションごとに画像を生成します。
                1枚確認して「次へ」で次のセクションを生成します。
              </p>
            </div>
          </div>
        </div>

        {/* Script textarea */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">台本・原稿テキスト</label>
          <Textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder="セールスレター、LP台本、商品説明文などを貼り付けてください..."
            className="min-h-[200px] resize-none text-sm"
          />
          <p className="text-xs text-gray-400">{scriptText.length.toLocaleString()} 文字</p>
        </div>

        {/* Image generation settings */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-gray-500" />
            画像生成設定
          </p>

          {/* Output size */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600">
              デフォルト出力サイズ
              <span className="ml-1.5 text-gray-400">（全セクションに適用されます）</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {SIZE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setGlobalPresetIndex(idx)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    globalPresetIndex === idx
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              ※ 確認フェーズでセクションごとに個別変更もできます
            </p>
          </div>

          {/* Style prompt */}
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={stylePromptEnabled}
                onChange={(e) => setStylePromptEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">スタイル・雰囲気プロンプトを使用</span>
            </label>
            {stylePromptEnabled && (
              <Textarea
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                placeholder="例: モダンでプロフェッショナルなデザイン、青系カラー、清潔感のある雰囲気..."
                rows={3}
                className="resize-none text-sm bg-white"
              />
            )}
          </div>

          {/* Reference image */}
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={referenceEnabled}
                onChange={(e) => {
                  setReferenceEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setReferenceImageBase64(null);
                    setReferenceImageName(null);
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">参照画像を使用（スタイル参考）</span>
            </label>
            {referenceEnabled && (
              <div>
                {referenceImageBase64 ? (
                  <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                    <img
                      src={referenceImageBase64}
                      alt="参照画像"
                      className="h-16 w-24 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{referenceImageName}</p>
                      <p className="text-xs text-green-600">参照画像として設定済み</p>
                    </div>
                    <button
                      onClick={() => {
                        setReferenceImageBase64(null);
                        setReferenceImageName(null);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-purple-400 hover:bg-purple-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) handleReferenceUpload(file);
                    }}
                  >
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">クリックまたはドロップで画像をアップロード</p>
                    <p className="mt-1 text-xs text-gray-400">JPEG, PNG, WebP（5MB以下）</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleReferenceUpload(file);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Start button */}
        <Button
          onClick={handleAnalyze}
          disabled={!scriptText.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700"
          size="lg"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          台本を分析して LP を生成開始
        </Button>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // Render: Analyzing Phase
  // ─────────────────────────────────────────
  if (phase === 'analyzing') {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 mx-auto">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">台本を解析中...</p>
            <p className="text-sm text-gray-500 mt-1">
              Gemini が LP セクション構成を分析しています
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // Render: Reviewing Phase (one section at a time)
  // ─────────────────────────────────────────
  if (phase === 'reviewing' && currentSection) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Section progress pills */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500">
              {currentIndex + 1} / {sections.length} セクション
            </p>
            <button
              onClick={() => {
                setSections([]);
                setPhase('input');
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="最初からやり直す"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {sections.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  i === currentIndex
                    ? 'bg-purple-600 text-white'
                    : s.status === 'done'
                    ? 'bg-green-100 text-green-700'
                    : s.status === 'error'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {s.status === 'done' && i !== currentIndex && (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {s.status === 'generating' && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {SECTION_LABEL[s.type] || s.name}
              </div>
            ))}
          </div>
        </div>

        {/* Current section content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Section info */}
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 mb-1">
                  {SECTION_LABEL[currentSection.type] || currentSection.type}
                </span>
                <p className="font-semibold text-gray-900 text-sm">{currentSection.name}</p>
                {currentSection.title && (
                  <p className="text-sm text-gray-600 mt-0.5">{currentSection.title}</p>
                )}
              </div>
              {/* 現在サイズ表示 */}
              <span className="flex-shrink-0 text-xs text-gray-400 bg-gray-100 rounded px-2 py-1">
                {resolveSectionPreset(currentSection).width}×{resolveSectionPreset(currentSection).height}
              </span>
            </div>

            {/* サイズ変更 — 選択と同時に再生成を自動起動 */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">
                出力サイズ
                <span className="ml-1 text-gray-400">（選択すると自動再生成）</span>
              </p>
              <div className="flex flex-wrap gap-1">
                {SIZE_PRESETS.map((preset, idx) => {
                  const activeIdx = sectionSizeOverrides[currentSection.id] ?? globalPresetIndex;
                  const isActive = idx === activeIdx;
                  return (
                    <button
                      key={idx}
                      disabled={currentSection.status === 'generating'}
                      onClick={async () => {
                        if (isActive) return;
                        // state 更新前に新プリセットを直接渡して即時再生成
                        setSectionSizeOverrides((prev) => ({ ...prev, [currentSection.id]: idx }));
                        await generateImageForSection(sectionsRef.current[currentIndex], SIZE_PRESETS[idx]);
                      }}
                      className={`rounded px-2 py-1 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isActive
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-400'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {currentSection.content && (
              <p className="text-xs text-gray-500 whitespace-pre-wrap line-clamp-3">
                {currentSection.content}
              </p>
            )}
          </div>

          {/* Image area */}
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
            {currentSection.status === 'generating' && (
              <div className="flex flex-col items-center justify-center py-16 bg-purple-50">
                <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                <p className="mt-3 text-sm font-medium text-purple-700">画像を生成中...</p>
                <p className="mt-1 text-xs text-purple-500">10〜20秒ほどお待ちください</p>
              </div>
            )}

            {currentSection.status === 'pending' && (
              <div className="flex flex-col items-center justify-center py-16 bg-gray-50">
                <ImageIcon className="h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-400">待機中</p>
              </div>
            )}

            {currentSection.imageUrl && (
              <SectionImage section={currentSection} />
            )}

            {currentSection.status === 'error' && (
              <div className="flex flex-col items-center justify-center py-12 bg-red-50">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="mt-2 text-sm font-medium text-red-600">生成に失敗しました</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {isCurrentDone && (
            <div className="flex items-center gap-2">
              {/* Download current */}
              {currentSection.imageUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadImage(
                      currentSection.imageUrl!,
                      `section-${currentIndex + 1}-${currentSection.type}.png`
                    )
                  }
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  この画像をDL
                </Button>
              )}
              {/* Regenerate */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                再生成
              </Button>
            </div>
          )}
        </div>

        {/* Next / Complete button */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3">
          <Button
            onClick={handleNext}
            disabled={!isCurrentDone}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            {isLastSection ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                完了して全体を確認
              </>
            ) : (
              <>
                次のセクションへ
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // Render: Complete Phase
  // ─────────────────────────────────────────
  if (phase === 'complete') {
    const doneCount = sections.filter((s) => s.status === 'done').length;

    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm">生成完了</p>
            <p className="text-xs text-gray-500">{doneCount} / {sections.length} セクション成功</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullPreview(true)}
              className="text-xs"
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              全体プレビュー
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadAll}
              className="bg-purple-600 hover:bg-purple-700 text-xs"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              全てDL
            </Button>
          </div>
        </div>

        {/* Thumbnails grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {sections.map((s, i) => (
              <div key={s.id} className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                {s.imageUrl ? (
                  <SectionImage section={s} compact />
                ) : (
                  <div className="flex items-center justify-center bg-red-50" style={{ height: '120px' }}>
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  </div>
                )}
                <div className="px-2.5 py-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{s.name}</p>
                  </div>
                  {s.imageUrl && (
                    <button
                      onClick={() => downloadImage(s.imageUrl!, `lp-section-${i + 1}-${s.type}.png`)}
                      className="flex-shrink-0 ml-1.5 p-1 text-gray-400 hover:text-purple-600"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom actions */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullPreview(true)}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              LP全体プレビュー
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadAll}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Download className="mr-1.5 h-4 w-4" />
              全セクション一括DL
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSections([]);
                setPhase('input');
              }}
            >
              <RefreshCw className="mr-1.5 h-4 w-4" />
              台本を変えて再生成
            </Button>
          </div>
        </div>

        {/* Full Preview modal */}
        {showFullPreview && (
          <LPFullPreview
            sections={sections as unknown as SectionBuilderSection[]}
            onClose={() => setShowFullPreview(false)}
            onExport={handleDownloadAll}
          />
        )}
      </div>
    );
  }

  return null;
}
