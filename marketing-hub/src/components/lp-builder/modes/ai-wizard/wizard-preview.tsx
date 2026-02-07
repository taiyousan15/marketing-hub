'use client';

/**
 * AIウィザード プレビューパネル
 * 生成されたLPのリアルタイムプレビュー
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wrench,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Download,
} from 'lucide-react';
import { WizardState, ComponentInstance, PreviewConfig } from '../../types';
import { getComponentByType } from '../../components-registry';

interface WizardPreviewProps {
  wizardState: WizardState;
  components: ComponentInstance[];
  previewConfig: PreviewConfig;
  onOpenAdvanced: () => void;
}

export function WizardPreview({
  wizardState,
  components,
  previewConfig,
  onOpenAdvanced,
}: WizardPreviewProps) {
  const { answers, generatedLP, isGenerating } = wizardState;
  const hasLP = generatedLP && generatedLP.length > 0;

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
                AIがあなたの回答を元に
                <br />
                最適なLPを作成しています
              </p>
            </div>
          </div>
        ) : hasLP ? (
          <div className="mx-auto max-w-3xl">
            <Card className="overflow-hidden bg-white shadow-xl">
              {components.map((comp) => (
                <ComponentPreview key={comp.id} component={comp} />
              ))}
            </Card>
          </div>
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

interface ComponentPreviewProps {
  component: ComponentInstance;
}

function ComponentPreview({ component }: ComponentPreviewProps) {
  const componentDef = getComponentByType(component.componentType);

  // カテゴリに応じたスタイル（UTAGE互換）
  const getCategoryStyles = () => {
    switch (component.category) {
      case 'headline':
        return 'bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16';
      case 'other':
        // footer, countdown, header などを判別
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
