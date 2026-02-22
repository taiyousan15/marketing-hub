'use client';

import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Building2, User } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  stage: { name: string; probability: number; color: string };
  contact: { id: string; name: string | null; email: string | null } | null;
}

interface DealCardProps {
  deal: Deal;
  isDragging?: boolean;
  onClick?: () => void;
}

export function DealCard({ deal, isDragging, onClick }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: deal.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`bg-white rounded-lg border p-3 shadow-sm cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md hover:border-primary/30'
      } transition-all`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium leading-tight flex-1">{deal.title}</p>
        {deal.status === 'WON' && (
          <Badge className="text-xs bg-green-100 text-green-700 border-green-200">成約</Badge>
        )}
        {deal.status === 'LOST' && (
          <Badge variant="destructive" className="text-xs">失注</Badge>
        )}
      </div>

      <div className="text-base font-bold text-primary mb-2">
        {deal.amount > 0 ? formatAmount(deal.amount) : '金額未設定'}
      </div>

      {deal.contact && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <User className="h-3 w-3" />
          <span className="truncate">{deal.contact.name ?? deal.contact.email ?? '—'}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${deal.stage.color}20`, color: deal.stage.color }}
        >
          {deal.stage.probability}%
        </div>
      </div>
    </div>
  );
}
