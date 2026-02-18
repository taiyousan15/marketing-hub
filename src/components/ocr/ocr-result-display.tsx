"use client";

import { useState } from "react";
import { Copy, Download, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OcrResult } from "@/lib/ocr/types";

interface OcrResultDisplayProps {
  result: OcrResult;
}

const confidenceConfig: Record<OcrResult["confidence"], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  high: { label: "高信頼度", variant: "default" },
  medium: { label: "中信頼度", variant: "secondary" },
  low: { label: "低信頼度", variant: "destructive" },
};

const modeLabel: Record<OcrResult["mode"], string> = {
  text: "テキスト",
  table: "テーブル",
  formula: "数式",
  auto: "自動検出",
};

export function OcrResultDisplay({ result }: OcrResultDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = result.mode === "table" ? "md" : "txt";
    const blob = new Blob([result.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ocr-result.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const conf = confidenceConfig[result.confidence];

  return (
    <div className="space-y-3">
      {/* メタ情報 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline">{modeLabel[result.mode]}</Badge>
        <Badge variant={conf.variant}>{conf.label}</Badge>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {result.processingTimeMs.toLocaleString()}ms
        </span>
        <span className="text-xs text-muted-foreground ml-auto">{result.model}</span>
      </div>

      {/* 結果本文 */}
      <div className="relative">
        <pre className="text-sm whitespace-pre-wrap font-mono bg-muted rounded-lg p-4 max-h-96 overflow-y-auto border">
          {result.content || "（結果なし）"}
        </pre>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          {copied ? "コピー済み" : "コピー"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" />
          ダウンロード
        </Button>
      </div>
    </div>
  );
}
