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
  useDraggable,
} from '@dnd-kit/core';
import { LifecycleStage } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { updateLifecycleStage } from '@/actions/contacts';
import { toast } from 'sonner';

const STAGE_CONFIG: Record<LifecycleStage, { label: string; color: string; bg: string }> = {
  SUBSCRIBER: { label: '購読者', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
  LEAD: { label: 'リード', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  MQL: { label: 'MQL', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  SQL: { label: 'SQL', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
  OPPORTUNITY: { label: '商談中', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  CUSTOMER: { label: '顧客', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  EVANGELIST: { label: '推薦者', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

const STAGE_ORDER: LifecycleStage[] = [
  'SUBSCRIBER', 'LEAD', 'MQL', 'SQL', 'OPPORTUNITY', 'CUSTOMER', 'EVANGELIST'
];

interface Contact {
  id: string;
  name: string | null;
  email: string | null;
  score: number;
  lifecycleStage: LifecycleStage;
  tags: Array<{ name: string; color: string }>;
}

interface ContactCardProps {
  contact: Contact;
  isDragging?: boolean;
}

function ContactCard({ contact, isDragging }: ContactCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: contact.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white rounded-lg border p-3 shadow-sm cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : 'hover:shadow-md'
      } transition-shadow`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-xs">
            {contact.name?.[0]?.toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{contact.name ?? '名無し'}</p>
          <p className="text-xs text-muted-foreground truncate">{contact.email ?? ''}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <Badge variant="outline" className="text-xs px-1.5 py-0">
          スコア {contact.score}
        </Badge>
        {contact.tags.slice(0, 2).map((tag) => (
          <span
            key={tag.name}
            className="text-xs px-1.5 py-0 rounded border"
            style={{ borderColor: tag.color, color: tag.color }}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}

interface StageColumnProps {
  stage: LifecycleStage;
  contacts: Contact[];
  isOver: boolean;
}

function StageColumn({ stage, contacts, isOver }: StageColumnProps) {
  const config = STAGE_CONFIG[stage];
  const { setNodeRef } = useDroppable({ id: stage });

  return (
    <div className="flex flex-col min-w-[200px] max-w-[220px]">
      <div className={`rounded-t-lg border-b-2 px-3 py-2 ${config.bg}`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
          <Badge variant="secondary" className="text-xs">{contacts.length}</Badge>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[300px] rounded-b-lg border border-t-0 p-2 space-y-2 transition-colors ${
          isOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50/50 border-gray-200'
        }`}
      >
        {contacts.map((contact) => (
          <ContactCard key={contact.id} contact={contact} />
        ))}
        {contacts.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
            ドロップしてステージ変更
          </div>
        )}
      </div>
    </div>
  );
}

interface LifecycleKanbanProps {
  contacts: Contact[];
  onContactUpdate?: (contactId: string, stage: LifecycleStage) => void;
}

export function LifecycleKanban({ contacts: initialContacts, onContactUpdate }: LifecycleKanbanProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const groupedContacts = STAGE_ORDER.reduce<Record<LifecycleStage, Contact[]>>((acc, stage) => {
    acc[stage] = contacts.filter((c) => c.lifecycleStage === stage);
    return acc;
  }, {} as Record<LifecycleStage, Contact[]>);

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

      const contactId = active.id as string;
      const newStage = over.id as LifecycleStage;

      if (!STAGE_ORDER.includes(newStage)) return;

      const contact = contacts.find((c) => c.id === contactId);
      if (!contact || contact.lifecycleStage === newStage) return;

      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId ? { ...c, lifecycleStage: newStage } : c
        )
      );

      try {
        await updateLifecycleStage(contactId, newStage);
        onContactUpdate?.(contactId, newStage);
        toast.success(`${contact.name ?? 'コンタクト'}を${STAGE_CONFIG[newStage].label}に移動しました`);
      } catch (error) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contactId ? { ...c, lifecycleStage: contact.lifecycleStage } : c
          )
        );
        toast.error('ステージの更新に失敗しました');
        console.error('Failed to update lifecycle stage:', error);
      }
    },
    [contacts, onContactUpdate]
  );

  const activeContact = activeId ? contacts.find((c) => c.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGE_ORDER.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            contacts={groupedContacts[stage]}
            isOver={overId === stage}
          />
        ))}
      </div>
      <DragOverlay>
        {activeContact && (
          <div className="opacity-90 rotate-3">
            <ContactCard contact={activeContact} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
