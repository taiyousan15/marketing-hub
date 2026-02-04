'use client';

/**
 * LP Builder 画像アップローダー
 * ドラッグ&ドロップ、ファイル選択、URL入力に対応
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader2, Link, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aiAssistEnabled?: boolean;
  onAiGenerate?: (prompt: string) => Promise<string | null>;
}

export function ImageUploader({
  value,
  onChange,
  label = '画像',
  aiAssistEnabled = false,
  onAiGenerate,
}: ImageUploaderProps) {
  // Debug: Check if aiAssistEnabled is being passed correctly
  console.log('ImageUploader aiAssistEnabled:', aiAssistEnabled, 'label:', label);

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  /**
   * ファイルアップロード処理
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // プレビュー表示
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // アップロード
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/lp-builder/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'アップロードに失敗しました');
        }

        onChange(data.url);
        setPreview(null);
        toast.success('画像をアップロードしました');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'アップロードに失敗しました');
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: uploading,
    noClick: true, // カスタムボタンを使用
  });

  /**
   * URL入力による設定
   */
  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      toast.success('画像URLを設定しました');
    }
  };

  /**
   * AI画像生成
   */
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || !onAiGenerate) return;

    setGenerating(true);
    try {
      const url = await onAiGenerate(aiPrompt);
      if (url) {
        onChange(url);
        setAiPrompt('');
        toast.success('AI画像を生成しました');
      }
    } catch (err) {
      toast.error('画像生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * 画像削除
   */
  const handleRemove = () => {
    onChange('');
    setPreview(null);
  };

  const hasImage = value && value.trim() !== '';
  const displayImage = preview || value;

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className={`grid w-full ${aiAssistEnabled ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="upload" className="text-xs">
            <Upload className="mr-1 h-3 w-3" />
            アップロード
          </TabsTrigger>
          <TabsTrigger value="url" className="text-xs">
            <Link className="mr-1 h-3 w-3" />
            URL
          </TabsTrigger>
          {aiAssistEnabled && (
            <TabsTrigger value="ai" className="text-xs">
              <Sparkles className="mr-1 h-3 w-3" />
              AI生成
            </TabsTrigger>
          )}
        </TabsList>

        {/* アップロードタブ */}
        <TabsContent value="upload" className="mt-3">
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-lg transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${uploading ? 'opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />

            {uploading ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">アップロード中...</p>
              </div>
            ) : hasImage ? (
              <div className="p-4">
                <div className="relative">
                  <img
                    src={displayImage}
                    alt={label}
                    className="h-32 w-full rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-image.png';
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={open}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  画像を変更
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="p-3 rounded-full bg-muted">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {isDragActive ? 'ここにドロップ' : 'ドラッグ&ドロップ'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    または
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={open}>
                  <Upload className="mr-2 h-4 w-4" />
                  ファイルを選択
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, GIF, WebP（最大5MB）
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* URLタブ */}
        <TabsContent value="url" className="mt-3 space-y-3">
          {hasImage && (
            <div className="relative">
              <img
                src={value}
                alt={label}
                className="h-32 w-full rounded-lg object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <Button type="button" onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
              設定
            </Button>
          </div>
        </TabsContent>

        {/* AI生成タブ */}
        {aiAssistEnabled && (
          <TabsContent value="ai" className="mt-3 space-y-3">
            {hasImage && (
              <div className="relative">
                <img
                  src={value}
                  alt={label}
                  className="h-32 w-full rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="例: プロフェッショナルなビジネスヒーロー画像"
                disabled={generating}
              />
              <Button
                type="button"
                className="w-full"
                onClick={handleAiGenerate}
                disabled={!aiPrompt.trim() || generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    NanoBanana Proで生成
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                AIが画像を自動生成します
              </p>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
