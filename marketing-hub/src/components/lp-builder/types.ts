/**
 * LP Builder 型定義
 * ドラッグ&ドロップ可能なランディングページビルダーの型システム
 */

/**
 * UTAGE互換カテゴリ（34要素を9カテゴリに整理）
 */
export type ComponentCategory =
  | 'basic'        // 基本要素: テキスト、画像、動画、音声、余白、区切り線、PDF
  | 'headline'     // 見出し: ヘッドライン、サブヘッド
  | 'content'      // コンテンツ: ボレット、吹き出し、画像+テキスト、表、アコーディオン
  | 'video'        // 動画: 動画メニュー、動画チャプター、自動ウェビナー
  | 'form'         // フォーム: 登録フォーム、カスタムフォーム、コメント
  | 'button'       // ボタン: ボタン、次へ進むリンク
  | 'line'         // LINE連携: LINE友だち追加ボタン、QRコード
  | 'payment'      // 決済: 決済フォーム、購入ボタン、購入商品一覧
  | 'other';       // その他: ヘッダー、フッター、カウントダウン、プログレスバー、カスタムHTML

/**
 * LP Builder モード
 */
export type BuilderMode = 'ai-wizard' | 'template' | 'advanced';

/**
 * コンポーネント表示モード
 * - image-only: 画像のみで構成（AI生成画像1枚で表現）
 * - image-text: 画像とテキストを組み合わせて構成
 * - text-only: テキストのみで構成（従来モード）
 */
export type ComponentDisplayMode = 'image-only' | 'image-text' | 'text-only';

export const DISPLAY_MODE_LABELS: Record<ComponentDisplayMode, string> = {
  'image-only': '画像のみ',
  'image-text': '画像+テキスト',
  'text-only': 'テキストのみ',
};

export const DISPLAY_MODE_DESCRIPTIONS: Record<ComponentDisplayMode, string> = {
  'image-only': 'AIが生成した1枚の画像でセクション全体を表現',
  'image-text': '背景画像やイラストとテキストを組み合わせて表現',
  'text-only': 'テキストベースで構成（従来の方式）',
};

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

// ============================================
// 3モード戦略用の新しい型定義
// ============================================

/**
 * テンプレートカテゴリ
 */
export type TemplateCategory = 'optin' | 'sales' | 'webinar' | 'launch';

/**
 * テンプレート定義
 */
export interface LPTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail: string;
  components: ComponentInstance[];
  tags: string[];
  popularity: number;
}

/**
 * AIウィザードの質問
 */
export interface WizardQuestion {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect';
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  required: boolean;
  helpText?: string;
}

/**
 * AIウィザードの回答
 */
export interface WizardAnswers {
  productName: string;
  productDescription: string;
  targetAudience: string;
  problems: string[];
  benefits: string[];
  uniqueValue: string;
  ctaType: 'optin' | 'purchase' | 'contact' | 'webinar';
  urgency?: string;
  testimonials?: string;
  pricing?: string;
  style: 'minimal' | 'professional' | 'creative' | 'bold';
}

/**
 * AIウィザードの状態
 */
export interface WizardState {
  step: number;
  totalSteps: number;
  answers: Partial<WizardAnswers>;
  generatedLP: ComponentInstance[] | null;
  isGenerating: boolean;
  error: string | null;
}

/**
 * インラインエディット可能なフィールド
 */
export interface EditableField {
  componentId: string;
  propKey: string;
  value: string;
  type: 'text' | 'textarea' | 'image';
}

/**
 * テンプレートモードの状態
 */
export interface TemplateState {
  selectedTemplate: LPTemplate | null;
  editedComponents: ComponentInstance[];
  editingField: EditableField | null;
  hasChanges: boolean;
}

/**
 * LP Builder コンテキストの状態
 */
export interface LPBuilderState {
  mode: BuilderMode;
  components: ComponentInstance[];
  selectedComponentId: string | null;
  previewConfig: PreviewConfig;
  history: ComponentInstance[][];
  historyIndex: number;
  wizardState: WizardState;
  templateState: TemplateState;
  isSaving: boolean;
  lastSaved: Date | null;
}

/**
 * LP Builder コンテキストのアクション
 */
export interface LPBuilderActions {
  // モード
  setMode: (mode: BuilderMode) => void;

  // コンポーネント操作
  addComponent: (component: LPComponent) => void;
  updateComponent: (componentId: string, key: string, value: string | number | boolean) => void;
  deleteComponent: (componentId: string) => void;
  reorderComponents: (newComponents: ComponentInstance[]) => void;
  selectComponent: (componentId: string | null) => void;
  clearComponents: () => void;

  // 履歴
  undo: () => void;
  redo: () => void;

  // プレビュー
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;

  // ウィザード
  setWizardAnswer: (key: keyof WizardAnswers, value: string | string[]) => void;
  nextWizardStep: () => void;
  prevWizardStep: () => void;
  generateLPFromWizard: () => Promise<void>;
  resetWizard: () => void;

  // テンプレート
  selectTemplate: (template: LPTemplate) => void;
  updateTemplateComponent: (componentId: string, key: string, value: string) => void;
  startEditingField: (field: EditableField) => void;
  stopEditingField: () => void;
  applyTemplate: () => void;

  // 保存・エクスポート
  save: () => Promise<void>;
  exportAs: (format: ExportFormat) => void;
  openAdvancedMode: () => void;
}

/**
 * LP Builder コンテキスト型
 */
export interface LPBuilderContextType {
  state: LPBuilderState;
  actions: LPBuilderActions;
}

/**
 * テンプレートカテゴリ表示名
 */
export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  optin: 'オプトイン',
  sales: 'セールス',
  webinar: 'ウェビナー',
  launch: 'プロダクトローンチ',
};

/**
 * ビルダーモード表示名
 */
export const BUILDER_MODE_LABELS: Record<BuilderMode, string> = {
  'ai-wizard': 'AIウィザード',
  'template': 'テンプレート',
  'advanced': 'アドバンスド',
};
