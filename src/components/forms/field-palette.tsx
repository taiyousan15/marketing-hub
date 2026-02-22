'use client';

import { Button } from '@/components/ui/button';
import { AlignLeft, AtSign, Phone, TextCursorInput, ChevronDown, CheckSquare, Dot, Calendar } from 'lucide-react';

export type FieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';

const FIELD_TYPES: Array<{ type: FieldType; label: string; icon: typeof AlignLeft }> = [
  { type: 'text', label: 'テキスト', icon: AlignLeft },
  { type: 'email', label: 'メール', icon: AtSign },
  { type: 'tel', label: '電話番号', icon: Phone },
  { type: 'textarea', label: 'テキストエリア', icon: TextCursorInput },
  { type: 'select', label: 'セレクト', icon: ChevronDown },
  { type: 'checkbox', label: 'チェックボックス', icon: CheckSquare },
  { type: 'radio', label: 'ラジオボタン', icon: Dot },
  { type: 'date', label: '日付', icon: Calendar },
];

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void;
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <div className="w-52 border-r bg-gray-50/50 p-3 flex flex-col gap-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        フィールド
      </p>
      {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
        <Button
          key={type}
          variant="ghost"
          size="sm"
          className="justify-start gap-2 h-9 text-sm"
          onClick={() => onAddField(type)}
        >
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </Button>
      ))}
    </div>
  );
}
