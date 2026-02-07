'use client';

/**
 * LP Builder プロパティパネル（UTAGE形式）
 * ダークブルー背景、左側配置
 */

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Upload,
  ChevronDown,
  Copy,
  Trash2,
  Monitor,
  Smartphone,
  Clock,
  Play,
  Youtube,
  Video,
  Code,
} from 'lucide-react';
import {
  ComponentInstance,
  ComponentProperty,
} from '../../types';
import { getComponentByType } from '../../components-registry';
import { ImageUploadModal } from './image-upload-modal';

interface PropertyPanelProps {
  component: ComponentInstance | null;
  onPropertyChange: (
    componentId: string,
    key: string,
    value: string | number | boolean
  ) => void;
  onClose: () => void;
  aiAssistEnabled?: boolean;
  onAiGenerateImage?: (prompt: string) => Promise<string | null>;
}

/**
 * UTAGE形式のセレクトオプション
 */
const POSITION_OPTIONS = [
  { label: '中央', value: 'center' },
  { label: '左', value: 'left' },
  { label: '右', value: 'right' },
];

const MARGIN_OPTIONS = [
  { label: 'デフォルト', value: 'default' },
  { label: '0px', value: '0px' },
  { label: '5px', value: '5px' },
  { label: '10px', value: '10px' },
  { label: '15px', value: '15px' },
  { label: '20px', value: '20px' },
  { label: '30px', value: '30px' },
  { label: '40px', value: '40px' },
  { label: '50px', value: '50px' },
];

const WIDTH_OPTIONS = [
  { label: 'デフォルト', value: 'default' },
  { label: '100%', value: '100%' },
  { label: '95%', value: '95%' },
  { label: '90%', value: '90%' },
  { label: '85%', value: '85%' },
  { label: '80%', value: '80%' },
  { label: '75%', value: '75%' },
  { label: '70%', value: '70%' },
];

const DISPLAY_DEVICE_OPTIONS = [
  { label: 'PC/スマホ両方', value: 'both' },
  { label: 'PCのみ', value: 'pc' },
  { label: 'スマホのみ', value: 'sp' },
  { label: 'なし(非表示)', value: 'hidden' },
];

const LINK_TARGET_OPTIONS = [
  { label: '同じ画面', value: '_self' },
  { label: '別タブ/別ウィンドウ', value: '_blank' },
];

// UTAGE形式のボタンテーマ（32種類）
const BUTTON_THEMES = [
  // グラデーション系
  { label: '黄色', value: 'yellow-gradient', color: 'linear-gradient(to bottom, #fbbf24, #f59e0b)', textColor: '#000' },
  { label: '緑(グラデーション)', value: 'green-gradient', color: 'linear-gradient(to bottom, #22c55e, #16a34a)', textColor: '#fff' },
  { label: '黄(グラデーション)', value: 'gold-gradient', color: 'linear-gradient(to bottom, #facc15, #eab308)', textColor: '#000' },
  { label: '黄緑', value: 'lime-gradient', color: 'linear-gradient(to bottom, #84cc16, #65a30d)', textColor: '#fff' },
  // ベーシック系
  { label: 'オレンジ', value: 'orange', color: '#f97316', textColor: '#fff' },
  { label: 'オレンジ(暗文字)', value: 'orange-dark-text', color: '#f97316', textColor: '#000' },
  { label: '緑', value: 'green', color: '#22c55e', textColor: '#fff' },
  { label: '黄緑(ベーシック)', value: 'lime', color: '#84cc16', textColor: '#fff' },
  { label: '青', value: 'blue', color: '#3b82f6', textColor: '#fff' },
  { label: '赤', value: 'red', color: '#ef4444', textColor: '#fff' },
  // 立体系
  { label: 'オレンジ(立体)', value: 'orange-3d', color: '#f97316', textColor: '#fff', is3d: true },
  { label: 'オレンジ(暗文字・立体)', value: 'orange-dark-3d', color: '#f97316', textColor: '#000', is3d: true },
  { label: '緑(立体)', value: 'green-3d', color: '#22c55e', textColor: '#fff', is3d: true },
  { label: '黄緑(立体)', value: 'lime-3d', color: '#84cc16', textColor: '#fff', is3d: true },
  { label: '青(立体)', value: 'blue-3d', color: '#3b82f6', textColor: '#fff', is3d: true },
  { label: '赤(立体)', value: 'red-3d', color: '#ef4444', textColor: '#fff', is3d: true },
  // フラット系
  { label: 'オレンジ(フラット)', value: 'orange-flat', color: '#f97316', textColor: '#fff', isFlat: true },
  { label: 'オレンジ(暗文字・フラット)', value: 'orange-dark-flat', color: '#f97316', textColor: '#000', isFlat: true },
  { label: '緑(フラット)', value: 'green-flat', color: '#22c55e', textColor: '#fff', isFlat: true },
  { label: '黄緑(フラット)', value: 'lime-flat', color: '#84cc16', textColor: '#fff', isFlat: true },
  { label: '青(フラット)', value: 'blue-flat', color: '#3b82f6', textColor: '#fff', isFlat: true },
  { label: '赤(フラット)', value: 'red-flat', color: '#ef4444', textColor: '#fff', isFlat: true },
  // 角丸系
  { label: 'オレンジ(角丸)', value: 'orange-rounded', color: '#f97316', textColor: '#fff', isRounded: true },
  { label: 'オレンジ(暗文字・角丸)', value: 'orange-dark-rounded', color: '#f97316', textColor: '#000', isRounded: true },
  { label: '緑(角丸)', value: 'green-rounded', color: '#22c55e', textColor: '#fff', isRounded: true },
  { label: '黄緑(角丸)', value: 'lime-rounded', color: '#84cc16', textColor: '#fff', isRounded: true },
  { label: '青(角丸)', value: 'blue-rounded', color: '#3b82f6', textColor: '#fff', isRounded: true },
  { label: '赤(角丸)', value: 'red-rounded', color: '#ef4444', textColor: '#fff', isRounded: true },
  // その他
  { label: 'テキスト', value: 'text-only', color: 'transparent', textColor: '#3b82f6' },
  { label: '画像', value: 'image', color: 'transparent', textColor: '#000' },
];

