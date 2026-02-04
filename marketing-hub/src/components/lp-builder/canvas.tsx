'use client';

/**
 * LP Builder キャンバスコンポーネント
 * ドラッグ&ドロップでコンポーネントを配置・並び替え
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
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { ComponentInstance } from './types';
import { getComponentByType } from './components-registry';

interface CanvasProps {
  components: ComponentInstance[];
  selectedId: string | null;
  onComponentsChange: (components: ComponentInstance[]) => void;
  onSelectComponent: (id: string | null) => void;
}

/**
 * ソート可能なコンポーネントアイテム
 */
function SortableComponentItem({
  component,
  isSelected,
  onSelect,
  onDelete,
}: {
  component: ComponentInstance;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: component.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const componentDef = getComponentByType(component.componentType);
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card
        className={`cursor-pointer transition-all ${
          isSelected
            ? 'border-2 border-blue-500 shadow-lg'
            : 'border border-gray-200 hover:border-gray-300'
        }`}
        onClick={onSelect}
      >
        <div className="flex items-center gap-2 p-4">
          {/* ドラッグハンドル */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="h-5 w-5" />
          </button>

          {/* コンポーネント情報 */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{componentDef?.name}</span>
              <span className="text-xs text-gray-500">({componentDef?.category})</span>
            </div>
            <div className="text-sm text-gray-600">
              {Object.entries(component.props)
                .slice(0, 2)
                .map(([key, value]) => (
                  <span key={key} className="mr-2">
                    {key}: {String(value).substring(0, 30)}
                    {String(value).length > 30 ? '...' : ''}
                  </span>
                ))}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsPreview(!isPreview);
              }}
            >
              {isPreview ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {/* プレビュー */}
        {isPreview && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <ComponentPreview component={component} />
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * コンポーネントのプレビュー表示
 */
function ComponentPreview({ component }: { component: ComponentInstance }) {
  const componentDef = getComponentByType(component.componentType);

  // 簡易プレビュー（実際の実装では各コンポーネントのレンダリングロジックを使用）
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">プレビュー</div>
      <div className="rounded-lg border border-gray-300 bg-white p-4">
        <div className="mb-2 text-lg font-bold">
          {component.props.headline || component.props.logoText || componentDef?.name}
        </div>
        {component.props.description && (
          <div className="text-sm text-gray-600">{String(component.props.description)}</div>
        )}
        {component.props.ctaText && (
          <button className="mt-2 rounded bg-blue-600 px-4 py-2 text-white">
            {String(component.props.ctaText)}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * キャンバスメインコンポーネント
 */
export function Canvas({
  components,
  selectedId,
  onComponentsChange,
  onSelectComponent,
}: CanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // ドラッグセンサーの設定
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
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
          const newComponents = arrayMove(components, oldIndex, newIndex).map((comp, idx) => ({
            ...comp,
            order: idx,
          }));
          onComponentsChange(newComponents);
        }
      }

      setActiveId(null);
    },
    [components, onComponentsChange]
  );

  // コンポーネント削除
  const handleDelete = useCallback(
    (id: string) => {
      const newComponents = components
        .filter((c) => c.id !== id)
        .map((comp, idx) => ({ ...comp, order: idx }));
      onComponentsChange(newComponents);
      if (selectedId === id) {
        onSelectComponent(null);
      }
    },
    [components, selectedId, onComponentsChange, onSelectComponent]
  );

  // アクティブなコンポーネントを取得
  const activeComponent = activeId ? components.find((c) => c.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col">
        {/* キャンバスヘッダー */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">キャンバス</h2>
              <p className="text-sm text-gray-500">
                {components.length}個のコンポーネント
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('すべてのコンポーネントをクリアしますか？')) {
                    onComponentsChange([]);
                    onSelectComponent(null);
                  }
                }}
                disabled={components.length === 0}
              >
                すべてクリア
              </Button>
            </div>
          </div>
        </div>

        {/* キャンバスコンテンツ */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {components.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                  <GripVertical className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  コンポーネントを追加
                </h3>
                <p className="text-sm text-gray-500">
                  左のサイドバーからコンポーネントをドラッグ&ドロップ
                  <br />
                  またはクリックして追加してください
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl">
              <SortableContext
                items={components.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {components.map((component) => (
                  <SortableComponentItem
                    key={component.id}
                    component={component}
                    isSelected={selectedId === component.id}
                    onSelect={() => onSelectComponent(component.id)}
                    onDelete={() => handleDelete(component.id)}
                  />
                ))}
              </SortableContext>
            </div>
          )}
        </div>
      </div>

      {/* ドラッグオーバーレイ */}
      <DragOverlay>
        {activeComponent && (
          <Card className="w-full max-w-4xl border-2 border-blue-500 bg-white p-4 opacity-90 shadow-xl">
            <div className="flex items-center gap-2">
              <GripVertical className="h-5 w-5 text-gray-400" />
              <span className="font-semibold">
                {getComponentByType(activeComponent.componentType)?.name}
              </span>
            </div>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
