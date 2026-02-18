"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image, X } from "lucide-react";

interface ThumbnailUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
}

export function ThumbnailUploader({ value, onChange }: ThumbnailUploaderProps) {
  const [urlInput, setUrlInput] = useState(value || "");

  const handleApply = () => {
    onChange(urlInput.trim());
  };

  const handleClear = () => {
    setUrlInput("");
    onChange("");
  };

  return (
    <div className="space-y-3">
      <Label>サムネイル画像</Label>

      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Thumbnail preview"
            className="h-32 w-48 rounded-md object-cover border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {!value && (
        <div className="flex h-32 w-48 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/30">
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Image className="h-6 w-6" />
            <span className="text-xs">画像なし</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="画像URL を入力..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={handleApply}>
          適用
        </Button>
      </div>
    </div>
  );
}
