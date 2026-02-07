'use client';

/**
 * UTAGE形式の要素追加モーダル
 * グリッドレイアウトでコンポーネントを表示
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Type,
  Image,
  Video,
  FileText,
  MessageSquare,
  Layout,
  Heading1,
  Heading2,
  List,
  Square,
  Volume2,
  Table,
  ImagePlus,
  Menu,
  Bookmark,
  Minus,
  Timer,
  BarChart3,
  MessageCircle,
  ChevronDown,
  FileCode,
  MoveVertical,
  UserPlus,
  QrCode,
  CreditCard,
  ShoppingCart,
  ArrowRight,
  ListOrdered,
  Calendar,
  ListChecks,
  FormInput,
  Send,
  Package,
  ShoppingBag,
  Heart,
} from 'lucide-react';
import { LPComponent } from '../../types';
import { getAllComponents, getComponentsByCategory } from '../../components-registry';

interface AddElementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddComponent: (component: LPComponent) => void;
}

// コンポーネントカテゴリ別のアイコンマッピング
const COMPONENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  // 基本
  'text': Type,
  'image': Image,
  'video': Video,
  'audio': Volume2,
  'spacer': MoveVertical,
  'divider': Minus,
  'pdf': FileText,

  // 見出し
  'headline': Heading1,
  'subheadline': Heading2,

  // コンテンツ
  'bullet': List,
  'bullets': List,
  'speech': MessageCircle,
  'imageText': ImagePlus,
  'table': Table,
  'accordion': ChevronDown,

  // 動画系
  'videoMenu': Menu,
  'videoChapter': Bookmark,

  // フォーム
  'form': FileText,
  'optinForm': FileText,
  'customForm': FormInput,
  'comment': MessageSquare,

  // ボタン
  'button': Square,
  'cta': Square,
  'nextLink': ArrowRight,

  // LINE
  'lineFriend': UserPlus,
  'lineQr': QrCode,

  // 決済
  'payment': CreditCard,
  'purchaseButton': ShoppingCart,
  'productList': Package,

  // イベント
  'eventForm': Calendar,
  'scheduleList': ListChecks,

  // カスタムフォーム
  'inputField': FormInput,
  'submitButton': Send,
  'cardInput': CreditCard,
  'productSelect': ShoppingBag,
  'cart': ShoppingCart,
  'orderBump': Package,

  // その他
  'header': Layout,
  'footer': Layout,
  'countdown': Timer,
  'progressBar': BarChart3,
  'customHtml': FileCode,
};

// UTAGE形式のカテゴリ定義
const UTAGE_CATEGORIES = [
  {
    id: 'basic',
    label: '基本',
    components: ['text', 'image', 'video', 'form', 'comment', 'footer'],
  },
  {
    id: 'headline',
    label: '見出し',
    components: ['headline', 'subheadline', 'bullet'],
  },
  {
    id: 'ui',
    label: 'UI要素',
    components: ['button', 'cta', 'audio', 'table', 'imageText', 'videoMenu', 'videoChapter'],
  },
  {
    id: 'structure',
    label: '構造',
    components: ['divider', 'countdown', 'progressBar', 'speech', 'accordion', 'pdf', 'customHtml', 'spacer'],
  },
  {
    id: 'line',
    label: 'LINE',
    components: ['lineFriend', 'lineQr'],
  },
  {
    id: 'payment',
    label: '決済',
    components: ['payment', 'purchaseButton', 'nextLink', 'productList'],
  },
  {
    id: 'event',
    label: 'イベント・予約',
    components: ['eventForm', 'scheduleList'],
  },
  {
    id: 'customForm',
    label: 'カスタムフォーム',
    components: ['inputField', 'submitButton', 'cardInput', 'productSelect', 'cart', 'orderBump'],
  },
];

// コンポーネント名のマッピング
const COMPONENT_LABELS: Record<string, string> = {
  // 基本
  'text': 'テキスト',
  'image': '画像',
  'video': '動画',
  'form': '登録フォーム',
  'optinForm': '登録フォーム',
  'comment': 'コメント',
  'footer': 'フッター',

  // 見出し
  'headline': 'ヘッドライン',
  'subheadline': 'サブヘッド',
  'bullet': 'ボレット',
  'bullets': 'ボレット',

  // UI
  'button': 'ボタン',
  'cta': 'ボタン',
  'audio': '音声',
  'table': '表',
  'imageText': '画像+テキスト',
  'videoMenu': '動画メニュー',
  'videoChapter': '動画チャプター',

  // 構造
  'divider': '区切り線',
  'countdown': 'カウントダウン',
  'progressBar': 'プログレスバー',
  'speech': '吹き出し',
  'accordion': 'アコーディオン',
  'pdf': 'PDF',
  'customHtml': 'カスタムHTML',
  'spacer': '余白',

  // LINE
  'lineFriend': '友だち追加ボタン',
  'lineQr': '友だち追加QRコード',

  // 決済
  'payment': '決済フォーム',
  'purchaseButton': '購入ボタン',
  'nextLink': '次へ進むリンク',
  'productList': '購入商品一覧',

  // イベント
  'eventForm': '申込フォーム',
  'scheduleList': '日程一覧',

  // カスタムフォーム
  'inputField': '入力欄',
  'submitButton': '送信ボタン',
  'cardInput': 'カード情報入力欄',
  'productSelect': '商品選択',
  'cart': '購入商品(カート)',
  'orderBump': 'オーダーバンプ',

  // その他
  'header': 'ヘッダー',
};

/**
 * コンポーネントボタン
 */
