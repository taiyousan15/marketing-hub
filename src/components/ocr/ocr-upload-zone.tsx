"use client";

import { useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OcrUploadZoneProps {
  imageBase64: string | null;
  onImageChange: (base64: string | null) => void;
}

export function OcrUploadZone({ imageBase64, onImageChange }: OcrUploadZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageChange(result);
      };
      reader.readAsDataURL(file);
    },
    [onImageChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  // クリップボードペースト対応
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = (ev) => {
            onImageChange(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onImageChange]);

  if (imageBase64) {
    return (
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageBase64}
          alt="OCR対象画像"
          className="w-full max-h-64 object-contain rounded-lg border bg-muted"
        />
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7"
          onClick={() => onImageChange(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {isDragActive ? (
          <ImageIcon className="h-10 w-10 text-primary" />
        ) : (
          <Upload className="h-10 w-10 text-muted-foreground" />
        )}
        <div>
          <p className="font-medium text-sm">
            {isDragActive ? "ここにドロップ" : "画像をドラッグ&ドロップ"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            またはクリックして選択 / Ctrl+V でペースト
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP — 最大10MB</p>
        </div>
      </div>
    </div>
  );
}
