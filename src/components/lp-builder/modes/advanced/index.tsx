'use client';

/**
 * LP Builder アドバンスドモード（UTAGE形式）
 * 左: プロパティパネル / 右: ビジュアルキャンバス
 */

import { useState } from 'react';
import { useLPBuilder } from '../../context/lp-builder-context';
import { PropertyPanel } from './property-panel';
import { VisualCanvas } from './visual-canvas';
import { AddElementModal } from './add-element-modal';

export function AdvancedMode() {
  const { state, actions } = useLPBuilder();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);

  const selectedComponent =
    state.components.find((c) => c.id === state.selectedComponentId) || null;

  // 要素追加ボタンのクリック処理
  const handleAddElement = (position?: number) => {
    setInsertPosition(position ?? null);
    setIsAddModalOpen(true);
  };

  // 要素追加モーダルからのコンポーネント追加
  const handleAddComponent = (component: Parameters<typeof actions.addComponent>[0]) => {
    actions.addComponent(component);
    setIsAddModalOpen(false);
    setInsertPosition(null);
  };

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {/* 左サイドバー: プロパティパネル（UTAGE形式） */}
      <div className="h-full w-[420px] flex-shrink-0 overflow-hidden bg-[#1e3a5f]">
        <PropertyPanel
          component={selectedComponent}
          onPropertyChange={actions.updateComponent}
          onClose={() => actions.selectComponent(null)}
        />
      </div>

      {/* 右側: ビジュアルキャンバス */}
      <div className="h-full flex-1 overflow-hidden bg-gray-100">
        <VisualCanvas
          components={state.components}
          selectedId={state.selectedComponentId}
          previewDevice={state.previewConfig.device}
          onSelectComponent={actions.selectComponent}
          onDeleteComponent={actions.deleteComponent}
          onDuplicateComponent={(id) => {
            const comp = state.components.find(c => c.id === id);
            if (comp) {
              // 複製ロジック - 新しいIDで同じコンポーネントを追加
              const registry = require('../../components-registry').getComponentByType(comp.componentType);
              if (registry) {
                actions.addComponent(registry);
              }
            }
          }}
          onMoveComponent={(id, direction) => {
            const index = state.components.findIndex(c => c.id === id);
            if (index === -1) return;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= state.components.length) return;

            const newComponents = [...state.components];
            [newComponents[index], newComponents[newIndex]] = [newComponents[newIndex], newComponents[index]];
            newComponents.forEach((c, i) => c.order = i);
            actions.reorderComponents(newComponents);
          }}
          onAddElement={handleAddElement}
          onComponentsChange={actions.reorderComponents}
        />
      </div>

      {/* 要素追加モーダル */}
      <AddElementModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setInsertPosition(null);
        }}
        onAddComponent={handleAddComponent}
      />
    </div>
  );
}
