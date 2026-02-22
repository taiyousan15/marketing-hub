'use client';

import { Node } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NodeData {
  label: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

interface NodeConfigPanelProps {
  node: Node<NodeData>;
  onUpdate: (nodeId: string, data: Partial<NodeData>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

const NODE_TYPE_CONFIGS: Record<string, { label: string; fields: Array<{ key: string; label: string; type: string; options?: string[] }> }> = {
  TRIGGER: {
    label: 'トリガー設定',
    fields: [
      {
        key: 'triggerType',
        label: 'トリガー種別',
        type: 'select',
        options: ['新規登録', '購入完了', 'タグ追加', 'カート放棄', 'フォーム送信'],
      },
    ],
  },
  ACTION: {
    label: 'アクション設定',
    fields: [
      {
        key: 'actionType',
        label: 'アクション種別',
        type: 'select',
        options: ['メール送信', 'LINE送信', 'タグ追加', 'タグ削除', 'スコア変更'],
      },
      { key: 'subject', label: '件名', type: 'text' },
    ],
  },
  CONDITION: {
    label: '条件設定',
    fields: [
      { key: 'field', label: '条件フィールド', type: 'text' },
      {
        key: 'operator',
        label: '演算子',
        type: 'select',
        options: ['等しい', '含む', '以上', '以下'],
      },
      { key: 'value', label: '値', type: 'text' },
    ],
  },
  DELAY: {
    label: '待機設定',
    fields: [
      { key: 'days', label: '日数', type: 'number' },
      { key: 'hours', label: '時間', type: 'number' },
    ],
  },
  AI_DECISION: {
    label: 'AI判断設定',
    fields: [
      { key: 'prompt', label: '判断プロンプト', type: 'text' },
    ],
  },
};

export function NodeConfigPanel({ node, onUpdate, onDelete, onClose }: NodeConfigPanelProps) {
  const nodeType = node.type as string;
  const config = NODE_TYPE_CONFIGS[nodeType] ?? { label: '設定', fields: [] };
  const nodeData = node.data;

  const handleLabelChange = (label: string) => {
    onUpdate(node.id, { label });
  };

  const handleConfigChange = (key: string, value: string) => {
    onUpdate(node.id, {
      config: { ...(nodeData.config ?? {}), [key]: value },
    });
  };

  return (
    <div className="w-72 bg-white border-l shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">{config.label}</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">ラベル</Label>
          <Input
            value={nodeData.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {config.fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label className="text-xs">{field.label}</Label>
            {field.type === 'select' ? (
              <Select
                value={(nodeData.config?.[field.key] as string) ?? ''}
                onValueChange={(v) => handleConfigChange(field.key, v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="選択..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-sm">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={field.type}
                value={(nodeData.config?.[field.key] as string) ?? ''}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                className="h-8 text-sm"
              />
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => onDelete(node.id)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          ノードを削除
        </Button>
      </div>
    </div>
  );
}
