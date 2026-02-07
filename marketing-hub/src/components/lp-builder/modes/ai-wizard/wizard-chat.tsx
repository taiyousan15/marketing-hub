'use client';

/**
 * AIウィザード チャットUI
 * ステップバイステップの質問フロー
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { WizardState, WizardAnswers } from '../../types';
import { WIZARD_QUESTIONS } from './wizard-questions';

interface WizardChatProps {
  wizardState: WizardState;
  onSetAnswer: (key: keyof WizardAnswers, value: string | string[]) => void;
  onNext: () => void;
  onPrev: () => void;
  onGenerate: () => Promise<void>;
  onReset: () => void;
}

export function WizardChat({
  wizardState,
  onSetAnswer,
  onNext,
  onPrev,
  onGenerate,
  onReset,
}: WizardChatProps) {
  const { step, totalSteps, answers, isGenerating, error } = wizardState;
  const currentQuestion = WIZARD_QUESTIONS[step];
  const progress = ((step + 1) / totalSteps) * 100;

  const isLastStep = step === totalSteps - 1;
  const isFirstStep = step === 0;

  // 現在の質問の回答値を取得
  const getCurrentValue = () => {
    const value = answers[currentQuestion?.key as keyof WizardAnswers];
    if (Array.isArray(value)) return value.join('\n');
    return value || '';
  };

  const [inputValue, setInputValue] = useState(getCurrentValue());

  // ステップが変わったら入力値を更新
  useState(() => {
    setInputValue(getCurrentValue());
  });

  const handleNext = () => {
    if (inputValue.trim()) {
      const key = currentQuestion.key as keyof WizardAnswers;
      if (currentQuestion.type === 'multiline') {
        onSetAnswer(key, inputValue.split('\n').filter((line) => line.trim()));
      } else {
        onSetAnswer(key, inputValue);
      }
    }

    if (isLastStep) {
      onGenerate();
    } else {
      onNext();
      const nextQuestion = WIZARD_QUESTIONS[step + 1];
      const nextValue = answers[nextQuestion?.key as keyof WizardAnswers];
      setInputValue(
        Array.isArray(nextValue) ? nextValue.join('\n') : nextValue || ''
      );
    }
  };

  const handlePrev = () => {
    onPrev();
    const prevQuestion = WIZARD_QUESTIONS[step - 1];
    const prevValue = answers[prevQuestion?.key as keyof WizardAnswers];
    setInputValue(
      Array.isArray(prevValue) ? prevValue.join('\n') : prevValue || ''
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && currentQuestion?.type !== 'multiline') {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">AIウィザード</h2>
              <p className="text-sm text-gray-500">
                ステップ {step + 1} / {totalSteps}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            最初から
          </Button>
        </div>

        {/* プログレスバー */}
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* チャットコンテンツ */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 過去の質問・回答 */}
        <div className="space-y-4">
          {WIZARD_QUESTIONS.slice(0, step).map((q, i) => {
            const answer = answers[q.key as keyof WizardAnswers];
            return (
              <div key={q.key}>
                {/* 質問 */}
                <div className="mb-2 flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600">
                    AI
                  </div>
                  <Card className="bg-gray-50 p-3">
                    <p className="text-sm text-gray-600">{q.question}</p>
                  </Card>
                </div>
                {/* 回答 */}
                {answer && (
                  <div className="mb-4 flex items-start justify-end gap-3">
                    <Card className="bg-blue-50 p-3">
                      <p className="text-sm text-gray-800">
                        {Array.isArray(answer) ? answer.join('、') : answer}
                      </p>
                    </Card>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* 現在の質問 */}
          {currentQuestion && !isGenerating && (
            <div>
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600">
                  AI
                </div>
                <Card className="max-w-md bg-gray-50 p-4">
                  <p className="font-medium text-gray-900">{currentQuestion.question}</p>
                  {currentQuestion.helpText && (
                    <p className="mt-2 text-sm text-gray-500">{currentQuestion.helpText}</p>
                  )}
                  {currentQuestion.examples && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-400">例:</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {currentQuestion.examples.map((ex) => (
                          <Badge
                            key={ex}
                            variant="secondary"
                            className="cursor-pointer text-xs hover:bg-gray-200"
                            onClick={() => setInputValue(ex)}
                          >
                            {ex}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* 生成中 */}
          {isGenerating && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              </div>
              <Card className="bg-purple-50 p-4">
                <p className="font-medium text-purple-900">LPを生成中...</p>
                <p className="mt-1 text-sm text-purple-600">
                  AIがあなたの回答を元に最適なLPを作成しています
                </p>
              </Card>
            </div>
          )}

          {/* エラー */}
          {error && (
            <div className="rounded-lg bg-red-50 p-4">
              <p className="font-medium text-red-900">エラーが発生しました</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onGenerate}
              >
                再試行
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 入力エリア */}
      {!isGenerating && currentQuestion && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="space-y-4">
            {currentQuestion.type === 'multiline' ? (
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentQuestion.placeholder}
                rows={4}
                className="resize-none"
              />
            ) : currentQuestion.type === 'select' ? (
              <div className="flex flex-wrap gap-2">
                {currentQuestion.options?.map((option) => (
                  <Button
                    key={option.value}
                    variant={inputValue === option.value ? 'default' : 'outline'}
                    onClick={() => setInputValue(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            ) : (
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentQuestion.placeholder}
                className="text-lg"
              />
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={isFirstStep}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                戻る
              </Button>
              <Button
                onClick={handleNext}
                disabled={!inputValue.trim() && currentQuestion.required}
                className={isLastStep ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                {isLastStep ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    LPを生成
                  </>
                ) : (
                  <>
                    次へ
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
