/**
 * LP Designer Pro — 12デザインスタイルライブラリ
 * BananaX NanoBanana Pro準拠 / UTAGE LP Builder最適化
 *
 * ユーザーがLP Builderウィザードでデザインスタイルを選択すると、
 * 画像プロンプトとコピー生成のトーンに自動反映される。
 */

export interface LPDesignStyle {
  /** 1〜12の番号 */
  id: string;
  /** 表示名 */
  name: string;
  /** 一言説明 */
  description: string;
  /** 推奨業種 */
  industries: string[];
  /** トーン */
  tone: string;
  /** ベースカラー (70%) */
  baseColor: string;
  /** メインカラー (25%) */
  mainColor: string;
  /** CVカラー (5%) */
  cvColor: string;
  /** 文字色 */
  textColor: string;
  /** アクセントカラー */
  accentColor: string;
  /** 画像スタイル説明（英語 — 画像プロンプト用） */
  imageStylePrompt: string;
  /** 背景スタイル説明（英語 — 画像プロンプト用） */
  backgroundPrompt: string;
  /** ダーク背景かどうか（UTAGEでの視認性注意） */
  isDark: boolean;
}

export const LP_DESIGN_STYLES: LPDesignStyle[] = [
  {
    id: '1',
    name: 'フラットイラスト',
    description: '万能・デフォルト。迷ったらこれ。',
    industries: ['全般', 'セミナー', 'コンサル', '教育'],
    tone: '親しみやすい、ポップ、明るい、清潔、プロフェッショナル',
    baseColor: '#FFFFFF',
    mainColor: '#4A90D9',
    cvColor: '#FF6B35',
    textColor: '#000000',
    accentColor: '#4A90D9',
    imageStylePrompt:
      'flat design illustration, simple icons, anime-style characters, bright colors, professional',
    backgroundPrompt: 'white background, clean minimal layout',
    isDark: false,
  },
  {
    id: '2',
    name: 'ミニマル・クリーン',
    description: 'ハイブランド・高単価商材・洗練されたイメージ',
    industries: ['ハイブランド', 'デザイン', '建築', 'アート', 'コンサル高額帯'],
    tone: 'シンプル、洗練、静寂、モダン、大人',
    baseColor: '#FFFFFF',
    mainColor: '#000000',
    cvColor: '#D3D3D3',
    textColor: '#000000',
    accentColor: '#D3D3D3',
    imageStylePrompt:
      'ultra-minimal thin line art, geometric shapes, monochrome, elegant, wide margins, sans-serif',
    backgroundPrompt: 'pure white background, abundant white space',
    isDark: false,
  },
  {
    id: '3',
    name: '北欧ナチュラル',
    description: 'ライフスタイル・暮らし・女性向けサービス',
    industries: ['ライフスタイル', 'オーガニック', 'ヨガ', 'カフェ', 'インテリア'],
    tone: '北欧、暮らし、おしゃれ、自然体、シンプル',
    baseColor: '#FFFFFF',
    mainColor: '#8FBC8F',
    cvColor: '#DEB887',
    textColor: '#4A4A4A',
    accentColor: '#8FBC8F',
    imageStylePrompt:
      'Scandinavian textile pattern, simplified leaf and flower motifs, earth tones, natural materials, cozy lifestyle',
    backgroundPrompt: 'white background with subtle wood texture, natural light',
    isDark: false,
  },
  {
    id: '4',
    name: 'ペーパークラフト',
    description: '教育・子育て・手作り感・温かみを出したいLP',
    industries: ['教育', '子育て', 'ハンドメイド', '料理教室', 'ワークショップ'],
    tone: '温かい、クラフト感、童話的、立体的、手作り',
    baseColor: '#FFF8DC',
    mainColor: '#CD853F',
    cvColor: '#FF6347',
    textColor: '#5C4033',
    accentColor: '#CD853F',
    imageStylePrompt:
      'paper craft collage, cut paper effect, layered paper shadows, pastel colored construction paper, scissors-cut edges',
    backgroundPrompt: 'pastel colored paper background with paper texture',
    isDark: false,
  },
  {
    id: '5',
    name: 'かわいい・パステル',
    description: '女性向け・美容・占い・原宿系ブランド',
    industries: ['美容', '占い', '恋愛', 'アイドル', 'ファッション', '10-20代女性向け'],
    tone: '超カワイイ、原宿、ポップ、夢可愛い、乙女チック',
    baseColor: '#FFD1DC',
    mainColor: '#9370DB',
    cvColor: '#FF69B4',
    textColor: '#9370DB',
    accentColor: '#00FFFF',
    imageStylePrompt:
      'super kawaii harajuku style, star and heart motifs, sticker collage, vinyl gloss, bubbly cute characters',
    backgroundPrompt: 'pale pink background with sparkles and hearts',
    isDark: false,
  },
  {
    id: '6',
    name: '和風・墨絵',
    description: '和のラグジュアリー・伝統産業・高級和食・旅館',
    industries: ['和食', '旅館', '茶道', '書道', '日本酒', '伝統工芸', '着物'],
    tone: 'エレガント、伝統的、禅、力強い、洗練',
    baseColor: '#F5F0E8',
    mainColor: '#000000',
    cvColor: '#CC3333',
    textColor: '#000000',
    accentColor: '#D4AF37',
    imageStylePrompt:
      'Japanese ink wash painting, sumi-e style, gold leaf accents, circular ensho brushwork, calligraphy',
    backgroundPrompt: 'washi paper texture, fibrous handmade paper background',
    isDark: false,
  },
  {
    id: '7',
    name: '禅・ミニマル',
    description: 'スピリチュアル・マインドフルネス・ヒーリング',
    industries: ['瞑想', 'ヨガ上級', 'スピリチュアル', 'カウンセリング', '整体'],
    tone: '穏やか、瞑想的、洗練、静寂、精神的',
    baseColor: '#F5F5F5',
    mainColor: '#2F4F4F',
    cvColor: '#708090',
    textColor: '#808080',
    accentColor: '#2F4F4F',
    imageStylePrompt:
      'zen minimal, smooth stones, dry garden sand patterns, asymmetric balance, extreme negative space',
    backgroundPrompt: 'sand texture or clean white, zen garden atmosphere',
    isDark: false,
  },
  {
    id: '8',
    name: 'ダークモード・テック',
    description: 'IT・SaaS・AI・プログラミング・先端技術',
    industries: ['SaaS', 'AI', 'プログラミング', 'テック系スタートアップ', '開発者向け'],
    tone: '現代的、デジタル、没入感、高コントラスト、UI',
    baseColor: '#121212',
    mainColor: '#00E0FF',
    cvColor: '#FF4081',
    textColor: '#FFFFFF',
    accentColor: '#00E0FF',
    imageStylePrompt:
      'dark mode UI design, HUD-style data visualization, glowing neon flat icons, card-based layout, futuristic tech',
    backgroundPrompt: 'dark gray #121212 background, subtle grid pattern',
    isDark: true,
  },
  {
    id: '9',
    name: 'グラスモーフィズム',
    description: 'モダンなアプリ紹介・高級感あるデジタルサービス',
    industries: ['アプリ', 'Fintech', 'デジタルサービス', '高級サブスク'],
    tone: 'モダン、高級感、深淵、UI、光',
    baseColor: '#1A1A2E',
    mainColor: '#FFFFFF',
    cvColor: '#7B68EE',
    textColor: '#FFFFFF',
    accentColor: '#FFFFFF',
    imageStylePrompt:
      'glassmorphism design, frosted glass cards, strong blur background, white highlight borders, light reflection effects',
    backgroundPrompt: 'dark gradient #1A1A2E to #16213E background, bokeh lights',
    isDark: true,
  },
  {
    id: '10',
    name: '構成主義・ボールド',
    description: '強いメッセージ性・革新的サービス・インパクト重視',
    industries: ['政治', '社会運動', '革新的スタートアップ', '強メッセージ型セミナー'],
    tone: '革命、力、幾何学、ポスター、大胆',
    baseColor: '#EDEADE',
    mainColor: '#D22630',
    cvColor: '#D22630',
    textColor: '#000000',
    accentColor: '#D22630',
    imageStylePrompt:
      'constructivist poster style, diagonal composition, giant circles and thick lines, bold geometric shapes, montage',
    backgroundPrompt: 'antique white #EDEADE background with bold geometric shapes',
    isDark: false,
  },
  {
    id: '11',
    name: 'レトロ・ヴィンテージ',
    description: '個性派ブランド・カフェ・音楽・ノスタルジック訴求',
    industries: ['カフェ', 'バー', '音楽', 'レトロゲーム', '古着', '個性派ブランド'],
    tone: 'レトロフューチャー、ノスタルジック、ポップ、冒険、粗い',
    baseColor: '#1A1A3E',
    mainColor: '#FFD700',
    cvColor: '#FF6347',
    textColor: '#FFD700',
    accentColor: '#FF6347',
    imageStylePrompt:
      'retro vintage halftone printing, grainy texture, retro illustration, scan lines effect, worn paper',
    backgroundPrompt: 'navy blue #1A1A3E or sepia-toned background with halftone dots',
    isDark: true,
  },
  {
    id: '12',
    name: 'グラレコ風',
    description: 'セミナー・教育・コーチング・わかりやすさ重視',
    industries: ['セミナー', 'コーチング', '教育', '研修', 'コンサル', 'ファシリテーション'],
    tone: '手書き、スケッチ、親しみ、わかりやすい、ライブ感',
    baseColor: '#FFFFFF',
    mainColor: '#FF6B35',
    cvColor: '#4ECDC4',
    textColor: '#333333',
    accentColor: '#FFE66D',
    imageStylePrompt:
      'hand-drawn sketch style, whiteboard marker illustration, graphic recording style, simple flat icons, sketch notes with arrows and highlights, stick figures',
    backgroundPrompt: 'white or cream notebook paper background with hand-drawn border',
    isDark: false,
  },
];