// フォントサイズオプション
const FONT_SIZE_OPTIONS = [
  { label: 'デフォルト', value: 'default' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px', value: '32px' },
  { label: '36px', value: '36px' },
  { label: '40px', value: '40px' },
  { label: '48px', value: '48px' },
];

// アニメーションオプション
const ANIMATION_OPTIONS = [
  { label: 'なし', value: 'none' },
  { label: 'バウンス', value: 'bounce' },
  { label: 'パルス', value: 'pulse' },
  { label: 'シェイク', value: 'shake' },
];

/**
 * UTAGE形式のフォームフィールド
 */
function UtageField({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Label className="w-28 flex-shrink-0 text-xs text-gray-300">{label}</Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

/**
 * UTAGE形式のセレクト
 */
function UtageSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 border-gray-600 bg-gray-700 text-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * UTAGE形式の入力
 */
function UtageInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 border-gray-600 bg-gray-700 text-white placeholder-gray-400"
    />
  );
}

/**
 * UTAGE形式のボタンテーマセレクター
 */
function ButtonThemeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedTheme = BUTTON_THEMES.find(t => t.value === value) || BUTTON_THEMES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
      >
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-10 rounded"
            style={{
              background: selectedTheme.color,
              boxShadow: selectedTheme.is3d ? '0 4px 0 rgba(0,0,0,0.3)' : 'none',
            }}
          />
          <span className="text-sm">{selectedTheme.label}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded border border-gray-600 bg-gray-800 shadow-lg">
          {/* グラデーション系 */}
          <div className="border-b border-gray-700 p-2">
            <div className="mb-1 text-xs text-gray-400">グラデーション</div>
            <div className="grid grid-cols-2 gap-1">
              {BUTTON_THEMES.filter(t => t.value.includes('gradient')).map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => { onChange(theme.value); setIsOpen(false); }}
                  className={`flex items-center gap-2 rounded p-2 text-left hover:bg-gray-700 ${value === theme.value ? 'bg-gray-700' : ''}`}
                >
                  <div
                    className="h-5 w-8 rounded"
                    style={{ background: theme.color }}
                  />
                  <span className="text-xs text-white">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ベーシック系 */}
          <div className="border-b border-gray-700 p-2">
            <div className="mb-1 text-xs text-gray-400">ベーシック</div>
            <div className="grid grid-cols-2 gap-1">
              {BUTTON_THEMES.filter(t => !t.value.includes('gradient') && !t.value.includes('3d') && !t.value.includes('flat') && !t.value.includes('rounded') && !['text-only', 'image'].includes(t.value)).map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => { onChange(theme.value); setIsOpen(false); }}
                  className={`flex items-center gap-2 rounded p-2 text-left hover:bg-gray-700 ${value === theme.value ? 'bg-gray-700' : ''}`}
                >
                  <div
                    className="h-5 w-8 rounded"
                    style={{ background: theme.color }}
                  />
                  <span className="text-xs text-white">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 立体系 */}
          <div className="border-b border-gray-700 p-2">
            <div className="mb-1 text-xs text-gray-400">立体</div>
            <div className="grid grid-cols-2 gap-1">
              {BUTTON_THEMES.filter(t => t.is3d).map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => { onChange(theme.value); setIsOpen(false); }}
                  className={`flex items-center gap-2 rounded p-2 text-left hover:bg-gray-700 ${value === theme.value ? 'bg-gray-700' : ''}`}
                >
                  <div
                    className="h-5 w-8 rounded"
                    style={{ background: theme.color, boxShadow: '0 3px 0 rgba(0,0,0,0.3)' }}
                  />
                  <span className="text-xs text-white">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* フラット系 */}
          <div className="border-b border-gray-700 p-2">
            <div className="mb-1 text-xs text-gray-400">フラット</div>
            <div className="grid grid-cols-2 gap-1">
              {BUTTON_THEMES.filter(t => t.isFlat).map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => { onChange(theme.value); setIsOpen(false); }}
                  className={`flex items-center gap-2 rounded p-2 text-left hover:bg-gray-700 ${value === theme.value ? 'bg-gray-700' : ''}`}
                >
                  <div
                    className="h-5 w-8 rounded-none"
                    style={{ background: theme.color }}
                  />
                  <span className="text-xs text-white">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 角丸系 */}
          <div className="border-b border-gray-700 p-2">
            <div className="mb-1 text-xs text-gray-400">角丸</div>
            <div className="grid grid-cols-2 gap-1">
              {BUTTON_THEMES.filter(t => t.isRounded).map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => { onChange(theme.value); setIsOpen(false); }}
                  className={`flex items-center gap-2 rounded p-2 text-left hover:bg-gray-700 ${value === theme.value ? 'bg-gray-700' : ''}`}
                >
                  <div
                    className="h-5 w-8 rounded-full"
                    style={{ background: theme.color }}
                  />
                  <span className="text-xs text-white">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* その他 */}
          <div className="p-2">
            <div className="mb-1 text-xs text-gray-400">その他</div>
            <div className="grid grid-cols-2 gap-1">
              {BUTTON_THEMES.filter(t => ['text-only', 'image'].includes(t.value)).map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => { onChange(theme.value); setIsOpen(false); }}
                  className={`flex items-center gap-2 rounded p-2 text-left hover:bg-gray-700 ${value === theme.value ? 'bg-gray-700' : ''}`}
                >
                  <div
                    className="flex h-5 w-8 items-center justify-center rounded border border-gray-500 text-xs"
                    style={{ background: theme.color, color: theme.textColor }}
                  >
                    {theme.value === 'text-only' ? 'A' : '📷'}
                  </div>
                  <span className="text-xs text-white">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * UTAGE形式の折りたたみセクション
 */
