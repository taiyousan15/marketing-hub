'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuickReplyItem {
  type: 'message' | 'uri' | 'postback';
  label: string;
  text?: string;
  uri?: string;
  data?: string;
}

interface QuickReplyEditorProps {
  value?: QuickReplyItem[];
  onChange?: (items: QuickReplyItem[]) => void;
}

export function QuickReplyEditor({ value, onChange }: QuickReplyEditorProps) {
  const [items, setItems] = useState<QuickReplyItem[]>(
    value ?? []
  );

  const update = (next: QuickReplyItem[]) => {
    setItems(next);
    onChange?.(next);
  };

  const addItem = () => {
    if (items.length >= 13) {
      toast.error('クイックリプライは最大13個まで追加できます');
      return;
    }
    update([...items, { type: 'message', label: '', text: '' }]);
  };

  const removeItem = (index: number) => {
    update(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, patch: Partial<QuickReplyItem>) => {
    update(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          クイックリプライ ({items.length}/13)
        </Label>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-3 w-3 mr-1" />
          追加
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">
          クイックリプライボタンを追加してください
        </p>
      )}

      {items.map((item, index) => (
        <div key={index} className="p-3 border rounded-lg bg-gray-50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">ボタン {index + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">タイプ</Label>
              <Select
                value={item.type}
                onValueChange={(v) =>
                  updateItem(index, { type: v as QuickReplyItem['type'] })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">メッセージ送信</SelectItem>
                  <SelectItem value="uri">URL遷移</SelectItem>
                  <SelectItem value="postback">ポストバック</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ラベル</Label>
              <Input
                placeholder="ボタンのテキスト"
                value={item.label}
                onChange={(e) => updateItem(index, { label: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {item.type === 'message' && (
            <div className="space-y-1">
              <Label className="text-xs">送信テキスト</Label>
              <Input
                placeholder="ユーザーが送信するテキスト"
                value={item.text ?? ''}
                onChange={(e) => updateItem(index, { text: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          )}

          {item.type === 'uri' && (
            <div className="space-y-1">
              <Label className="text-xs">URL</Label>
              <Input
                placeholder="https://example.com"
                value={item.uri ?? ''}
                onChange={(e) => updateItem(index, { uri: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          )}

          {item.type === 'postback' && (
            <div className="space-y-1">
              <Label className="text-xs">ポストバックデータ</Label>
              <Input
                placeholder="action=buy&itemId=123"
                value={item.data ?? ''}
                onChange={(e) => updateItem(index, { data: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          )}
        </div>
      ))}

      {items.length > 0 && (
        <div className="p-3 border rounded-lg bg-blue-50 border-blue-100">
          <p className="text-xs text-blue-700 font-medium mb-2">プレビュー</p>
          <div className="flex flex-wrap gap-1.5">
            {items.map((item, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-white border border-blue-300 rounded-full text-xs text-blue-700 font-medium"
              >
                {item.label || `ボタン ${i + 1}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