/** スタイルIDからスタイル定義を取得 */
export function getDesignStyle(id: string): LPDesignStyle {
  return LP_DESIGN_STYLES.find((s) => s.id === id) ?? LP_DESIGN_STYLES[0];
}

/** 業界キーワードからおすすめスタイルIDを自動選定 */
export function autoSelectStyle(industry: string): string {
  const kw = industry.toLowerCase();
  if (kw.includes('technology') || kw.includes('software') || kw.includes('saas') || kw.includes('ai')) return '8';
  if (kw.includes('beauty') || kw.includes('cosmetics')) return '5';
  if (kw.includes('food') || kw.includes('restaurant')) return '6';
  if (kw.includes('education') || kw.includes('learning')) return '12';
  if (kw.includes('fitness') || kw.includes('health') || kw.includes('wellness')) return '3';
  if (kw.includes('finance') || kw.includes('investment')) return '2';
  if (kw.includes('real estate') || kw.includes('architecture')) return '2';
  if (kw.includes('business') || kw.includes('consulting')) return '1';
  return '1';
}

/** 画像プロンプト用のスタイル指定文字列を生成（英語）
 * NOTE: 色コード(hex)は画像内に文字として描画されるため出力しない。
 * NO TEXT 指示を最後に追加して文字の描画を防ぐ。
 */
export function buildStylePrompt(style: LPDesignStyle): string {
  return [
    style.imageStylePrompt,
    style.backgroundPrompt,
    'NO text overlay, NO words, NO letters, NO Japanese characters, NO typography, illustration only',
    'high quality professional marketing image',
  ].join(', ');
}

/** コピー生成用のトーン指示（日本語） */
export function getCopywritingTone(style: LPDesignStyle): string {
  return `デザインテイスト: ${style.name}（${style.tone}）`;
}