function UtageCollapsible({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between border-t border-gray-600 py-3 text-sm font-medium text-white hover:text-gray-300"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="space-y-3 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * プロパティパネルメインコンポーネント（UTAGE形式）
 */
export function PropertyPanel({
  component,
  onPropertyChange,
  onClose,
}: PropertyPanelProps) {
  const componentDef = component ? getComponentByType(component.componentType) : null;
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<string>('imageUrl');

  const handleChange = useCallback(
    (key: string, value: string | number | boolean) => {
      if (component) {
        onPropertyChange(component.id, key, value);
      }
    },
    [component, onPropertyChange]
  );

  // 未選択状態
  if (!component || !componentDef) {
    return (
      <div className="flex h-full flex-col bg-[#1e3a5f] text-white">
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-center text-gray-300">
            要素を選択すると編集することができます
          </p>
        </div>
      </div>
    );
  }

  // コンポーネント名のマッピング
  const componentNames: Record<string, string> = {
    text: 'テキスト',
    image: '画像',
    video: '動画',
    videoMenu: '動画メニュー',
    videoChapter: '動画チャプター',
    headline: 'ヘッドライン',
    subheadline: 'サブヘッド',
    button: 'ボタン',
    cta: 'ボタン',
    bullet: 'ボレット',
    bullets: 'ボレット',
    form: '登録フォーム',
    optinForm: '登録フォーム',
    customForm: 'カスタムフォーム',
    countdown: 'カウントダウン',
    progressBar: 'プログレスバー',
    divider: '区切り線',
    spacer: '余白',
    header: 'ヘッダー',
    footer: 'フッター',
    imageText: '画像+テキスト',
    speech: '吹き出し',
    accordion: 'アコーディオン',
    table: '表',
    pdf: 'PDF',
    audio: '音声',
    customHtml: 'カスタムHTML',
    lineFriend: '友だち追加ボタン',
    lineQr: '友だち追加QRコード',
    payment: '決済フォーム',
    purchaseButton: '購入ボタン',
    nextLink: '次へ進むリンク',
    productList: '購入商品一覧',
    eventForm: '申込フォーム',
    scheduleList: '日程一覧',
    inputField: '入力欄',
    submitButton: '送信ボタン',
    cardInput: 'カード情報入力欄',
    productSelect: '商品選択',
    cart: '購入商品(カート)',
    orderBump: 'オーダーバンプ',
  };

  const displayName = componentNames[component.componentType] || componentDef.name;

  return (
    <div className="flex h-full flex-col bg-[#1e3a5f] text-white">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 border-b border-gray-600 px-4 py-3">
        <button
          onClick={onClose}
          className="text-gray-300 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-medium">{displayName}</span>
      </div>

      {/* コンテンツ */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-4">
          {/* コンポーネント固有のプロパティ */}
          {component.componentType === 'image' && (
            <>
              <UtageField label="画像URL">
                <div className="flex gap-2">
                  <UtageInput
                    value={String(component.props.imageUrl || '')}
                    onChange={(v) => handleChange('imageUrl', v)}
                    placeholder="https://..."
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 border border-gray-600 bg-gray-700 p-0 text-white hover:bg-gray-600"
                    onClick={() => {
                      setCurrentImageField('imageUrl');
                      setIsImageModalOpen(true);
                    }}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </UtageField>
              {/* 画像プレビュー */}
              {component.props.imageUrl && (
                <div className="mt-2 rounded-lg border border-gray-600 p-2">
                  <img
                    src={String(component.props.imageUrl)}
                    alt="プレビュー"
                    className="max-h-32 w-full rounded object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <UtageField label="テーマ">
                <UtageSelect
                  value={String(component.props.theme || 'default')}
                  options={[
                    { label: 'デフォルト', value: 'default' },
                    { label: '四角', value: 'square' },
                    { label: '角丸', value: 'rounded' },
                    { label: '円', value: 'circle' },
                  ]}
                  onChange={(v) => handleChange('theme', v)}
                />
              </UtageField>
              <UtageField label="幅">
                <UtageSelect
                  value={String(component.props.width || '100%')}
                  options={WIDTH_OPTIONS}
                  onChange={(v) => handleChange('width', v)}
                />
              </UtageField>
              <UtageField label="リンク先URL">
                <UtageInput
                  value={String(component.props.linkUrl || '')}
                  onChange={(v) => handleChange('linkUrl', v)}
                  placeholder=""
                />
              </UtageField>
              <UtageField label="リンクの開き方">
                <UtageSelect
                  value={String(component.props.linkTarget || '_self')}
                  options={LINK_TARGET_OPTIONS}
                  onChange={(v) => handleChange('linkTarget', v)}
                />
              </UtageField>
            </>
          )}

          {component.componentType === 'text' && (
            <>
              <UtageField label="テキスト">
                <Textarea
                  value={String(component.props.text || component.props.content || '')}
                  onChange={(e) => handleChange('text', e.target.value)}
                  className="min-h-[100px] border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                  placeholder="テキストを入力"
                />
              </UtageField>
            </>
          )}

          {component.componentType === 'headline' && (
            <>
              <UtageField label="ヘッドライン">
                <UtageInput
                  value={String(component.props.headline || '')}
                  onChange={(v) => handleChange('headline', v)}
                  placeholder="見出しを入力"
                />
              </UtageField>
            </>
          )}

          {component.componentType === 'subheadline' && (
            <>
              <UtageField label="サブヘッド">
                <UtageInput
                  value={String(component.props.subheadline || '')}
                  onChange={(v) => handleChange('subheadline', v)}
                  placeholder="サブ見出しを入力"
                />
              </UtageField>
            </>
          )}

          {(component.componentType === 'button' || component.componentType === 'cta') && (
            <>
              <UtageField label="テキスト">
                <UtageInput
                  value={String(component.props.buttonText || component.props.ctaText || '')}
                  onChange={(v) => handleChange('buttonText', v)}
                  placeholder="ボタンテキスト"
                />
              </UtageField>
              <UtageField label="文字サイズ">
                <UtageSelect
                  value={String(component.props.fontSize || 'default')}
                  options={FONT_SIZE_OPTIONS}
                  onChange={(v) => handleChange('fontSize', v)}
                />
              </UtageField>
              <UtageField label="スマホの文字サイズ">
                <UtageSelect
                  value={String(component.props.fontSizeSp || 'default')}
                  options={[{ label: 'PCと同じサイズ', value: 'default' }, ...FONT_SIZE_OPTIONS.slice(1)]}
                  onChange={(v) => handleChange('fontSizeSp', v)}
                />
              </UtageField>
              <UtageField label="サブテキスト">
                <UtageInput
                  value={String(component.props.subText || '')}
                  onChange={(v) => handleChange('subText', v)}
                  placeholder="サブテキスト（任意）"
                />
              </UtageField>
              <UtageField label="ボタンテーマ">
                <ButtonThemeSelector
                  value={String(component.props.buttonTheme || 'green-3d')}
                  onChange={(v) => handleChange('buttonTheme', v)}
                />
              </UtageField>
              <UtageField label="アイコン(左側)">
                <UtageSelect
                  value={String(component.props.iconLeft || 'none')}
                  options={[
                    { label: 'なし', value: 'none' },
                    { label: '矢印', value: 'arrow' },
                    { label: 'チェック', value: 'check' },
                    { label: 'カート', value: 'cart' },
                    { label: 'メール', value: 'mail' },
                    { label: '電話', value: 'phone' },
                  ]}
                  onChange={(v) => handleChange('iconLeft', v)}
                />
              </UtageField>
              <UtageField label="アイコン(右側)">
                <UtageSelect
                  value={String(component.props.iconRight || 'none')}
                  options={[
                    { label: 'なし', value: 'none' },
                    { label: '矢印', value: 'arrow' },
                    { label: 'チェック', value: 'check' },
                    { label: 'カート', value: 'cart' },
                    { label: 'メール', value: 'mail' },
                    { label: '電話', value: 'phone' },
                  ]}
                  onChange={(v) => handleChange('iconRight', v)}
                />
              </UtageField>
              <UtageField label="アニメーション">
                <UtageSelect
                  value={String(component.props.animation || 'none')}
                  options={ANIMATION_OPTIONS}
                  onChange={(v) => handleChange('animation', v)}
                />
              </UtageField>
              <UtageField label="幅">
                <UtageSelect
                  value={String(component.props.width || 'default')}
                  options={WIDTH_OPTIONS}
                  onChange={(v) => handleChange('width', v)}
                />
              </UtageField>
              <UtageField label="高さ(上下の余白)">
                <UtageSelect
                  value={String(component.props.height || 'default')}
                  options={[
                    { label: 'デフォルト', value: 'default' },
                    { label: '小', value: 'small' },
                    { label: '中', value: 'medium' },
                    { label: '大', value: 'large' },
                  ]}
                  onChange={(v) => handleChange('height', v)}
                />
              </UtageField>
              <UtageField label="リンク先URL">
                <UtageInput
                  value={String(component.props.linkUrl || '')}
                  onChange={(v) => handleChange('linkUrl', v)}
                  placeholder="https://..."
                />
              </UtageField>
              <UtageField label="リンクの開き方">
                <UtageSelect
                  value={String(component.props.linkTarget || '_self')}
                  options={LINK_TARGET_OPTIONS}
                  onChange={(v) => handleChange('linkTarget', v)}
                />
              </UtageField>
            </>
          )}

          {component.componentType === 'video' && (
            <>
              {/* 動画ソースタイプ選択 */}
              <UtageField label="動画ソース">
                <UtageSelect
                  value={String(component.props.videoSource || 'youtube')}
                  options={[
                    { label: 'YouTube', value: 'youtube' },
                    { label: 'Vimeo', value: 'vimeo' },
                    { label: '外部URL (MP4/HLS)', value: 'external' },
                    { label: 'Wistia', value: 'wistia' },
                    { label: 'iframe（Webページ埋め込み）', value: 'iframe' },
                  ]}
                  onChange={(v) => handleChange('videoSource', v)}
                />
              </UtageField>

              {/* YouTube */}
              {(component.props.videoSource === 'youtube' || !component.props.videoSource) && (
                <>
                  <UtageField label="YouTube URL">
                    <div className="flex gap-2">
                      <UtageInput
                        value={String(component.props.videoUrl || '')}
                        onChange={(v) => handleChange('videoUrl', v)}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      <div className="flex h-9 w-9 items-center justify-center rounded border border-gray-600 bg-red-600">
                        <Youtube className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </UtageField>
                  <p className="text-xs text-gray-400 mb-2">
                    例: https://www.youtube.com/watch?v=xxxxxxxx または https://youtu.be/xxxxxxxx
                  </p>
                </>
              )}

              {/* Vimeo */}
              {component.props.videoSource === 'vimeo' && (
                <>
                  <UtageField label="Vimeo URL">
                    <div className="flex gap-2">
                      <UtageInput
                        value={String(component.props.videoUrl || '')}
                        onChange={(v) => handleChange('videoUrl', v)}
                        placeholder="https://vimeo.com/123456789"
                      />
                      <div className="flex h-9 w-9 items-center justify-center rounded border border-gray-600 bg-blue-500">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </UtageField>
                  <p className="text-xs text-gray-400 mb-2">
                    例: https://vimeo.com/123456789 または https://player.vimeo.com/video/123456789
                  </p>
                </>
              )}

              {/* 外部URL */}
              {component.props.videoSource === 'external' && (
                <>
                  <UtageField label="動画URL">
                    <div className="flex gap-2">
                      <UtageInput
                        value={String(component.props.videoUrl || '')}
                        onChange={(v) => handleChange('videoUrl', v)}
                        placeholder="https://example.com/video.mp4"
                      />
                      <div className="flex h-9 w-9 items-center justify-center rounded border border-gray-600 bg-gray-600">
                        <Video className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </UtageField>
                  <p className="text-xs text-gray-400 mb-2">
                    MP4, WebM, HLS (.m3u8) に対応
                  </p>
                  <UtageField label="ポスター画像">
                    <div className="flex gap-2">
                      <UtageInput
                        value={String(component.props.posterUrl || '')}
                        onChange={(v) => handleChange('posterUrl', v)}
                        placeholder="https://..."
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 border border-gray-600 bg-gray-700 p-0 text-white hover:bg-gray-600"
                        onClick={() => {
                          setCurrentImageField('posterUrl');
                          setIsImageModalOpen(true);
                        }}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </UtageField>
                </>
              )}

              {/* Wistia */}
              {component.props.videoSource === 'wistia' && (
                <>
                  <UtageField label="Wistia Video ID">
                    <UtageInput
                      value={String(component.props.wistiaId || '')}
                      onChange={(v) => handleChange('wistiaId', v)}
                      placeholder="例: abc123xyz"
                    />
                  </UtageField>
                  <p className="text-xs text-gray-400 mb-2">
                    Wistiaの動画URLから取得したVideo IDを入力
                  </p>
                </>
              )}

              {/* iframe（Webページ埋め込み） */}
              {component.props.videoSource === 'iframe' && (
                <>
                  <UtageField label="埋め込みURL">
                    <div className="flex gap-2">
                      <UtageInput
                        value={String(component.props.iframeUrl || '')}
                        onChange={(v) => handleChange('iframeUrl', v)}
                        placeholder="https://example.com/player"
                      />
                      <div className="flex h-9 w-9 items-center justify-center rounded border border-gray-600 bg-purple-600">
                        <Code className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </UtageField>
                  <p className="text-xs text-gray-400 mb-2">
                    VSLプレイヤー、インタラクティブコンテンツなどのURLを入力
                  </p>
                  <UtageField label="スクロール許可">
                    <Switch
                      checked={Boolean(component.props.iframeScrolling ?? false)}
                      onCheckedChange={(v) => handleChange('iframeScrolling', v)}
                    />
                  </UtageField>
                </>
              )}

              {/* 共通設定 */}
              <UtageField label="幅">
                <UtageSelect
                  value={String(component.props.width || '100%')}
                  options={WIDTH_OPTIONS}
                  onChange={(v) => handleChange('width', v)}
                />
              </UtageField>
              <UtageField label="アスペクト比">
                <UtageSelect
                  value={String(component.props.aspectRatio || '16:9')}
                  options={[
                    { label: '16:9（横長）', value: '16:9' },
                    { label: '4:3（標準）', value: '4:3' },
                    { label: '1:1（正方形）', value: '1:1' },
                    { label: '9:16（縦長）', value: '9:16' },
                  ]}
                  onChange={(v) => handleChange('aspectRatio', v)}
                />
              </UtageField>
              <UtageField label="自動再生">
                <Switch
                  checked={Boolean(component.props.autoplay)}
                  onCheckedChange={(v) => handleChange('autoplay', v)}
                />
              </UtageField>
              <UtageField label="ミュート">
                <Switch
                  checked={Boolean(component.props.muted ?? component.props.autoplay)}
                  onCheckedChange={(v) => handleChange('muted', v)}
                />
              </UtageField>
              <UtageField label="ループ再生">
                <Switch
                  checked={Boolean(component.props.loop)}
                  onCheckedChange={(v) => handleChange('loop', v)}
                />
              </UtageField>
              <UtageField label="コントロール表示">
                <Switch
                  checked={Boolean(component.props.controls ?? true)}
                  onCheckedChange={(v) => handleChange('controls', v)}
                />
              </UtageField>

              {/* 動画プレビュー */}
              {component.props.videoUrl && (
                <div className="mt-2 rounded-lg border border-gray-600 bg-gray-900 p-2">
                  <p className="text-xs text-gray-400 mb-1">プレビュー</p>
                  <div className="aspect-video bg-black rounded flex items-center justify-center">
                    <Play className="h-8 w-8 text-gray-500" />
                  </div>
                </div>
              )}
            </>
          )}

          {component.componentType === 'videoMenu' && (
            <>
              <UtageField label="動画数">
                <UtageSelect
                  value={String(component.props.videoCount || '3')}
                  options={[
                    { label: '1話のみ', value: '1' },
                    { label: '2話まで', value: '2' },
                    { label: '3話まで', value: '3' },
                    { label: '4話まで', value: '4' },
                    { label: '5話まで', value: '5' },
                  ]}
                  onChange={(v) => handleChange('videoCount', v)}
                />
              </UtageField>
              <UtageField label="公開済みの動画">
                <UtageSelect
                  value={String(component.props.publishedCount || '3')}
                  options={[
                    { label: '1話まで', value: '1' },
                    { label: '2話まで', value: '2' },
                    { label: '3話まで', value: '3' },
                    { label: '4話まで', value: '4' },
                    { label: '5話まで', value: '5' },
                  ]}
                  onChange={(v) => handleChange('publishedCount', v)}
                />
              </UtageField>
              <UtageField label="動画1URL">
                <UtageInput
                  value={String(component.props.video1Url || '')}
                  onChange={(v) => handleChange('video1Url', v)}
                  placeholder="YouTube/Vimeo URL"
                />
              </UtageField>
              <UtageField label="動画2URL">
                <UtageInput
                  value={String(component.props.video2Url || '')}
                  onChange={(v) => handleChange('video2Url', v)}
                  placeholder="YouTube/Vimeo URL"
                />
              </UtageField>
              <UtageField label="動画3URL">
                <UtageInput
                  value={String(component.props.video3Url || '')}
                  onChange={(v) => handleChange('video3Url', v)}
                  placeholder="YouTube/Vimeo URL"
                />
              </UtageField>
              <UtageField label="カラー">
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={String(component.props.themeColor || '#1e3a5f')}
                    onChange={(e) => handleChange('themeColor', e.target.value)}
                    className="h-9 w-12 cursor-pointer border-gray-600 bg-gray-700 p-1"
                  />
                  <UtageInput
                    value={String(component.props.themeColor || '#1e3a5f')}
                    onChange={(v) => handleChange('themeColor', v)}
                    placeholder="#1e3a5f"
                  />
                </div>
              </UtageField>
            </>
          )}

          {component.componentType === 'imageText' && (
            <>
              <UtageField label="画像URL">
                <div className="flex gap-2">
                  <UtageInput
                    value={String(component.props.imageUrl || '')}
                    onChange={(v) => handleChange('imageUrl', v)}
                    placeholder="https://..."
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 border border-gray-600 bg-gray-700 p-0 text-white hover:bg-gray-600"
                    onClick={() => {
                      setCurrentImageField('imageUrl');
                      setIsImageModalOpen(true);
                    }}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </UtageField>
              {/* 画像プレビュー */}
              {component.props.imageUrl && (
                <div className="mt-2 mb-2 rounded-lg border border-gray-600 p-2">
                  <img
                    src={String(component.props.imageUrl)}
                    alt="プレビュー"
                    className="max-h-24 w-full rounded object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <UtageField label="テーマ">
                <UtageSelect
                  value={String(component.props.theme || 'default')}
                  options={[
                    { label: 'デフォルト', value: 'default' },
                    { label: 'カード', value: 'card' },
                    { label: 'フラット', value: 'flat' },
                  ]}
                  onChange={(v) => handleChange('theme', v)}
                />
              </UtageField>
              <UtageField label="画像の位置">
                <UtageSelect
                  value={String(component.props.imagePosition || 'left')}
                  options={[
                    { label: '左', value: 'left' },
                    { label: '右', value: 'right' },
                  ]}
                  onChange={(v) => handleChange('imagePosition', v)}
                />
              </UtageField>
              <UtageField label="幅">
                <UtageSelect
                  value={String(component.props.width || 'default')}
                  options={WIDTH_OPTIONS}
                  onChange={(v) => handleChange('width', v)}
                />
              </UtageField>
              <UtageField label="テキスト">
                <Textarea
                  value={String(component.props.text || '')}
                  onChange={(e) => handleChange('text', e.target.value)}
                  className="min-h-[100px] border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                  placeholder="テキストを入力"
                />
              </UtageField>
              <UtageField label="文字サイズ">
                <UtageSelect
                  value={String(component.props.fontSize || 'default')}
                  options={FONT_SIZE_OPTIONS}
                  onChange={(v) => handleChange('fontSize', v)}
                />
              </UtageField>
              <UtageField label="スマホの文字サイズ">
                <UtageSelect
                  value={String(component.props.fontSizeSp || 'default')}
                  options={[{ label: 'PCと同じサイズ', value: 'default' }, ...FONT_SIZE_OPTIONS.slice(1)]}
                  onChange={(v) => handleChange('fontSizeSp', v)}
                />
              </UtageField>
              <UtageField label="行間">
                <UtageSelect
                  value={String(component.props.lineHeight || 'default')}
                  options={[
                    { label: 'デフォルト', value: 'default' },
                    { label: '1.0', value: '1.0' },
                    { label: '1.2', value: '1.2' },
                    { label: '1.5', value: '1.5' },
                    { label: '1.8', value: '1.8' },
                    { label: '2.0', value: '2.0' },
                  ]}
                  onChange={(v) => handleChange('lineHeight', v)}
                />
              </UtageField>
            </>
          )}

          {(component.componentType === 'bullet' || component.componentType === 'bullets') && (
            <>
              <UtageField label="ボレット項目">
                <Textarea
                  value={String(component.props.bullets || component.props.items || '')}
                  onChange={(e) => handleChange('bullets', e.target.value)}
                  className="min-h-[150px] border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                  placeholder="項目を改行で区切って入力"
                />
              </UtageField>
            </>
          )}

          {/* デフォルトプロパティ（未対応コンポーネント用） */}
          {!['image', 'text', 'headline', 'subheadline', 'button', 'cta', 'video', 'bullet', 'bullets'].includes(component.componentType) && (
            <>
              {componentDef.defaultProps.map((prop) => (
                <UtageField key={prop.key} label={prop.label}>
                  {prop.type === 'textarea' ? (
                    <Textarea
                      value={String(component.props[prop.key] ?? prop.value)}
                      onChange={(e) => handleChange(prop.key, e.target.value)}
                      className="min-h-[80px] border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                      placeholder={prop.placeholder}
                    />
                  ) : prop.type === 'select' ? (
                    <UtageSelect
                      value={String(component.props[prop.key] ?? prop.value)}
                      options={prop.options || []}
                      onChange={(v) => handleChange(prop.key, v)}
                    />
                  ) : prop.type === 'boolean' ? (
                    <Switch
                      checked={Boolean(component.props[prop.key] ?? prop.value)}
                      onCheckedChange={(v) => handleChange(prop.key, v)}
                    />
                  ) : prop.type === 'color' ? (
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={String(component.props[prop.key] ?? prop.value)}
                        onChange={(e) => handleChange(prop.key, e.target.value)}
                        className="h-9 w-12 cursor-pointer border-gray-600 bg-gray-700 p-1"
                      />
                      <UtageInput
                        value={String(component.props[prop.key] ?? prop.value)}
                        onChange={(v) => handleChange(prop.key, v)}
                      />
                    </div>
                  ) : (
                    <UtageInput
                      value={String(component.props[prop.key] ?? prop.value)}
                      onChange={(v) => handleChange(prop.key, v)}
                      placeholder={prop.placeholder}
                    />
                  )}
                </UtageField>
              ))}
            </>
          )}

          {/* 表示位置セクション */}
          <UtageCollapsible title="表示位置">
            <UtageField label="位置">
              <UtageSelect
                value={String(component.props.position || 'center')}
                options={POSITION_OPTIONS}
                onChange={(v) => handleChange('position', v)}
              />
            </UtageField>
            <UtageField label="上部の余白">
              <UtageSelect
                value={String(component.props.marginTop || 'default')}
                options={MARGIN_OPTIONS}
                onChange={(v) => handleChange('marginTop', v)}
              />
            </UtageField>
            <UtageField label="下部の余白">
              <UtageSelect
                value={String(component.props.marginBottom || 'default')}
                options={MARGIN_OPTIONS}
                onChange={(v) => handleChange('marginBottom', v)}
              />
            </UtageField>
            <UtageField label="内側の左右余白(PC)">
              <UtageSelect
                value={String(component.props.paddingX || 'default')}
                options={MARGIN_OPTIONS}
                onChange={(v) => handleChange('paddingX', v)}
              />
            </UtageField>
            <UtageField label="上部の余白(SP)">
              <UtageSelect
                value={String(component.props.marginTopSp || 'default')}
                options={MARGIN_OPTIONS}
                onChange={(v) => handleChange('marginTopSp', v)}
              />
            </UtageField>
            <UtageField label="下部の余白(SP)">
              <UtageSelect
                value={String(component.props.marginBottomSp || 'default')}
                options={MARGIN_OPTIONS}
                onChange={(v) => handleChange('marginBottomSp', v)}
              />
            </UtageField>
            <UtageField label="内側の左右余白(SP)">
              <UtageSelect
                value={String(component.props.paddingXSp || 'default')}
                options={MARGIN_OPTIONS}
                onChange={(v) => handleChange('paddingXSp', v)}
              />
            </UtageField>
          </UtageCollapsible>

          {/* 高度な設定セクション */}
          <UtageCollapsible title="高度な設定" defaultOpen={false}>
            <UtageField label="CSSクラス">
              <UtageInput
                value={String(component.props.cssClass || '')}
                onChange={(v) => handleChange('cssClass', v)}
                placeholder=""
              />
            </UtageField>
            <UtageField label="管理名称">
              <UtageInput
                value={String(component.props.adminName || '')}
                onChange={(v) => handleChange('adminName', v)}
                placeholder=""
              />
            </UtageField>
          </UtageCollapsible>

          {/* 表示端末セクション */}
          <div className="border-t border-gray-600 pt-3">
            <UtageField label="表示端末">
              <UtageSelect
                value={String(component.props.displayDevice || 'both')}
                options={DISPLAY_DEVICE_OPTIONS}
                onChange={(v) => handleChange('displayDevice', v)}
              />
            </UtageField>
          </div>

          {/* 表示期限ボタン */}
          <div className="pt-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 border border-gray-600 bg-transparent text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Clock className="h-4 w-4" />
              表示期限(自動化設定)
            </Button>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="ghost"
              className="flex-1 gap-2 border border-gray-600 bg-transparent text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Copy className="h-4 w-4" />
              複製
            </Button>
            <Button
              variant="ghost"
              className="flex-1 gap-2 border border-red-600 bg-transparent text-red-400 hover:bg-red-900 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              要素削除
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* 画像アップロードモーダル */}
      <ImageUploadModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onImageSelected={(url) => {
          handleChange(currentImageField, url);
          setIsImageModalOpen(false);
        }}
      />
    </div>
  );
}
