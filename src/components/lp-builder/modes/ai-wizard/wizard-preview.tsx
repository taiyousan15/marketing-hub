'use client';

/**
 * AIウィザード プレビューパネル
 * 生成されたLPのリアルタイムプレビュー + 画像一枚ずつ確認ギャラリー
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wrench,
  Monitor,
  RefreshCw,
  Download,
  Images,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
} from 'lucide-react';
import { WizardState, ComponentInstance, PreviewConfig } from '../../types';
import { getComponentByType } from '../../components-registry';

interface WizardPreviewProps {
  wizardState: WizardState;
  components: ComponentInstance[];
  previewConfig: PreviewConfig;
  onOpenAdvanced: () => void;
}

// 生成画像の抽出結果
interface ExtractedImage {
  url: string;
  alt: string;
  label: string;
  credit?: string;
}

/** コンポーネント配列から画像を抽出する */
function extractImages(components: ComponentInstance[]): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  let heroFound = false;
  let benefitIndex = 0;

  for (const comp of components) {
    if (comp.componentType === 'image' && comp.props.src) {
      const label = heroFound ? `ベネフィット画像 ${++benefitIndex}` : 'ヒーロー画像';
      if (!heroFound) heroFound = true;
      images.push({
        url: String(comp.props.src),
        alt: String(comp.props.alt || ''),
        label,
        credit: comp.props.credit ? String(comp.props.credit) : undefined,
      });
    } else if (comp.componentType === 'imageText' && comp.props.image) {
      images.push({
        url: String(comp.props.image),
        alt: String(comp.props.title || ''),
        label: `ベネフィット画像 ${++benefitIndex}`,
        credit: comp.props.credit ? String(comp.props.credit) : undefined,
      });
    }
  }

  return images;
}

