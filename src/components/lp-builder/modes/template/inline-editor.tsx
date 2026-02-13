'use client';

/**
 * テンプレートインラインエディター
 * テンプレートを選択後、直接テキストをクリックして編集
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Wrench,
  Save,
  Eye,
  Check,
  X,
  Edit2,
} from 'lucide-react';
import { useLPBuilder } from '../../context/lp-builder-context';
import { LPTemplate, ComponentInstance } from '../../types';
import { getComponentByType } from '../../components-registry';
import { toast } from 'sonner';

interface InlineEditorProps {
  template: LPTemplate;
  components: ComponentInstance[];
  onBackToGallery: () => void;
  onOpenAdvanced: () => void;
}

export function InlineEditor({
  template,
  components,
  onBackToGallery,
  onOpenAdvanced,
}: InlineEditorProps) {
  const { state, actions } = useLPBuilder();
  const [editingField, setEditingField] = useState<{
    componentId: string;
    propKey: string;
    value: string;
  } | null>(null);

  const handleStartEdit = useCallback(
    (componentId: string, propKey: string, currentValue: string) => {
      setEditingField({ componentId, propKey, value: currentValue });
    },
    []
  );

  const handleSaveEdit = useCallback(() => {
    if (editingField) {
      actions.updateTemplateComponent(
        editingField.componentId,
        editingField.propKey,
        editingField.value
      );
      setEditingField(null);
      toast.success('変更を保存しました');
    }
  }, [editingField, actions]);

  const handleCancelEdit = useCallback(() => {
    setEditingField(null);
  }, []);

  const handleApplyTemplate = useCallback(() => {
    actions.applyTemplate();
    toast.success('テンプレートを適用しました。アドバンスドモードで編集できます。');
  }, [actions]);

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBackToGallery}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              ギャラリーに戻る
            </Button>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{template.name}</h2>
              <p className="text-sm text-gray-600">
                テキストをクリックして直接編集
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onOpenAdvanced}>
              <Wrench className="mr-2 h-4 w-4" />
              アドバンスドで開く
            </Button>
            <Button onClick={handleApplyTemplate}>
              <Check className="mr-2 h-4 w-4" />
              このLPを使用する
            </Button>
          </div>
        </div>
      </div>

      {/* エディター */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
        <div className="mx-auto max-w-4xl">
          {/* プレビュー/エディター */}
          <Card className="overflow-hidden bg-white shadow-xl">
            {state.templateState.editedComponents.map((comp) => (
              <ComponentPreview
                key={comp.id}
                component={comp}
                editingField={editingField}
                onStartEdit={handleStartEdit}
                onChangeValue={(value) =>
                  editingField &&
                  setEditingField({ ...editingField, value })
                }
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
              />
            ))}
          </Card>
        </div>
      </div>

      {/* フッター */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {state.templateState.hasChanges ? (
              <span className="text-orange-600">• 未保存の変更があります</span>
            ) : (
              'テキストをクリックして編集できます'
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={actions.save}>
              <Save className="mr-2 h-4 w-4" />
              下書き保存
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ComponentPreviewProps {
  component: ComponentInstance;
  editingField: { componentId: string; propKey: string; value: string } | null;
  onStartEdit: (componentId: string, propKey: string, value: string) => void;
  onChangeValue: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

function ComponentPreview({
  component,
  editingField,
  onStartEdit,
  onChangeValue,
  onSaveEdit,
  onCancelEdit,
}: ComponentPreviewProps) {
  const componentDef = getComponentByType(component.componentType);
  const isEditing = editingField?.componentId === component.id;

  // カテゴリに応じたスタイル（UTAGE互換）
  const getCategoryStyles = () => {
    switch (component.category) {
      case 'headline':
        return 'bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16';
      case 'other':
        if (component.componentType === 'countdown') {
          return 'bg-red-600 text-white py-4';
        }
        if (component.componentType === 'footer') {
          return 'bg-gray-900 text-white py-8';
        }
        return 'bg-gray-50 py-8';
      case 'button':
        return 'bg-blue-600 text-white py-12';
      case 'content':
        return 'bg-gray-50 py-12';
      case 'payment':
        return 'bg-white py-12';
      default:
        return 'bg-white py-12';
    }
  };

  return (
    <div className={`px-8 ${getCategoryStyles()}`}>
      <div className="mx-auto max-w-3xl">
        {/* Headline */}
        {component.props.headline && (
          <EditableText
            componentId={component.id}
            propKey="headline"
            value={String(component.props.headline)}
            editingField={editingField}
            onStartEdit={onStartEdit}
            onChangeValue={onChangeValue}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            className={`text-3xl font-bold ${
              ['headline', 'button'].includes(component.category) ||
              ['countdown', 'footer'].includes(component.componentType)
                ? 'text-white'
                : 'text-gray-900'
            }`}
          />
        )}

        {/* Logo Text */}
        {component.props.logoText && (
          <EditableText
            componentId={component.id}
            propKey="logoText"
            value={String(component.props.logoText)}
            editingField={editingField}
            onStartEdit={onStartEdit}
            onChangeValue={onChangeValue}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            className="text-xl font-bold text-gray-900"
          />
        )}

        {/* Subheadline / Description */}
        {(component.props.subheadline || component.props.description) && (
          <EditableText
            componentId={component.id}
            propKey={component.props.subheadline ? 'subheadline' : 'description'}
            value={String(component.props.subheadline || component.props.description)}
            editingField={editingField}
            onStartEdit={onStartEdit}
            onChangeValue={onChangeValue}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            className={`mt-4 text-lg ${
              ['hero', 'cta', 'countdown', 'footer'].includes(component.category)
                ? 'text-white/90'
                : 'text-gray-600'
            }`}
            multiline
          />
        )}

        {/* CTA Button */}
        {(component.props.ctaText ||
          component.props.ctaPrimary ||
          component.props.buttonText ||
          component.props.submitText) && (
          <div className="mt-6">
            <EditableText
              componentId={component.id}
              propKey={
                component.props.ctaText
                  ? 'ctaText'
                  : component.props.ctaPrimary
                  ? 'ctaPrimary'
                  : component.props.buttonText
                  ? 'buttonText'
                  : 'submitText'
              }
              value={String(
                component.props.ctaText ||
                  component.props.ctaPrimary ||
                  component.props.buttonText ||
                  component.props.submitText
              )}
              editingField={editingField}
              onStartEdit={onStartEdit}
              onChangeValue={onChangeValue}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              className="inline-block rounded-lg bg-white px-8 py-4 font-semibold text-blue-600 shadow-lg hover:bg-gray-50"
              isButton
            />
          </div>
        )}

        {/* Problems List */}
        {component.props.problems && (
          <EditableText
            componentId={component.id}
            propKey="problems"
            value={String(component.props.problems)}
            editingField={editingField}
            onStartEdit={onStartEdit}
            onChangeValue={onChangeValue}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            className="mt-4 text-gray-600"
            multiline
          />
        )}

        {/* Features */}
        {component.props.features && (
          <EditableText
            componentId={component.id}
            propKey="features"
            value={String(component.props.features)}
            editingField={editingField}
            onStartEdit={onStartEdit}
            onChangeValue={onChangeValue}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            className="mt-4 text-gray-600"
            multiline
          />
        )}

        {/* Urgency Message */}
        {component.props.urgencyMessage && (
          <EditableText
            componentId={component.id}
            propKey="urgencyMessage"
            value={String(component.props.urgencyMessage)}
            editingField={editingField}
            onStartEdit={onStartEdit}
            onChangeValue={onChangeValue}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            className="mt-2 text-white/90"
          />
        )}
      </div>
    </div>
  );
}

interface EditableTextProps {
  componentId: string;
  propKey: string;
  value: string;
  editingField: { componentId: string; propKey: string; value: string } | null;
  onStartEdit: (componentId: string, propKey: string, value: string) => void;
  onChangeValue: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  className?: string;
  multiline?: boolean;
  isButton?: boolean;
}

function EditableText({
  componentId,
  propKey,
  value,
  editingField,
  onStartEdit,
  onChangeValue,
  onSaveEdit,
  onCancelEdit,
  className = '',
  multiline = false,
  isButton = false,
}: EditableTextProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const isEditing =
    editingField?.componentId === componentId && editingField?.propKey === propKey;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      onSaveEdit();
    }
    if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        {multiline ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editingField.value}
            onChange={(e) => onChangeValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] w-full"
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={editingField.value}
            onChange={(e) => onChangeValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
          />
        )}
        <div className="absolute -right-2 -top-2 flex gap-1">
          <Button size="sm" variant="default" onClick={onSaveEdit} className="h-6 w-6 p-0">
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={onCancelEdit} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative cursor-pointer ${className}`}
      onClick={() => onStartEdit(componentId, propKey, value)}
    >
      {multiline ? (
        <div className="whitespace-pre-line">{value}</div>
      ) : isButton ? (
        <span>{value}</span>
      ) : (
        value
      )}
      <span className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <Edit2 className="h-4 w-4 text-blue-500" />
      </span>
    </div>
  );
}
