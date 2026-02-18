export type OcrMode = "text" | "table" | "formula" | "auto";

export interface OcrRequest {
  imageBase64: string; // base64エンコード画像（data:prefix除去済み）
  mode: OcrMode;
  language?: "ja" | "en" | "auto";
  additionalPrompt?: string;
}

export interface OcrResult {
  mode: OcrMode;
  content: string;
  confidence: "high" | "medium" | "low";
  model: string;
  processingTimeMs: number;
}

export interface OcrHealthStatus {
  available: boolean;
  model: string;
  error?: string;
}
