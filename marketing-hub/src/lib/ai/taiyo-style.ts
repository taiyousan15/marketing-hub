/**
 * 太陽スタイル コピーライティングエンジン
 *
 * 日給5000万円を生み出したコピーライティング技術を適用
 * - 176パターンのキラーワード
 * - 6つの教育要素
 * - 感情ジェットコースター
 * - 心理トリガー
 */

export interface TaiyoStyleConfig {
  /** コンテンツタイプ */
  type: 'headline' | 'subheadline' | 'body' | 'bullet' | 'cta' | 'ps' | 'urgency';
  /** ターゲットオーディエンス */
  targetAudience: string;
  /** 商品/サービス名 */
  productName: string;
  /** 主な悩み・問題 */
  painPoints: string[];
  /** ベネフィット */
  benefits: string[];
  /** トーン */
  tone?: 'professional' | 'friendly' | 'urgent' | 'emotional';
}

/**
 * 太陽スタイルのキラーワード（176パターンから抜粋）
 */
export const KILLER_WORDS = {
  urgency: [
    '今すぐ', '今日だけ', '残りわずか', '期間限定',
    '今だけ', '最後の', '先着', '本日限り'
  ],
  curiosity: [
    '秘密', '裏技', '極意', '真実', '暴露',
    '知られざる', 'なぜ', '理由', '正体'
  ],
  benefit: [
    '〜が手に入る', '〜を実現', '〜を達成', '〜が叶う',
    '〜から解放', '〜を克服', '〜を突破'
  ],
  social_proof: [
    '実績', '証拠', '結果', '〜名が実践',
    '〜%が成功', '口コミ', '評判'
  ],
  authority: [
    '専門家', 'プロ', '第一人者', '開発者',
    '〜年の経験', '〜を指導'
  ],
  scarcity: [
    '限定', '特別', '厳選', 'VIP',
    '一部の人だけ', '選ばれた'
  ],
  emotion: [
    '衝撃', '感動', '驚き', '喜び',
    '後悔', '不安', '希望', '自信'
  ],
  transformation: [
    'ビフォーアフター', '変化', '進化', '成長',
    '生まれ変わる', '覚醒', '開花'
  ]
};

/**
 * 6つの教育要素
 */
export const EDUCATION_ELEMENTS = {
  purpose: '目的 - なぜこれが必要なのか',
  problem: '問題 - 現状の課題と痛み',
  solution: '解決 - どう解決できるのか',
  value: '価値 - 得られる変化とメリット',
  trust: '信頼 - なぜあなたから学ぶべきか',
  action: '行動 - 今すぐ何をすべきか'
};

/**
 * ヘッドライン生成プロンプト
 */
export function generateHeadlinePrompt(config: TaiyoStyleConfig): string {
  return `あなたは日給5000万円を生み出すプロのコピーライターです。
以下の情報を元に、成約率を最大化するヘッドラインを3つ生成してください。

【商品/サービス】
${config.productName}

【ターゲット】
${config.targetAudience}

【悩み・問題】
${config.painPoints.map(p => `- ${p}`).join('\n')}

【得られるベネフィット】
${config.benefits.map(b => `- ${b}`).join('\n')}

【ヘッドライン作成ルール】
1. 読者の注目を一瞬で引きつける
2. 具体的な数字やメリットを入れる
3. 読者の「これは自分のことだ」と思わせる
4. 好奇心を刺激して続きを読ませる
5. 15〜25文字が理想的

【キラーワードを活用】
緊急性: ${KILLER_WORDS.urgency.slice(0, 3).join('、')}
好奇心: ${KILLER_WORDS.curiosity.slice(0, 3).join('、')}
変化: ${KILLER_WORDS.transformation.slice(0, 3).join('、')}

JSON形式で出力してください:
{
  "headlines": [
    { "text": "ヘッドライン1", "type": "問題提起型" },
    { "text": "ヘッドライン2", "type": "ベネフィット型" },
    { "text": "ヘッドライン3", "type": "好奇心型" }
  ],
  "recommended": 0
}`;
}

/**
 * ボディコピー生成プロンプト
 */
export function generateBodyPrompt(config: TaiyoStyleConfig): string {
  return `あなたは日給5000万円を生み出すプロのコピーライターです。
以下の情報を元に、感情を揺さぶるボディコピーを生成してください。

【商品/サービス】
${config.productName}

【ターゲット】
${config.targetAudience}

【悩み・問題】
${config.painPoints.map(p => `- ${p}`).join('\n')}

【得られるベネフィット】
${config.benefits.map(b => `- ${b}`).join('\n')}

【ボディコピー構成】
1. 共感パート - 読者の痛みに寄り添う（「〜で悩んでいませんか？」）
2. 問題の深掘り - 放置するリスクを示す
3. 解決策の提示 - あなたの商品が解決する方法
4. ベネフィット展開 - 得られる未来を具体的に
5. 証拠・信頼性 - なぜ信頼できるのか
6. 行動喚起 - 今すぐ行動する理由

【感情ジェットコースター】
不安 → 共感 → 希望 → 興奮 → 決断

【文体ルール】
- 「です・ます」調で親しみやすく
- 一文は短く（40文字以内）
- 具体的な数字を使う
- 「あなた」と語りかける
- 改行を多めに

JSON形式で出力してください:
{
  "empathy": "共感パート（100-150文字）",
  "problem": "問題深掘りパート（100-150文字）",
  "solution": "解決策パート（100-150文字）",
  "benefits": "ベネフィットパート（150-200文字）",
  "proof": "信頼性パート（100-150文字）",
  "cta": "行動喚起パート（50-100文字）"
}`;
}