function ComponentButton({
  componentType,
  onClick,
}: {
  componentType: string;
  onClick: () => void;
}) {
  const Icon = COMPONENT_ICONS[componentType] || FileText;
  const label = COMPONENT_LABELS[componentType] || componentType;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-500 hover:bg-blue-50 hover:shadow-md"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 text-white">
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}

/**
 * 要素追加モーダル
 */
export function AddElementModal({
  isOpen,
  onClose,
  onAddComponent,
}: AddElementModalProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [favorites, setFavorites] = useState<string[]>([]);

  // 全コンポーネントを取得
  const allComponents = getAllComponents();

  // コンポーネントタイプからLPComponentを取得
  const handleSelectComponent = (componentType: string) => {
    const component = allComponents.find(
      (c) => c.type === componentType || c.type.toLowerCase() === componentType.toLowerCase()
    );
    if (component) {
      onAddComponent(component);
    } else {
      // レジストリにない場合はデフォルトのコンポーネントを作成
      const defaultComponent: LPComponent = {
        id: componentType,
        type: componentType,
        category: 'basic',
        name: COMPONENT_LABELS[componentType] || componentType,
        description: '',
        icon: componentType,
        defaultProps: [],
      };
      onAddComponent(defaultComponent);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">要素追加</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* タブ切り替え */}
          <TabsList className="mb-4 grid w-full grid-cols-2 bg-blue-100">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              要素一覧から追加
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              お気に入りから追加
            </TabsTrigger>
          </TabsList>

          {/* 要素一覧 */}
          <TabsContent value="all" className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-6">
              {UTAGE_CATEGORIES.map((category) => {
                // レジストリから該当するコンポーネントを取得
                const registeredComponents = allComponents.filter(
                  (c) => category.components.includes(c.type) || category.components.includes(c.type.toLowerCase())
                );

                // カテゴリ定義のコンポーネントを使用（レジストリにないものも含む）
                const availableComponents = category.components.filter((type) => {
                  // レジストリにあるか、ラベルが定義されているものを表示
                  return (
                    registeredComponents.some((c) => c.type === type || c.type.toLowerCase() === type.toLowerCase()) ||
                    COMPONENT_LABELS[type]
                  );
                });

                if (availableComponents.length === 0) return null;

                return (
                  <div key={category.id}>
                    {category.id !== 'basic' && (
                      <h3 className="mb-3 text-sm font-semibold text-gray-600">
                        {category.label}
                      </h3>
                    )}
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                      {availableComponents.map((componentType) => (
                        <ComponentButton
                          key={componentType}
                          componentType={componentType}
                          onClick={() => handleSelectComponent(componentType)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* お気に入り */}
          <TabsContent value="favorites" className="max-h-[60vh] overflow-y-auto">
            {favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Heart className="mb-4 h-12 w-12 text-gray-300" />
                <p>お気に入りに登録された要素はありません</p>
                <p className="text-sm">
                  要素を長押しするとお気に入りに追加できます
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {favorites.map((componentType) => (
                  <ComponentButton
                    key={componentType}
                    componentType={componentType}
                    onClick={() => handleSelectComponent(componentType)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
