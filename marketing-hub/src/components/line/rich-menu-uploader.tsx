"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichMenuUploaderProps {
  richMenuId: string;
  currentImageUrl?: string | null;
  onUploadComplete: () => void;
}

export function RichMenuUploader({
  richMenuId,
  currentImageUrl,
  onUploadComplete,
}: RichMenuUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("richMenuId", richMenuId);

        const res = await fetch("/api/line/rich-menu/image", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "アップロードに失敗しました");
        }

        onUploadComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : "アップロードに失敗しました");
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [richMenuId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxSize: 1024 * 1024, // 1MB
    multiple: false,
    disabled: uploading,
  });

  const hasImage = preview || currentImageUrl;

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer
          ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">アップロード中...</p>
          </div>
        ) : hasImage ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={preview || currentImageUrl || ""}
                alt="リッチメニュー画像"
                className="max-h-48 rounded-lg shadow-sm"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              クリックまたはドラッグで画像を変更
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="p-3 rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDragActive ? "ここにドロップ" : "画像をアップロード"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG/PNG、最大1MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">推奨サイズ:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>フルサイズ: 2500 x 1686px</li>
          <li>ハーフサイズ: 2500 x 843px</li>
          <li>コンパクト: 1200 x 810px または 1200 x 405px</li>
        </ul>
      </div>
    </div>
  );
}
