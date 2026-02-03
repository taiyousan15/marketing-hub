"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichMenuUploader } from "./rich-menu-uploader";
import { Plus, Trash2 } from "lucide-react";

interface RichMenu {
  id: string;
  name: string;
  lineRichMenuId: string | null;
  size: { width: number; height: number };
  areas: Array<{
    bounds: { x: number; y: number; width: number; height: number };
    action: { type: string; data?: string; uri?: string; text?: string };
  }>;
  imageUrl: string | null;
  chatBarText: string;
  conditions: ConditionRule[] | null;
  isDefault: boolean;
}

interface ConditionRule {
  field: string;
  operator: string;
  value: string | number;
}

interface RichMenuEditorProps {
  richMenu?: RichMenu;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<RichMenu>) => Promise<void>;
}

const CONDITION_FIELDS = [
  { value: "score", label: "スコア" },
  { value: "leadScore", label: "リードスコア" },
  { value: "engagementScore", label: "エンゲージメント" },
  { value: "tier", label: "ティア" },
  { value: "tags", label: "タグ（含む）" },
];

const CONDITION_OPERATORS = [
  { value: "equals", label: "=" },
  { value: "not_equals", label: "≠" },
  { value: "greater_than", label: ">" },
  { value: "less_than", label: "<" },
  { value: "contains", label: "含む" },
];

const SIZE_PRESETS = [
  { value: "full", label: "フルサイズ (2500x1686)", width: 2500, height: 1686 },
  { value: "half", label: "ハーフサイズ (2500x843)", width: 2500, height: 843 },
  { value: "compact-full", label: "コンパクト (1200x810)", width: 1200, height: 810 },
  { value: "compact-half", label: "コンパクトハーフ (1200x405)", width: 1200, height: 405 },
];

export function RichMenuEditor({ richMenu, isOpen, onClose, onSave }: RichMenuEditorProps) {
  const [name, setName] = useState(richMenu?.name || "");
  const [chatBarText, setChatBarText] = useState(richMenu?.chatBarText || "メニュー");
  const [isDefault, setIsDefault] = useState(richMenu?.isDefault || false);
  const [sizePreset, setSizePreset] = useState("full");
  const [conditions, setConditions] = useState<ConditionRule[]>(
    (richMenu?.conditions as ConditionRule[]) || []
  );
  const [saving, setSaving] = useState(false);

  const selectedSize = SIZE_PRESETS.find((s) => s.value === sizePreset) || SIZE_PRESETS[0];

  const handleAddCondition = () => {
    setConditions([...conditions, { field: "score", operator: "greater_than", value: 0 }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleUpdateCondition = (index: number, updates: Partial<ConditionRule>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setConditions(newConditions);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name,
        chatBarText,
        isDefault,
        size: { width: selectedSize.width, height: selectedSize.height },
        conditions: conditions.length > 0 ? conditions : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{richMenu ? "リッチメニューを編集" : "リッチメニューを作成"}</DialogTitle>
          <DialogDescription>
            リッチメニューの設定を行います
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 基本設定 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>メニュー名</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: メインメニュー"
              />
            </div>

            <div className="space-y-2">
              <Label>チャットバーテキスト</Label>
              <Input
                value={chatBarText}
                onChange={(e) => setChatBarText(e.target.value)}
                placeholder="メニュー"
                maxLength={14}
              />
              <p className="text-xs text-muted-foreground">
                LINEトーク画面下部に表示されるテキスト（最大14文字）
              </p>
            </div>

            {!richMenu && (
              <div className="space-y-2">
                <Label>サイズ</Label>
                <Select value={sizePreset} onValueChange={setSizePreset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_PRESETS.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>デフォルトに設定</Label>
                <p className="text-xs text-muted-foreground">
                  条件に一致しないユーザーに表示されます
                </p>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>
          </div>

          {/* 画像アップロード（編集時のみ） */}
          {richMenu?.lineRichMenuId && (
            <div className="space-y-2">
              <Label>メニュー画像</Label>
              <RichMenuUploader
                richMenuId={richMenu.id}
                currentImageUrl={richMenu.imageUrl}
                onUploadComplete={() => {}}
              />
            </div>
          )}

          {/* 条件設定 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>表示条件（任意）</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddCondition}>
                <Plus className="h-4 w-4 mr-1" />
                条件追加
              </Button>
            </div>

            {conditions.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 border rounded-lg text-center">
                条件を追加すると、特定のセグメントにのみこのメニューが表示されます
              </p>
            ) : (
              <div className="space-y-2">
                {conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <Select
                      value={condition.field}
                      onValueChange={(value) => handleUpdateCondition(index, { field: value })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_FIELDS.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(value) => handleUpdateCondition(index, { operator: value })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      value={String(condition.value)}
                      onChange={(e) => handleUpdateCondition(index, {
                        value: condition.field === "tags" ? e.target.value : Number(e.target.value) || 0,
                      })}
                      className="flex-1"
                      placeholder="値"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCondition(index)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  すべての条件に一致するユーザーにこのメニューが表示されます
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving || !name}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
