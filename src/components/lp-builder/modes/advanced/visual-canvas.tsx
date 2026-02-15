'use client';

/**
 * UTAGE形式ビジュアルキャンバス
 * LPのビジュアルプレビューを表示し、要素を選択・操作可能
 */

import { useCallback, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Copy, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { ComponentInstance } from '../../types';
import { getComponentByType } from '../../components-registry';

interface VisualCanvasProps {
  components: ComponentInstance[];
  selectedId: string | null;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  onSelectComponent: (id: string | null) => void;
  onDeleteComponent: (id: string) => void;
  onDuplicateComponent: (id: string) => void;
  onMoveComponent: (id: string, direction: 'up' | 'down') => void;
  onAddElement: (position?: number) => void;
  onComponentsChange: (components: ComponentInstance[]) => void;
}

/**
 * インラインアクションボタン（UTAGE形式）
 */
function InlineActions({
  onAdd,
  onDrag,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  dragHandleProps,
}: {
  onAdd: () => void;
  onDrag?: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  return (
    <div className="absolute -right-1 top-1/2 z-20 flex -translate-y-1/2 translate-x-full flex-col gap-1">
      <button
        onClick={onAdd}
        className="flex h-8 w-8 items-center justify-center rounded bg-blue-500 text-white shadow-lg hover:bg-blue-600"
        title="要素を追加"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        {...dragHandleProps}
        className="flex h-8 w-8 cursor-grab items-center justify-center rounded bg-gray-500 text-white shadow-lg hover:bg-gray-600"
        title="ドラッグで移動"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        onClick={onDuplicate}
        className="flex h-8 w-8 items-center justify-center rounded bg-gray-500 text-white shadow-lg hover:bg-gray-600"
        title="複製"
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        onClick={onDelete}
        className="flex h-8 w-8 items-center justify-center rounded bg-red-500 text-white shadow-lg hover:bg-red-600"
        title="削除"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <button
        onClick={onMoveUp}
        disabled={!canMoveUp}
        className="flex h-8 w-8 items-center justify-center rounded bg-gray-500 text-white shadow-lg hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        title="上に移動"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        onClick={onMoveDown}
        disabled={!canMoveDown}
        className="flex h-8 w-8 items-center justify-center rounded bg-gray-500 text-white shadow-lg hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        title="下に移動"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * ソート可能なコンポーネントラッパー
 */
function SortableComponent({
  component,
  isSelected,
  index,
  totalCount,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onAdd,
}: {
  component: ComponentInstance;
  isSelected: boolean;
  index: number;
  totalCount: number;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAdd: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* コンポーネントプレビュー */}
      <div
        className={`relative transition-all ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
      >
        <ComponentPreview component={component} />

        {/* 選択時のインラインアクション（UTAGE形式） */}
        {isSelected && (
          <InlineActions
            onAdd={onAdd}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            canMoveUp={index > 0}
            canMoveDown={index < totalCount - 1}
            dragHandleProps={{ ...attributes, ...listeners }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * コンポーネントのビジュアルプレビュー
 */
function ComponentPreview({ component }: { component: ComponentInstance }) {
  const componentDef = getComponentByType(component.componentType);
  const props = component.props;

  // コンポーネントタイプに応じたプレビューを生成
  switch (component.componentType) {
    case 'headline':
      return (
        <div className="bg-white px-6 py-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            {String(props.headline || 'ヘッドラインを入力')}
          </h1>
        </div>
      );

    case 'subheadline':
      return (
        <div className="bg-white px-6 py-4 text-center">
          <h2 className="text-xl font-semibold text-gray-700 md:text-2xl">
            {String(props.subheadline || 'サブヘッドラインを入力')}
          </h2>
        </div>
      );

    case 'text':
      return (
        <div className="bg-white px-6 py-4">
          <p className="text-gray-700 leading-relaxed">
            {String(props.text || props.content || 'テキストを入力してください')}
          </p>
        </div>
      );

    case 'image':
      return (
        <div className="bg-white px-6 py-4">
          {props.imageUrl ? (
            <img
              src={String(props.imageUrl)}
              alt={String(props.alt || '')}
              className="mx-auto max-w-full"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <span className="text-gray-400">画像を設定してください</span>
            </div>
          )}
        </div>
      );

    case 'button':
    case 'cta':
      // ボタンテーマに基づくスタイル
      const buttonTheme = String(props.buttonTheme || 'green-3d');
      const getButtonStyles = () => {
        const themes: Record<string, { background: string; shadow?: string; borderRadius?: string }> = {
          'green-3d': { background: '#22c55e', shadow: '0 4px 0 #15803d', borderRadius: '8px' },
          'blue-3d': { background: '#3b82f6', shadow: '0 4px 0 #1d4ed8', borderRadius: '8px' },
          'red-3d': { background: '#ef4444', shadow: '0 4px 0 #b91c1c', borderRadius: '8px' },
          'orange-3d': { background: '#f97316', shadow: '0 4px 0 #c2410c', borderRadius: '8px' },
          'green-gradient': { background: 'linear-gradient(to bottom, #22c55e, #16a34a)', borderRadius: '8px' },
          'blue-gradient': { background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', borderRadius: '8px' },
          'yellow-gradient': { background: 'linear-gradient(to bottom, #fbbf24, #f59e0b)', borderRadius: '8px' },
          'green-flat': { background: '#22c55e', borderRadius: '0' },
          'blue-flat': { background: '#3b82f6', borderRadius: '0' },
          'green-rounded': { background: '#22c55e', borderRadius: '9999px' },
          'blue-rounded': { background: '#3b82f6', borderRadius: '9999px' },
          'orange': { background: '#f97316', borderRadius: '8px' },
          'green': { background: '#22c55e', borderRadius: '8px' },
          'blue': { background: '#3b82f6', borderRadius: '8px' },
          'red': { background: '#ef4444', borderRadius: '8px' },
        };
        return themes[buttonTheme] || themes['green-3d'];
      };
      const btnStyles = getButtonStyles();
      const isTextDark = buttonTheme.includes('dark-text') || buttonTheme.includes('yellow');
      return (
        <div className="bg-white px-6 py-8 text-center">
          <button
            className="px-8 py-4 text-lg font-bold transition-all"
            style={{
              background: btnStyles.background,
              boxShadow: btnStyles.shadow || 'none',
              borderRadius: btnStyles.borderRadius || '8px',
              color: isTextDark ? '#000' : '#fff',
            }}
          >
            {String(props.buttonText || props.ctaText || '今すぐ登録する')}
            {props.subText && (
              <div className="mt-1 text-sm font-normal opacity-80">
                {String(props.subText)}
              </div>
            )}
          </button>
        </div>
      );

    case 'bullet':
    case 'bullets':
      const bulletText = String(props.bullets || props.items || '');
      const bulletItems = bulletText.split('\n').filter(Boolean);
      return (
        <div className="bg-white px-6 py-4">
          <ul className="space-y-2">
            {bulletItems.length > 0 ? (
              bulletItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                    ✓
                  </span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-400">ボレット項目を入力してください</li>
            )}
          </ul>
        </div>
      );

    case 'video':
      const videoUrl = String(props.videoUrl || '');
      const videoSource = String(props.videoSource || 'youtube');
      const aspectRatio = String(props.aspectRatio || '16:9');
      const aspectClass = aspectRatio === '4:3' ? 'aspect-[4/3]' : aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video';

      // YouTube URL からVideo IDを抽出
      const extractYouTubeId = (url: string): string | null => {
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
          /^([a-zA-Z0-9_-]{11})$/,
        ];
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      };

      // Vimeo URL からVideo IDを抽出
      const extractVimeoId = (url: string): string | null => {
        const patterns = [
          /vimeo\.com\/(\d+)/,
          /player\.vimeo\.com\/video\/(\d+)/,
        ];
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      };

      const hasVideoSource = videoUrl || (videoSource === 'iframe' && props.iframeUrl) || (videoSource === 'wistia' && props.wistiaId);

      return (
        <div className="bg-white px-6 py-4">
          {hasVideoSource ? (
            <div className={aspectClass}>
              {(videoSource === 'youtube' || !props.videoSource) && (() => {
                const youtubeId = extractYouTubeId(videoUrl);
                if (youtubeId) {
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}${props.autoplay ? '?autoplay=1&mute=1' : ''}`}
                      className="h-full w-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                return (
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-900">
                    <span className="text-gray-400">無効なYouTube URLです</span>
                  </div>
                );
              })()}
              {videoSource === 'vimeo' && (() => {
                const vimeoId = extractVimeoId(videoUrl);
                if (vimeoId) {
                  return (
                    <iframe
                      src={`https://player.vimeo.com/video/${vimeoId}${props.autoplay ? '?autoplay=1&muted=1' : ''}`}
                      className="h-full w-full rounded-lg"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                return (
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-900">
                    <span className="text-gray-400">無効なVimeo URLです</span>
                  </div>
                );
              })()}
              {videoSource === 'external' && (
                <video
                  src={videoUrl}
                  className="h-full w-full rounded-lg"
                  controls={Boolean(props.controls ?? true)}
                  autoPlay={Boolean(props.autoplay)}
                  muted={Boolean(props.muted ?? props.autoplay)}
                  loop={Boolean(props.loop)}
                  poster={String(props.posterUrl || '')}
                />
              )}
              {videoSource === 'wistia' && props.wistiaId && (
                <iframe
                  src={`https://fast.wistia.net/embed/iframe/${props.wistiaId}`}
                  className="h-full w-full rounded-lg"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              )}
              {videoSource === 'iframe' && props.iframeUrl && (
                <iframe
                  src={String(props.iframeUrl)}
                  className="h-full w-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  scrolling={props.iframeScrolling ? 'yes' : 'no'}
                />
              )}
            </div>
          ) : (
            <div className={`flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-900 ${aspectClass}`}>
              <span className="text-gray-400">動画URLを設定してください</span>
            </div>
          )}
        </div>
      );

    case 'videoMenu':
      const videoCount = Number(props.videoCount) || 3;
      const publishedCount = Number(props.publishedCount) || 3;
      const themeColor = String(props.themeColor || '#1e3a5f');
      return (
        <div className="bg-white px-6 py-4">
          {/* チャプタータブ */}
          <div className="mb-4 flex gap-2">
            {Array.from({ length: videoCount }, (_, i) => (
              <button
                key={i}
                className={`flex-1 rounded-full py-3 text-center font-bold ${
                  i < publishedCount
                    ? 'text-white'
                    : 'cursor-not-allowed bg-gray-300 text-gray-500'
                }`}
                style={{
                  backgroundColor: i < publishedCount ? themeColor : undefined,
                }}
              >
                第{i + 1}話
              </button>
            ))}
          </div>
          {/* 動画プレビュー */}
          <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-900">
            <div className="text-center text-white">
              <div className="mx-auto mb-2 h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                ▶
              </div>
              <span className="text-gray-400">動画メニュー</span>
            </div>
          </div>
        </div>
      );

    case 'imageText':
      const imagePosition = String(props.imagePosition || 'left');
      return (
        <div className="bg-white px-6 py-4">
          <div className={`flex gap-6 ${imagePosition === 'right' ? 'flex-row-reverse' : ''}`}>
            {/* 画像 */}
            <div className="w-1/3 flex-shrink-0">
              {props.imageUrl ? (
                <img
                  src={String(props.imageUrl)}
                  alt=""
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                  <span className="text-xs text-gray-400">画像</span>
                </div>
              )}
            </div>
            {/* テキスト */}
            <div className="flex-1">
              <p className="text-gray-700 leading-relaxed">
                {String(props.text || 'テキストを入力してください')}
              </p>
            </div>
          </div>
        </div>
      );

    case 'countdown':
      return (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-8 text-center text-white">
          <p className="mb-4 text-lg">{String(props.label || '残り時間')}</p>
          <div className="flex justify-center gap-4">
            {['日', '時間', '分', '秒'].map((unit, i) => (
              <div key={unit} className="text-center">
                <div className="rounded-lg bg-white/20 px-4 py-2 text-3xl font-bold">
                  {['00', '12', '34', '56'][i]}
                </div>
                <div className="mt-1 text-sm">{unit}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'form':
    case 'optinForm':
      return (
        <div className="bg-gray-50 px-6 py-8">
          <div className="mx-auto max-w-md space-y-4">
            <input
              type="text"
              placeholder="お名前"
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
              disabled
            />
            <input
              type="email"
              placeholder="メールアドレス"
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
              disabled
            />
            <button
              className="w-full rounded-lg bg-blue-600 px-6 py-4 font-bold text-white"
              disabled
            >
              {String(props.submitText || '登録する')}
            </button>
          </div>
        </div>
      );

    case 'divider':
      return (
        <div className="bg-white px-6 py-4">
          <hr className="border-gray-300" />
        </div>
      );

    case 'spacer':
      const height = Number(props.height) || 40;
      return <div style={{ height: `${height}px` }} className="bg-white" />;

    case 'header':
      return (
        <div className="bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">
              {String(props.logoText || 'ロゴ')}
            </span>
            <nav className="flex gap-4">
              <span className="text-gray-600">メニュー1</span>
              <span className="text-gray-600">メニュー2</span>
            </nav>
          </div>
        </div>
      );

    case 'footer':
      return (
        <div className="bg-gray-800 px-6 py-8 text-center text-white">
          <p className="text-sm text-gray-400">
            {String(props.copyright || '© 2024 Your Company. All rights reserved.')}
          </p>
        </div>
      );

    default:
      // デフォルトプレビュー
      return (
        <div className="bg-white px-6 py-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-medium">{componentDef?.name || component.componentType}</span>
              <span className="text-xs text-gray-400">({componentDef?.category})</span>
            </div>
            {props.headline && (
              <div className="mt-2 text-lg font-bold">{String(props.headline)}</div>
            )}
            {props.description && (
              <div className="mt-1 text-sm text-gray-500">
                {String(props.description).substring(0, 100)}...
              </div>
            )}
          </div>
        </div>
      );
  }
}

/**
 * ビジュアルキャンバスメインコンポーネント
 */
export function VisualCanvas({
  components,
  selectedId,
  previewDevice,
  onSelectComponent,
  onDeleteComponent,
  onDuplicateComponent,
  onMoveComponent,
  onAddElement,
  onComponentsChange,
}: VisualCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // デバイス別の幅設定
  const deviceWidths = {
    desktop: 'max-w-4xl',
    tablet: 'max-w-xl',
    mobile: 'max-w-sm',
  };

  // ドラッグセンサーの設定
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

  // ドラッグ開始
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // ドラッグ終了
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = components.findIndex((c) => c.id === active.id);
        const newIndex = components.findIndex((c) => c.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newComponents = arrayMove(components, oldIndex, newIndex).map(
            (comp, idx) => ({ ...comp, order: idx })
          );
          onComponentsChange(newComponents);
        }
      }

      setActiveId(null);
    },
    [components, onComponentsChange]
  );

  // キャンバス背景クリックで選択解除
  const handleCanvasClick = useCallback(() => {
    onSelectComponent(null);
  }, [onSelectComponent]);

  // アクティブコンポーネント
  const activeComponent = activeId
    ? components.find((c) => c.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="h-full overflow-auto bg-gray-200 p-8"
        onClick={handleCanvasClick}
      >
        {/* プレビューコンテナ */}
        <div
          className={`mx-auto min-h-full bg-white shadow-xl ${deviceWidths[previewDevice]}`}
        >
          {components.length === 0 ? (
            // 空状態
            <div className="flex min-h-[400px] flex-col items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <Plus className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  要素を追加してLPを作成
                </h3>
                <p className="mb-4 text-sm text-gray-500">
                  下のボタンをクリックして要素を追加してください
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddElement(0);
                  }}
                  className="rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white shadow-lg hover:bg-blue-600"
                >
                  + 要素を追加
                </button>
              </div>
            </div>
          ) : (
            // コンポーネント一覧
            <SortableContext
              items={components.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {components.map((component, index) => (
                <SortableComponent
                  key={component.id}
                  component={component}
                  isSelected={selectedId === component.id}
                  index={index}
                  totalCount={components.length}
                  onSelect={() => onSelectComponent(component.id)}
                  onDelete={() => onDeleteComponent(component.id)}
                  onDuplicate={() => onDuplicateComponent(component.id)}
                  onMoveUp={() => onMoveComponent(component.id, 'up')}
                  onMoveDown={() => onMoveComponent(component.id, 'down')}
                  onAdd={() => onAddElement(index + 1)}
                />
              ))}

              {/* 最後に要素追加ボタン */}
              <div className="flex justify-center py-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddElement(components.length);
                  }}
                  className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-3 text-gray-500 transition-colors hover:border-blue-500 hover:text-blue-500"
                >
                  <Plus className="h-5 w-5" />
                  要素を追加
                </button>
              </div>
            </SortableContext>
          )}
        </div>
      </div>

      {/* ドラッグオーバーレイ */}
      <DragOverlay>
        {activeComponent && (
          <div className="rounded-lg bg-white shadow-2xl ring-2 ring-blue-500">
            <ComponentPreview component={activeComponent} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
