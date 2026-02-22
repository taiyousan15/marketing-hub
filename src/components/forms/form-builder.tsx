'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GripVertical, Trash2, Settings, Save, Loader2, Eye, Code } from 'lucide-react';
import { FieldPalette, FieldType } from './field-palette';
import { FormPreview } from './form-preview';
import { updateFormFields } from '@/actions/forms';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string | null;
  required: boolean;
  options?: string[] | null;
  order: number;
}

interface SortableFieldProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortableField({ field, isSelected, onSelect, onDelete }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${isSelected ? 'border-primary ring-1 ring-primary bg-primary/5' : 'bg-white hover:border-gray-300'}`}
      onClick={onSelect}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{field.label}</span>
          <Badge variant="outline" className="text-xs shrink-0">{field.type}</Badge>
          {field.required && (
            <Badge variant="destructive" className="text-xs shrink-0">必須</Badge>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
}

interface FormBuilderProps {
  formId: string;
  formName: string;
  formDescription?: string | null;
  initialFields: FormField[];
}

export function FormBuilder({ formId, formName, formDescription, initialFields }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const handleAddField = useCallback((type: FieldType) => {
    const newField: FormField = {
      id: nanoid(),
      type,
      label: `${type === 'text' ? 'テキスト' : type === 'email' ? 'メールアドレス' : type === 'tel' ? '電話番号' : type}フィールド`,
      placeholder: '',
      required: false,
      options: ['select', 'checkbox', 'radio'].includes(type) ? ['選択肢1', '選択肢2'] : null,
      order: fields.length,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }, [fields.length]);

  const handleDeleteField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  }, [selectedFieldId]);

  const handleFieldUpdate = useCallback(
    (id: string, updates: Partial<FormField>) => {
      setFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((f) => f.id === active.id);
        const newIndex = items.findIndex((f) => f.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        return reordered.map((f, i) => ({ ...f, order: i }));
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFormFields(formId, fields);
      toast.success('フォームを保存しました');
    } catch (error) {
      toast.error('保存に失敗しました');
      console.error('Failed to save form:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="builder" className="gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              ビルダー
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              プレビュー
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          保存
        </Button>
      </div>

      {activeTab === 'builder' ? (
        <div className="flex flex-1 overflow-hidden">
          <FieldPalette onAddField={handleAddField} />

          <div className="flex-1 overflow-y-auto p-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 max-w-2xl mx-auto">
                  {fields.length === 0 ? (
                    <div className="border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground">
                      <p className="text-sm">左のパレットからフィールドを追加してください</p>
                    </div>
                  ) : (
                    fields.map((field) => (
                      <SortableField
                        key={field.id}
                        field={field}
                        isSelected={selectedFieldId === field.id}
                        onSelect={() => setSelectedFieldId(selectedFieldId === field.id ? null : field.id)}
                        onDelete={() => handleDeleteField(field.id)}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {selectedField && (
            <div className="w-72 border-l p-4 space-y-4 overflow-y-auto">
              <p className="text-sm font-semibold">フィールド設定</p>

              <div className="space-y-2">
                <Label className="text-xs">ラベル</Label>
                <Input
                  value={selectedField.label}
                  onChange={(e) => handleFieldUpdate(selectedField.id, { label: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">プレースホルダー</Label>
                <Input
                  value={selectedField.placeholder ?? ''}
                  onChange={(e) => handleFieldUpdate(selectedField.id, { placeholder: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">必須</Label>
                <Switch
                  checked={selectedField.required}
                  onCheckedChange={(v) => handleFieldUpdate(selectedField.id, { required: v })}
                />
              </div>

              {['select', 'radio', 'checkbox'].includes(selectedField.type) && (
                <div className="space-y-2">
                  <Label className="text-xs">選択肢 (1行ずつ)</Label>
                  <textarea
                    className="w-full text-sm border rounded p-2 h-24 resize-none"
                    value={(selectedField.options ?? []).join('\n')}
                    onChange={(e) =>
                      handleFieldUpdate(selectedField.id, {
                        options: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <FormPreview
            name={formName}
            description={formDescription}
            fields={fields}
          />
        </div>
      )}
    </div>
  );
}