export function WizardPreview({
  wizardState,
  components,
  previewConfig,
  onOpenAdvanced,
}: WizardPreviewProps) {
  const { answers, generatedLP, isGenerating } = wizardState;
  const hasLP = generatedLP && generatedLP.length > 0;

  // 生成された画像を抽出
  const generatedImages = hasLP ? extractImages(generatedLP) : [];

  // 表示モード: LP全体 or 画像確認
  const [viewMode, setViewMode] = useState<'lp' | 'images'>('lp');
  const [imageIndex, setImageIndex] = useState(0);

  return (
    <div className="flex h-full flex-col bg-gray-100">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">プレビュー</h2>
            <p className="text-sm text-gray-500">
              {hasLP ? 'AIが生成したLPです' : '質問に回答するとプレビューが表示されます'}
            </p>
          </div>
          {hasLP && (
            <div className="flex items-center gap-2">
              {/* 表示モード切替 */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setViewMode('lp')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'lp'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  LP全体
                </button>
                <button
                  onClick={() => { setViewMode('images'); setImageIndex(0); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 ${
                    viewMode === 'images'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Images className="h-3.5 w-3.5" />
                  画像確認
                  {generatedImages.length > 0 && (
                    <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${
                      viewMode === 'images' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {generatedImages.length}
                    </span>
                  )}
                </button>
              </div>
              <Button variant="outline" size="sm" onClick={onOpenAdvanced}>
                <Wrench className="mr-2 h-4 w-4" />
                アドバンスドで編集
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* プレビューコンテンツ */}
      <div className="flex-1 overflow-y-auto p-6">
        {isGenerating ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">LP生成中...</h3>
              <p className="mt-2 text-gray-500">
                AIがコピーを作成し、画像を生成しています
              </p>
              <p className="mt-1 text-xs text-gray-400">
                10〜15秒ほどお待ちください
              </p>
            </div>
          </div>
        ) : hasLP ? (
          viewMode === 'images' ? (
            <ImageGallery
              images={generatedImages}
              index={imageIndex}
              onIndexChange={setImageIndex}
            />
          ) : (
            <div className="mx-auto max-w-3xl">
              <Card className="overflow-hidden bg-white shadow-xl">
                {components.map((comp) => (
                  <ComponentPreview key={comp.id} component={comp} />
                ))}
              </Card>
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                <Monitor className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                プレビューを表示する準備ができています
              </h3>
              <p className="mt-2 text-gray-500">
                左のチャットで質問に回答すると、
                <br />
                AIが最適なLPを自動生成します
              </p>

              {/* 回答状況 */}
              {Object.keys(answers).length > 0 && (
                <div className="mt-6 rounded-lg bg-gray-50 p-4 text-left">
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    入力済みの情報:
                  </p>
                  <div className="space-y-1">
                    {answers.productName && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">商品名</Badge>
                        <span className="text-sm text-gray-600">{answers.productName}</span>
                      </div>
                    )}
                    {answers.targetAudience && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">ターゲット</Badge>
                        <span className="line-clamp-1 text-sm text-gray-600">
                          {answers.targetAudience}
                        </span>
                      </div>
                    )}
                    {answers.problems && answers.problems.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">悩み</Badge>
                        <span className="text-sm text-gray-600">
                          {answers.problems.length}個入力済み
                        </span>
                      </div>
                    )}
                    {answers.benefits && answers.benefits.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">ベネフィット</Badge>
                        <span className="text-sm text-gray-600">
                          {answers.benefits.length}個入力済み
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* フッター */}
      {hasLP && (
        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              このLPはAIが生成しました。アドバンスドモードで自由に編集できます。
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                ダウンロード
              </Button>
              <Button onClick={onOpenAdvanced}>
                このLPを使用する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 画像ギャラリー コンポーネント
// ============================================

interface ImageGalleryProps {
  images: ExtractedImage[];
  index: number;
  onIndexChange: (index: number) => void;
}

function ImageGallery({ images, index, onIndexChange }: ImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
            <Images className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500">生成された画像がありません</p>
          <p className="mt-1 text-sm text-gray-400">
            画像生成APIが未設定の可能性があります
          </p>
        </div>
      </div>
    );
  }

  const current = images[index];

  return (
    <div className="mx-auto max-w-2xl">
      {/* ラベルとページ番号 */}
      <div className="mb-4 flex items-center justify-between">
        <Badge variant="outline" className="text-sm font-medium">
          {current.label}
        </Badge>
        <span className="text-sm text-gray-500">
          {index + 1} / {images.length}枚
        </span>
      </div>

      {/* 画像カード */}
      <Card className="overflow-hidden bg-white shadow-lg">
        <div className="flex items-center justify-center bg-gray-50 p-2">
          <img
            src={current.url}
            alt={current.alt}
            className="h-auto max-h-[480px] w-auto max-w-full rounded object-contain"
          />
        </div>
        {current.alt && (
          <div className="border-t border-gray-100 px-4 py-2">
            <p className="text-sm text-gray-700">{current.alt}</p>
          </div>
        )}
        {current.credit && (
          <p className="px-4 pb-2 text-right text-xs text-gray-400">
            {current.credit}
          </p>
        )}
      </Card>

      {/* ナビゲーション */}
      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onIndexChange(index - 1)}
          disabled={index === 0}
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          前の画像
        </Button>

        {/* ドットインジケーター */}
        <div className="flex items-center gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              title={img.label}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                i === index
                  ? 'scale-125 bg-blue-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onIndexChange(index + 1)}
          disabled={index === images.length - 1}
        >
          次の画像
          <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>

      {/* サムネイル一覧 */}
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              className={`overflow-hidden rounded-lg border-2 transition-all ${
                i === index
                  ? 'border-blue-600 ring-1 ring-blue-300'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img
                src={img.url}
                alt={img.label}
                className="h-16 w-full object-cover"
              />
              <p className={`truncate px-1 py-0.5 text-center text-xs ${
                i === index ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600'
              }`}>
                {img.label}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// コンポーネントプレビュー（LP全体表示用）
// ============================================

interface ComponentPreviewProps {
  component: ComponentInstance;
}

function ComponentPreview({ component }: ComponentPreviewProps) {
  const componentDef = getComponentByType(component.componentType);

  // image コンポーネント
  if (component.componentType === 'image') {
    return (
      <div className="bg-white">
        <img
          src={String(component.props.src || '')}
          alt={String(component.props.alt || '')}
          className="h-auto w-full object-cover"
          style={{ maxHeight: '400px' }}
        />
        {component.props.credit && (
          <p className="px-4 py-1 text-right text-xs text-gray-400">
            {String(component.props.credit)}
          </p>
        )}
      </div>
    );
  }

  // imageText コンポーネント
  if (component.componentType === 'imageText') {
    const isImageLeft = component.props.imagePosition !== 'right';
    return (
      <div className="bg-white px-8 py-8">
        <div className={`mx-auto flex max-w-3xl items-center gap-6 ${isImageLeft ? '' : 'flex-row-reverse'}`}>
          <div className="w-1/3 flex-shrink-0 overflow-hidden rounded-lg">
            <img
              src={String(component.props.image || '')}
              alt={String(component.props.title || '')}
              className="h-auto w-full object-cover"
            />
            {component.props.credit && (
              <p className="mt-1 text-xs text-gray-400">
                {String(component.props.credit)}
              </p>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              {String(component.props.title || '')}
            </h3>
            {component.props.text && (
              <p className="mt-2 text-gray-600">
                {String(component.props.text)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // headline / subhead コンポーネント
  if (component.componentType === 'headline' || component.componentType === 'subhead') {
    const text = String(component.props.text || '');
    const fontSize = Number(component.props.fontSize || 24);
    const textColor = String(component.props.textColor || '#1f2937');
    const textAlign = String(component.props.textAlign || 'center') as 'left' | 'center' | 'right';
    return (
      <div className="bg-white px-8 py-6">
        <div className="mx-auto max-w-3xl" style={{ textAlign }}>
          <h2 style={{ fontSize: `${fontSize}px`, color: textColor, fontWeight: 'bold', lineHeight: 1.3 }}>
            {text}
          </h2>
        </div>
      </div>
    );
  }

  if (component.componentType === 'text') {
    const content = String(component.props.content || '');
    const bgColor = String(component.props.backgroundColor || 'transparent');
    const textColor = String(component.props.textColor || '#374151');
    const textAlign = String(component.props.textAlign || 'center') as 'left' | 'center' | 'right';
    return (
      <div className="px-8 py-6" style={{ backgroundColor: bgColor }}>
        <div className="mx-auto max-w-3xl" style={{ textAlign }}>
          <p style={{ color: textColor, lineHeight: 1.8 }}>{content}</p>
        </div>
      </div>
    );
  }

  if (component.componentType === 'spacer') {
    const height = Number(component.props.height || 20);
    return <div style={{ height: `${height}px` }} />;
  }

  if (component.componentType === 'bullet') {
    const items = String(component.props.items || '').split('\n').filter(Boolean);
    const iconColor = String(component.props.iconColor || '#22c55e');
    const icon = String(component.props.icon || 'check');
    return (
      <div className="bg-white px-8 py-4">
        <div className="mx-auto max-w-3xl">
          <ul className="space-y-3">
            {items.map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm"
                  style={{ backgroundColor: `${iconColor}20`, color: iconColor }}
                >
                  {icon === 'arrow' ? '\u2192' : '\u2713'}
                </span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // カテゴリに応じたスタイル（汎用フォールバック）
  const getCategoryStyles = () => {
    switch (component.category) {
      case 'headline':
        return 'bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16';
      case 'other':
        if (component.componentType === 'countdown') {
          return 'bg-red-600 text-white py-4';
        }
        if (component.componentType === 'footer') {
          return 'bg-gray-900 text-white py-8';
        }
        if (component.componentType === 'header') {
          return 'bg-white py-4';
        }
        return 'bg-gray-50 py-8';
      case 'button':
        return 'bg-blue-600 text-white py-12';
      case 'content':
        return 'bg-gray-50 py-12';
      case 'payment':
        return 'bg-white py-12';
      case 'form':
        return 'bg-white py-12';
      case 'video':
        return 'bg-gray-900 py-12';
      case 'line':
        return 'bg-emerald-50 py-12';
      case 'basic':
        return 'bg-white py-8';
      default:
        return 'bg-white py-12';
    }
  };

  // componentDef is imported but not used in this fallback — suppress lint warning
  void componentDef;

  return (
    <div className={`px-8 ${getCategoryStyles()}`}>
      <div className="mx-auto max-w-3xl">
        {/* Headline */}
        {component.props.headline && (
          <h2
            className={`text-3xl font-bold ${
              ['headline', 'button'].includes(component.category) ||
              ['countdown', 'footer'].includes(component.componentType)
                ? 'text-white'
                : 'text-gray-900'
            }`}
          >
            {String(component.props.headline)}
          </h2>
        )}

        {/* Subheadline / Description */}
        {(component.props.subheadline || component.props.description) && (
          <p
            className={`mt-4 text-lg ${
              ['headline', 'button'].includes(component.category) ||
              ['countdown', 'footer'].includes(component.componentType)
                ? 'text-white/90'
                : 'text-gray-600'
            }`}
          >
            {String(component.props.subheadline || component.props.description)}
          </p>
        )}

        {/* Problems List */}
        {component.props.problems && (
          <ul className="mt-6 space-y-3">
            {String(component.props.problems)
              .split('\n')
              .map((problem, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">
                    ✕
                  </span>
                  <span className="text-gray-700">{problem}</span>
                </li>
              ))}
          </ul>
        )}

        {/* Features / Benefits */}
        {(component.props.features || component.props.benefits) && (
          <ul className="mt-6 space-y-3">
            {String(component.props.features || component.props.benefits)
              .split('\n')
              .map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                    ✓
                  </span>
                  <span className="text-gray-700">{item.split('|')[0]}</span>
                </li>
              ))}
          </ul>
        )}

        {/* CTA Button */}
        {(component.props.ctaText ||
          component.props.ctaPrimary ||
          component.props.buttonText ||
          component.props.submitText) && (
          <div className="mt-6">
            <button
              className={`rounded-lg px-8 py-4 font-semibold text-lg shadow-lg transition-transform hover:scale-105 ${
                ['headline', 'button'].includes(component.category)
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {String(
                component.props.ctaText ||
                  component.props.ctaPrimary ||
                  component.props.buttonText ||
                  component.props.submitText
              )}
            </button>
          </div>
        )}

        {/* FAQ Items */}
        {component.props.items && (
          <div className="mt-6 space-y-4">
            {String(component.props.items)
              .split('\n')
              .map((item, i) => {
                const [question, answer] = item.split('|');
                return (
                  <div key={i} className="rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900">{question}</h4>
                    {answer && (
                      <p className="mt-2 text-gray-600">{answer}</p>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
