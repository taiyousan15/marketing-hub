/**
 * LP Builder 型定義
 * ドラッグ&ドロップ可能なランディングページビルダーの型システム
 */

export type ComponentCategory =
  | 'header'
  | 'hero'
  | 'problem'
  | 'solution'
  | 'testimonial'
  | 'cta'
  | 'form'
  | 'pricing'
  | 'faq'
  | 'countdown'
  | 'footer';

export type BuilderMode = 'manual' | 'ai-assist';

/**
 * LP コンポーネントのプロパティ
 */
export interface ComponentProperty {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'color' | 'number' | 'select' | 'boolean';
  value: string | number | boolean;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
}

/**
 * LP コンポーネントの定義
 */
export interface LPComponent {
  id: string;
  type: string;
  category: ComponentCategory;
  name: string;
  description: string;
  icon: string;
  defaultProps: ComponentProperty[];
  previewImage?: string;
}

/**
 * キャンバス上のコンポーネントインスタンス
 */
export interface ComponentInstance {
  id: string;
  componentType: string;
  category: ComponentCategory;
  order: number;
  props: Record<string, string | number | boolean>;
  customStyles?: Record<string, string>;
}

/**
 * LP ページ全体の状態
 */
export interface LPPageState {
  id: string;
  name: string;
  mode: BuilderMode;
  components: ComponentInstance[];
  globalStyles?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    backgroundColor?: string;
  };
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ドラッグ&ドロップのアイテム
 */
export interface DragItem {
  id: string;
  type: 'component' | 'instance';
  componentType?: string;
  category?: ComponentCategory;
  instanceId?: string;
}

/**
 * AI アシスト設定
 */
export interface AIAssistConfig {
  enabled: boolean;
  provider: 'anthropic' | 'openai';
  model: string;
  temperature: number;
  maxTokens: number;
}

/**
 * エクスポート形式
 */
export type ExportFormat = 'html' | 'react' | 'json';

/**
 * プレビュー設定
 */
export interface PreviewConfig {
  device: 'desktop' | 'tablet' | 'mobile';
  width: number;
  height: number;
}
