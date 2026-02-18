import type { OcrMode } from "./types";

const LANG_SUFFIX: Record<string, string> = {
  ja: "日本語でのみ出力してください。",
  en: "Output in English only.",
  auto: "",
};

const MODE_PROMPTS: Record<OcrMode, string> = {
  text: `あなたは高精度OCRエンジンです。
画像内のすべてのテキストを正確に抽出してください。

ルール:
- 元の段落構造・改行を忠実に再現する
- 文字の誤認識がある場合は [?] で示す
- 画像にテキストがない場合は「テキストが見つかりません」と返す
- 装飾や説明は一切加えず、抽出テキストのみを出力する`,

  table: `あなたは高精度OCRエンジンです。
画像内のテーブル（表）を検出し、Markdownテーブル形式で出力してください。

ルール:
- テーブル構造を正確に再現する（行・列の数を維持）
- ヘッダー行がある場合は正しく識別する
- 複数のテーブルがある場合はすべて出力する
- テーブル以外のテキストがあれば、テーブルの前後に通常テキストとして追加する
- Markdown形式: | col1 | col2 | ... |`,

  formula: `あなたは高精度OCRエンジンです。
画像内の数式・方程式・数学的表現を検出し、LaTeX形式で出力してください。

ルール:
- インライン数式は $...$ で囲む
- ブロック数式は $$...$$ で囲む
- 複数の数式はすべて出力する
- 数式以外のテキストがあれば通常テキストとして追加する
- LaTeX記法: \\frac, \\sum, \\int, \\sqrt など標準コマンドを使用`,

  auto: `あなたは高精度OCRエンジンです。
画像の内容を分析し、最適な形式で出力してください。

判断基準:
- テキストのみ → プレーンテキストとして抽出
- テーブル・表が含まれる → Markdownテーブル形式
- 数式・方程式が含まれる → LaTeX形式
- 混在している → 各セクションを適切な形式で組み合わせる

出力の先頭に「[検出形式: text/table/formula/mixed]」と記載してから内容を出力してください。`,
};

export function buildSystemPrompt(mode: OcrMode, language: string = "auto"): string {
  const base = MODE_PROMPTS[mode];
  const langSuffix = LANG_SUFFIX[language] || "";
  return langSuffix ? `${base}\n\n${langSuffix}` : base;
}

export function buildUserMessage(additionalPrompt?: string): string {
  if (additionalPrompt) {
    return `画像を解析してください。追加指示: ${additionalPrompt}`;
  }
  return "画像を解析してください。";
}
