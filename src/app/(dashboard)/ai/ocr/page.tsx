"use client";

import { useState, useEffect } from "react";
import { ScanText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OcrUploadZone } from "@/components/ocr/ocr-upload-zone";
import { OcrResultDisplay } from "@/components/ocr/ocr-result-display";
import type { OcrMode, OcrResult, OcrHealthStatus } from "@/lib/ocr/types";

const MODE_OPTIONS: { value: OcrMode; label: string; description: string }[] = [
  { value: "auto", label: "自動検出", description: "コンテンツを自動判別して最適な形式で出力" },
  { value: "text", label: "テキスト抽出", description: "画像内のすべてのテキストを抽出" },
  { value: "table", label: "テーブル解析", description: "表をMarkdown形式で出力" },
  { value: "formula", label: "数式認識", description: "数式をLaTeX形式で出力" },
];

const LANG_OPTIONS = [
  { value: "auto", label: "自動" },
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
];

export default function OcrPage() {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mode, setMode] = useState<OcrMode>("auto");
  const [language, setLanguage] = useState("auto");
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<OcrHealthStatus | null>(null);

  // ヘルスチェック（マウント時）
  useEffect(() => {
    fetch("/api/ai/ocr/health")
      .then((r) => r.json())
      .then((data: OcrHealthStatus) => setHealth(data))
      .catch(() => setHealth({ available: false, model: "unknown", error: "接続確認に失敗しました" }));
  }, []);

  const handleExtract = async () => {
    if (!imageBase64) return;
    setIsExtracting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mode,
          language,
          additionalPrompt: additionalPrompt.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OCR処理に失敗しました");
      }

      setResult(data.result as OcrResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  const currentMode = MODE_OPTIONS.find((m) => m.value === mode);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ScanText className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">AI OCR</h1>
        </div>
        <p className="text-muted-foreground">
          Qwen Vision (Ollama) を使ってローカルでOCR処理。テキスト・表・数式を高精度に抽出します。
        </p>

        {/* Ollamaヘルスステータス */}
        {health !== null && (
          <div className={`mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded-lg w-fit
            ${health.available ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {health.available ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>
              {health.available
                ? `Ollama 接続中 — ${health.model}`
                : `Ollama 未接続 — ${health.error || "起動していません"}`}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左カラム: 入力 */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">画像をアップロード</CardTitle>
              <CardDescription>PNG, JPG, WebP 対応 / クリップボードペーストも可</CardDescription>
            </CardHeader>
            <CardContent>
              <OcrUploadZone imageBase64={imageBase64} onImageChange={setImageBase64} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">OCR設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* モード選択 */}
              <div className="space-y-2">
                <Label>解析モード</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as OcrMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentMode && (
                  <p className="text-xs text-muted-foreground">{currentMode.description}</p>
                )}
              </div>

              {/* 言語選択 */}
              <div className="space-y-2">
                <Label>出力言語</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANG_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 追加プロンプト */}
              <div className="space-y-2">
                <Label>追加指示（任意）</Label>
                <Textarea
                  value={additionalPrompt}
                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                  placeholder="例: 固有名詞はそのまま残してください / 表のヘッダー行を太字にしてください"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {additionalPrompt.length}/500
                </p>
              </div>

              {/* 実行ボタン */}
              <Button
                onClick={handleExtract}
                disabled={!imageBase64 || isExtracting}
                className="w-full gap-2"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <ScanText className="h-4 w-4" />
                    OCR実行
                  </>
                )}
              </Button>

              {!health?.available && health !== null && (
                <p className="text-xs text-red-600 text-center">
                  Ollama が起動していないため実行できません
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右カラム: 結果 */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">抽出結果</CardTitle>
                {result && (
                  <Badge variant="outline" className="text-xs">
                    完了
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {isExtracting && !result && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm">Qwen Vision で解析中...</p>
                  <p className="text-xs">画像サイズによっては数十秒かかる場合があります</p>
                </div>
              )}

              {result && !isExtracting && (
                <OcrResultDisplay result={result} />
              )}

              {!result && !isExtracting && !error && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <ScanText className="h-10 w-10 opacity-30" />
                  <p className="text-sm">画像をアップロードして「OCR実行」を押してください</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
