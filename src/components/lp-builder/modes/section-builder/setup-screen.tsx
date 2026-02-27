'use client';

/**
 * セクションビルダー — セットアップ画面
 * LP種類・デザインスタイル・コンテンツ入力方法を選択する
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Upload, MessageSquare, Palette } from 'lucide-react';
import { LP_DESIGN_STYLES } from '@/lib/lp-design-styles';
import {
  LP_TYPE_LABELS,
  LP_TYPE_DESCRIPTIONS,
} from './section-templates';
import { SectionBuilderLPType, SectionBuilderInputMethod } from '../../types';

interface SetupScreenProps {
  onStart: (config: SetupConfig) => void;
}

export interface SetupConfig {
  lpType: SectionBuilderLPType;
  inputMethod: SectionBuilderInputMethod;
  designStyleId: string;
  industry: string;
  script: string;
}

const LP_TYPE_ICONS: Record<SectionBuilderLPType, string> = {
  optin: '🎁',
  sales: '💰',
  webinar: '🎤',
};

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [lpType, setLpType] = useState<SectionBuilderLPType>('optin');
  const [inputMethod, setInputMethod] = useState<SectionBuilderInputMethod>('manual');
  const [designStyleId, setDesignStyleId] = useState('1');
  const [industry, setIndustry] = useState('');
  const [script, setScript] = useState('');
  const [step, setStep] = useState<'type' | 'input' | 'style'>('type');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setScript(String(ev.target?.result ?? ''));
    };
    reader.readAsText(file);
  };

  const canProceed =
    step === 'type' ||
    (step === 'input' && (inputMethod === 'manual' || script.trim().length > 0)) ||
    step === 'style';

  const handleNext = () => {
    if (step === 'type') setStep('input');
    else if (step === 'input') setStep('style');
    else {
      onStart({ lpType, inputMethod, designStyleId, industry, script });
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="w-full max-w-3xl">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700">
            <Palette className="h-4 w-4" />
            セクションビルダー
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            1セクションずつLPを組み立てる
          </h1>
          <p className="mt-2 text-gray-600">
            各セクションに合わせて画像を1枚ずつ生成し、LPを完成させます
          </p>
        </div>

        {/* ステップインジケーター */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {(['type', 'input', 'style'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  step === s
                    ? 'bg-green-600 text-white'
                    : ['type', 'input', 'style'].indexOf(step) > i
                    ? 'bg-green-200 text-green-700'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="h-px w-8 bg-gray-300" />}
            </div>
          ))}
        </div>

        {/* Step 1: LP種類 */}
        {step === 'type' && (
          <div>
            <h2 className="mb-4 text-center text-lg font-semibold text-gray-800">
              どの種類のLPを作りますか？
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {(Object.keys(LP_TYPE_LABELS) as SectionBuilderLPType[]).map((type) => (
                <Card
                  key={type}
                  className={`cursor-pointer p-5 transition-all hover:shadow-md ${
                    lpType === type
                      ? 'border-2 border-green-500 bg-green-50'
                      : 'border border-gray-200'
                  }`}
                  onClick={() => setLpType(type)}
                >
                  <div className="mb-3 text-3xl">{LP_TYPE_ICONS[type]}</div>
                  <h3 className="font-bold text-gray-900">{LP_TYPE_LABELS[type]}</h3>
                  <p className="mt-1 text-sm text-gray-600">{LP_TYPE_DESCRIPTIONS[type]}</p>
                </Card>
              ))}
            </div>

            {/* 業界入力 */}
            <div className="mt-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                業界・ジャンル（任意）
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="例: オンラインコーチング, 美容, 不動産"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                入力すると、画像スタイルが業界に合わせて最適化されます
              </p>
            </div>
          </div>
        )}

        {/* Step 2: コンテンツ入力方法 */}
        {step === 'input' && (
          <div>
            <h2 className="mb-4 text-center text-lg font-semibold text-gray-800">
              コンテンツはどうやって用意しますか？
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card
                className={`cursor-pointer p-5 transition-all hover:shadow-md ${
                  inputMethod === 'manual'
                    ? 'border-2 border-green-500 bg-green-50'
                    : 'border border-gray-200'
                }`}
                onClick={() => setInputMethod('manual')}
              >
                <MessageSquare className="mb-3 h-8 w-8 text-green-600" />
                <h3 className="font-bold text-gray-900">セクションごとに入力</h3>
                <p className="mt-1 text-sm text-gray-600">
                  各セクション画面で内容を1つずつ手入力します。AIがアドバイスします。
                </p>
                <Badge variant="secondary" className="mt-3">おすすめ</Badge>
              </Card>

              <Card
                className={`cursor-pointer p-5 transition-all hover:shadow-md ${
                  inputMethod === 'script'
                    ? 'border-2 border-green-500 bg-green-50'
                    : 'border border-gray-200'
                }`}
                onClick={() => setInputMethod('script')}
              >
                <Upload className="mb-3 h-8 w-8 text-blue-600" />
                <h3 className="font-bold text-gray-900">台本をアップロード</h3>
                <p className="mt-1 text-sm text-gray-600">
                  テキストファイルをアップロードすると、AIが各セクションに自動振り分けします。
                </p>
              </Card>
            </div>

            {inputMethod === 'script' && (
              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  台本ファイル（.txt）またはテキストを貼り付け
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-700 hover:bg-blue-100">
                    <Upload className="h-4 w-4" />
                    ファイルを選択
                    <input
                      type="file"
                      accept=".txt,text/plain"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  {script && (
                    <span className="text-sm text-green-600">
                      ✓ {script.length}文字 読み込み済み
                    </span>
                  )}
                </div>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="または、ここにテキストを直接貼り付けてください..."
                  rows={8}
                  className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: デザインスタイル */}
        {step === 'style' && (
          <div>
            <h2 className="mb-4 text-center text-lg font-semibold text-gray-800">
              デザインスタイルを選んでください
            </h2>
            <div className="grid max-h-96 gap-3 overflow-y-auto sm:grid-cols-2">
              {LP_DESIGN_STYLES.map((style) => (
                <Card
                  key={style.id}
                  className={`cursor-pointer p-4 transition-all hover:shadow-md ${
                    designStyleId === style.id
                      ? 'border-2 border-green-500 bg-green-50'
                      : 'border border-gray-200'
                  }`}
                  onClick={() => setDesignStyleId(style.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* カラーパレット */}
                    <div className="flex flex-shrink-0 gap-1">
                      {[style.baseColor, style.mainColor, style.cvColor].map((color, i) => (
                        <div
                          key={i}
                          className="h-6 w-6 rounded border border-gray-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{style.id}.</span>
                        <span className="font-semibold text-gray-900">{style.name}</span>
                        {style.isDark && (
                          <Badge variant="outline" className="text-xs">ダーク</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-600">{style.description}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {style.industries.slice(0, 3).join('・')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ナビゲーションボタン */}
        <div className="mt-8 flex items-center justify-between">
          {step !== 'type' ? (
            <Button
              variant="outline"
              onClick={() => {
                if (step === 'input') setStep('type');
                else setStep('input');
              }}
            >
              戻る
            </Button>
          ) : (
            <div />
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {step === 'style' ? 'セクション編集を始める' : '次へ'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
