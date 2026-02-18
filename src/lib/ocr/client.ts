import type { OcrRequest, OcrResult, OcrHealthStatus } from "./types";
import { buildSystemPrompt, buildUserMessage } from "./prompts";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_OCR_MODEL = process.env.OLLAMA_OCR_MODEL || "qwen2.5vl:7b";

function estimateConfidence(
  content: string,
  mode: string
): OcrResult["confidence"] {
  if (!content || content.trim().length < 5) return "low";
  if (content.includes("[?]")) return "medium";

  if (mode === "table") {
    // Markdownテーブルが含まれているか確認
    const hasTable = content.includes("|") && content.includes("---");
    return hasTable ? "high" : "medium";
  }

  if (mode === "formula") {
    // LaTeX記法が含まれているか確認
    const hasLatex = content.includes("$") || content.includes("\\");
    return hasLatex ? "high" : "medium";
  }

  // テキストの長さと構造で推定
  const lineCount = content.split("\n").length;
  if (content.length > 50 && lineCount > 1) return "high";
  if (content.length > 20) return "medium";
  return "low";
}

export class OcrClient {
  private baseUrl: string;
  private model: string;

  constructor(options?: { baseUrl?: string; model?: string }) {
    this.baseUrl = options?.baseUrl || OLLAMA_BASE_URL;
    this.model = options?.model || DEFAULT_OCR_MODEL;
  }

  async extract(request: OcrRequest): Promise<OcrResult> {
    const start = performance.now();

    const systemPrompt = buildSystemPrompt(request.mode, request.language);
    const userMessage = buildUserMessage(request.additionalPrompt);

    // base64からdata:prefixを除去（ブラウザ側でreadAsDataURLした場合に付いてくる）
    const imageBase64 = request.imageBase64.replace(/^data:[^;]+;base64,/, "");

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userMessage,
            images: [imageBase64],
          },
        ],
        stream: false,
        options: {
          temperature: 0.1, // OCRは精度重視
          num_predict: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 404) {
        throw new Error(`モデル "${this.model}" が見つかりません。ollama pull ${this.model} を実行してください。`);
      }
      throw new Error(`Ollama OCR エラー: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const content: string = data.message?.content || "";
    const processingTimeMs = Math.round(performance.now() - start);

    return {
      mode: request.mode,
      content,
      confidence: estimateConfidence(content, request.mode),
      model: data.model || this.model,
      processingTimeMs,
    };
  }

  async checkHealth(): Promise<OcrHealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return { available: false, model: this.model, error: "Ollama に接続できません" };
      }

      const data = await response.json();
      const models: Array<{ name: string }> = data.models || [];
      const modelExists = models.some((m) => m.name.startsWith(this.model.split(":")[0]));

      if (!modelExists) {
        return {
          available: false,
          model: this.model,
          error: `モデル "${this.model}" がインストールされていません。ollama pull ${this.model} を実行してください。`,
        };
      }

      return { available: true, model: this.model };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return { available: false, model: this.model, error: `接続エラー: ${msg}` };
    }
  }
}
