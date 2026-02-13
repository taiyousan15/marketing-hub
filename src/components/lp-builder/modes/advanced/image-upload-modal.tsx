'use client';

/**
 * 画像アップロードモーダル
 * - ファイルアップロード（ドラッグ&ドロップ対応）
 * - AI画像生成（NanoBanana Pro API）
 */

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Upload,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (url: string) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
type GenerateStatus = 'idle' | 'generating' | 'success' | 'error';

export function ImageUploadModal({
  isOpen,
  onClose,
  onImageSelected,
}: ImageUploadModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'ai-generate'>('upload');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [generateStatus, setGenerateStatus] = useState<GenerateStatus>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイルアップロード処理
  const handleFileUpload = useCallback(async (file: File) => {
    setUploadStatus('uploading');
    setErrorMessage(null);

    // クライアント側バリデーション
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('対応していないファイル形式です（JPEG, PNG, GIF, WebP のみ）');
      setUploadStatus('error');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrorMessage('ファイルサイズは5MB以下にしてください');
      setUploadStatus('error');
      return;
    }

    // プレビュー表示
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // サーバーにアップロード
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/lp-builder/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'アップロードに失敗しました');
      }

      setUploadStatus('success');
      onImageSelected(data.url);
      setTimeout(() => {
        onClose();
        resetState();
      }, 500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'アップロードに失敗しました');
      setUploadStatus('error');
    }
  }, [onClose, onImageSelected]);

  // ドラッグ&ドロップハンドラー
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  // ファイル選択ハンドラー
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  // AI画像生成
  const handleAiGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) {
      setErrorMessage('プロンプトを入力してください');
      return;
    }

    setGenerateStatus('generating');
    setErrorMessage(null);
    setGeneratedImageUrl(null);

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '画像生成に失敗しました');
      }

      setGeneratedImageUrl(data.url);
      setGenerateStatus('success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '画像生成に失敗しました');
      setGenerateStatus('error');
    }
  }, [aiPrompt]);

  // 生成画像を使用
  const handleUseGeneratedImage = useCallback(() => {
    if (generatedImageUrl) {
      onImageSelected(generatedImageUrl);
      onClose();
      resetState();
    }
  }, [generatedImageUrl, onImageSelected, onClose]);

  // 状態リセット
  const resetState = useCallback(() => {
    setUploadStatus('idle');
    setGenerateStatus('idle');
    setDragActive(false);
    setPreviewUrl(null);
    setErrorMessage(null);
    setAiPrompt('');
    setGeneratedImageUrl(null);
  }, []);

  // モーダルを閉じる時にリセット
  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            画像を追加
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'ai-generate')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              アップロード
            </TabsTrigger>
            <TabsTrigger value="ai-generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI生成
            </TabsTrigger>
          </TabsList>

          {/* アップロードタブ */}
          <TabsContent value="upload" className="mt-4">
            <div
              className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${uploadStatus === 'error' ? 'border-red-300 bg-red-50' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploadStatus === 'uploading' ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                  <p className="text-gray-600">アップロード中...</p>
                </div>
              ) : previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="プレビュー"
                    className="mx-auto max-h-48 rounded-lg object-contain"
                  />
                  {uploadStatus === 'success' && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-green-500/20">
                      <span className="rounded-full bg-green-500 px-3 py-1 text-sm font-medium text-white">
                        完了
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setPreviewUrl(null);
                      setUploadStatus('idle');
                    }}
                    className="absolute -right-2 -top-2 rounded-full bg-gray-800 p-1 text-white hover:bg-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-3 text-gray-600">
                    ファイルをドラッグ&ドロップ
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    または
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    ファイルを選択
                  </Button>
                  <p className="mt-3 text-xs text-gray-400">
                    JPEG, PNG, GIF, WebP（5MBまで）
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* URLから追加 */}
            <div className="mt-4">
              <Label className="text-sm text-gray-600">または画像URLを入力</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const url = (e.target as HTMLInputElement).value;
                      if (url) {
                        onImageSelected(url);
                        handleClose();
                      }
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={(e) => {
                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                    if (input?.value) {
                      onImageSelected(input.value);
                      handleClose();
                    }
                  }}
                >
                  追加
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* AI生成タブ */}
          <TabsContent value="ai-generate" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-prompt">画像の説明（プロンプト）</Label>
                <Textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="例: ビジネスマンが成功を喜んでいるイラスト、青を基調としたモダンなデザイン"
                  className="mt-1 min-h-[100px]"
                />
                <p className="mt-1 text-xs text-gray-500">
                  NanoBanana Pro（Google Gemini）で画像を生成します
                </p>
              </div>

              {/* 生成ボタン */}
              <Button
                onClick={handleAiGenerate}
                disabled={generateStatus === 'generating' || !aiPrompt.trim()}
                className="w-full"
              >
                {generateStatus === 'generating' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    画像を生成
                  </>
                )}
              </Button>

              {/* 生成結果 */}
              {generatedImageUrl && (
                <div className="mt-4 rounded-lg border p-4">
                  <img
                    src={generatedImageUrl}
                    alt="生成された画像"
                    className="mx-auto max-h-64 rounded-lg object-contain"
                  />
                  <Button
                    onClick={handleUseGeneratedImage}
                    className="mt-4 w-full"
                  >
                    この画像を使用
                  </Button>
                </div>
              )}

              {/* プリセットプロンプト */}
              <div>
                <Label className="text-sm text-gray-600">クイックプロンプト</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    'ビジネス成功イメージ',
                    'オンライン講座イメージ',
                    'デジタルマーケティング',
                    'チームワーク・協力',
                    '成長・上昇グラフ',
                    'カスタマーサポート',
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAiPrompt(preset)}
                      className="rounded-full border px-3 py-1 text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
