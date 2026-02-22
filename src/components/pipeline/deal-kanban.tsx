'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DealCard } from './deal-card';
import { updateDeal } from '@/actions/pipeline';
import { toast } from 'sonner';

interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  probability: number;
}

interface Deal {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  stageId: string;
  stage: Stage;
  contact: { id: string; name: string | null; email: string | null } | null;
}

interface StageColumnProps {
  stage: Stage;
  deals: Deal[];
  isOver: boolean;
  onAddDeal: () => void;
}

function StageColumn({ stage, deals, isOver, onAddDeal }: StageColumnProps) {
  const { setNodeRef } = useDroppable({ id: stage.id });

  const totalAmount = deals.reduce((sum, d) => sum + d.amount, 0);
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="flex flex-col min-w-[220px] max-w-[240px]">
      <div
        className="rounded-t-lg px-3 py-2 border-b-2"
        style={{ borderColor: stage.color, backgroundColor: `${stage.color}15` }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold">{stage.name}</span>
          <Badge variant="secondary" className="text-xs">{deals.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{formatAmount(totalAmount)}</p>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] rounded-b-lg border border-t-0 p-2 space-y-2 transition-colors ${
          isOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50/50 border-gray-200'
        }`}
      >
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={onAddDeal}
        >
          <Plus className="h-3 w-3 mr-1" />
          案件追加
        </Button>
      </div>
    </div>
  );
}

interface DealKanbanProps {
  pipelineId: string;
  stages: Stage[];
  deals: Deal[];
  onAddDeal: (stageId?: string) => void;
  onRefresh: () => void;
}

export function DealKanban({ stages, deals: initialDeals, onAddDeal, onRefresh }: DealKanbanProps) {
  const [deals, setDeals] = useState(initialDeals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const groupedDeals = stages.reduce<Record<string, Deal[]>>((acc, stage) => {
    acc[stage.id] = deals.filter((d) => d.stageId === stage.id);
    return acc;
  }, {});

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId((event.over?.id as string) ?? null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setOverId(null);

      if (!over) return;

      const dealId = active.id as string;
      const newStageId = over.id as string;

      const deal = deals.find((d) => d.id === dealId);
      if (!deal || deal.stageId === newStageId) return;

      const newStage = stages.find((s) => s.id === newStageId);
      if (!newStage) return;

      setDeals((prev) =>
        prev.map((d) =>
          d.id === dealId ? { ...d, stageId: newStageId, stage: newStage } : d
        )
      );

      try {
        await updateDeal(dealId, { stageId: newStageId });
        toast.success(`${deal.title}を${newStage.name}に移動しました`);
        onRefresh();
      } catch (error) {
        setDeals((prev) =>
          prev.map((d) =>
            d.id === dealId ? { ...d, stageId: deal.stageId, stage: deal.stage } : d
          )
        );
        toast.error('案件の移動に失敗しました');
        console.error('Failed to move deal:', error);
      }
    },
    [deals, stages, onRefresh]
  );

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            deals={groupedDeals[stage.id] ?? []}
            isOver={overId === stage.id}
            onAddDeal={() => onAddDeal(stage.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal && (
          <div className="opacity-90 rotate-2">
            <DealCard deal={activeDeal} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
