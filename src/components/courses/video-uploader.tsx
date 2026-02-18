"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, X } from "lucide-react";

interface VideoUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

export function VideoUploader({
  value,
  onChange,
  onUploadStart,
  onUploadEnd,
}: VideoUploaderProps) {
  const [urlInput, setUrlInput] = useState(value || "");

  const handleApply = () => {
    onUploadStart?.();
    onChange(urlInput.trim());
    onUploadEnd?.();
  };

  const handleClear = () => {
    setUrlInput("");
    onChange("");
  };

  return (
    <div className="space-y-3">
      <Label>動画 URL</Label>

      {value ? (
        <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
          <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm">{value}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex h-16 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/30">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Video className="h-5 w-5" />
            <span className="text-sm">動画URLを入力してください</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="YouTube / Vimeo / 動画URL を入力..."
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