/**
 * ブレット（箇条書き）生成プロンプト
 */
export function generateBulletPrompt(config: TaiyoStyleConfig): string {
  return `あなたは日給5000万円を生み出すプロのコピーライターです。
以下のベネフィットを、魅力的なブレット（箇条書き）に変換してください。

【商品/サービス】
${config.productName}

【ベネフィット（素材）】
${config.benefits.map((b, i) => `${i + 1}. ${b}`).join('\n')}

【ブレット変換ルール】
1. 特徴 → ベネフィット → 感情 の順で深掘り
2. 「〜だから、〜ができる。つまり〜」の構造
3. 具体的な数字や期間を入れる
4. 読者が「欲しい！」と思う表現に

【ブレットパターン】
- 「たった〜するだけで〜が手に入る」
- 「〜を知らないと〜を失い続ける」
- 「なぜ〜すると〜になるのか？その秘密は...」
- 「〜から解放される方法」

JSON形式で出力してください:
{
  "bullets": [
    { "text": "ブレット1", "emotion": "期待感" },
    { "text": "ブレット2", "emotion": "安心感" },
    ...
  ]
}`;
}

/**
 * CTA（行動喚起）生成プロンプト
 */
export function generateCTAPrompt(config: TaiyoStyleConfig): string {
  return `あなたは日給5000万円を生み出すプロのコピーライターです。
最後の一押しとなるCTA（行動喚起）を生成してください。

【商品/サービス】
${config.productName}

【ターゲット】
${config.targetAudience}

【CTA生成ルール】
1. 今すぐ行動する明確な理由を示す
2. 行動しないデメリットを暗示
3. 行動のハードルを下げる言葉を入れる
4. 緊急性・希少性を演出

【CTA要素】
- メインボタンテキスト（5-10文字）
- サブテキスト（補足・安心感）
- 緊急性メッセージ

JSON形式で出力してください:
{
  "buttonText": "メインボタンテキスト",
  "subText": "30日間の返金保証付き",
  "urgencyText": "今だけ特別価格で提供中",
  "reassurance": "メールアドレスだけで簡単登録"
}`;
}

/**
 * 追伸（P.S.）生成プロンプト
 */
export function generatePSPrompt(config: TaiyoStyleConfig): string {
  return `あなたは日給5000万円を生み出すプロのコピーライターです。
成約率を最後の一押しで上げる追伸（P.S.）を生成してください。

【商品/サービス】
${config.productName}

【追伸の役割】
- 読み飛ばした人が最後に目を止める場所
- 最も重要なメッセージを再度伝える
- 緊急性と希少性の最終アピール

【追伸パターン】
1. 特典の再確認型
2. 期限・限定の強調型
3. 共感・背中押し型
4. 未来の姿を見せる型

JSON形式で出力してください:
{
  "ps": [
    { "type": "特典再確認", "text": "追伸文1" },
    { "type": "緊急性", "text": "追伸文2" }
  ]
}`;
}

/**
 * セクションタイプに応じた画像プロンプトを生成
 */
export function generateImagePromptForSection(
  sectionType: string,
  config: TaiyoStyleConfig
): string {
  const baseStyle = 'professional, clean, modern, Japanese business style, high quality';

  const sectionPrompts: Record<string, string> = {
    hero: `Hero image for "${config.productName}". A ${config.targetAudience} achieving success, confident expression, looking toward bright future. ${baseStyle}`,
    problem: `Person facing challenges, frustrated expression but hopeful. Subtle visualization of "${config.painPoints[0] || 'common problem'}". ${baseStyle}`,
    solution: `Transformation moment, before and after concept. Person discovering the solution, "aha moment" expression. ${baseStyle}`,
    benefits: `Success visualization, person enjoying the benefits of "${config.benefits[0] || 'achievement'}". Happy, fulfilled expression. ${baseStyle}`,
    testimonial: `Professional headshot placeholder, trustworthy appearance, friendly smile. ${baseStyle}`,
    cta: `Action-oriented image, person taking decisive action, confident body language. Bright, optimistic atmosphere. ${baseStyle}`,
    faq: `Helpful customer support concept, friendly expert answering questions. ${baseStyle}`
  };

  return sectionPrompts[sectionType] || `Professional business image related to "${config.productName}". ${baseStyle}`;
}

/**
 * LP全体を生成するためのシステムプロンプト
 */
export const LP_GENERATION_SYSTEM_PROMPT = `あなたは「太陽スタイル」と呼ばれるコピーライティング技術のマスターです。
この技術は日給5000万円を生み出した実績があり、以下の特徴を持っています：

【太陽スタイルの核心】
1. 読者の感情を「ジェットコースター」のように動かす
2. 176パターンのキラーワードを適切に配置
3. 6つの教育要素（目的・問題・解決・価値・信頼・行動）を網羅
4. 「あなた」と語りかけ、親密な関係を構築
5. 具体的な数字と事例で信頼性を担保

【文章の黄金ルール】
- 一文は40文字以内
- 改行を多用して読みやすく
- 難しい言葉は使わない
- 「です・ます」調で親しみやすく
- ネガティブ→ポジティブの流れ

【禁止事項】
- 誇大広告・虚偽の表現
- 煽りすぎる表現
- 専門用語の乱用
- 長すぎる文章

あなたの使命は、読者の人生を良い方向に変えるきっかけを作ることです。
売り込みではなく、価値提供として書いてください。`;
