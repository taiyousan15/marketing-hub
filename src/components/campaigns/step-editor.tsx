"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { StepEditorMessage } from "./step-editor-message";
import type {
  CampaignStep,
  StepType,
  StepFormData,
  MessageContent,
  ActionContent,
  ConditionContent,
} from "@/types/campaign";

interface StepEditorProps {
  step?: CampaignStep;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: StepFormData) => Promise<void>;
  isLine: boolean;
  allSteps?: CampaignStep[];
}

const stepTypes: { value: StepType; label: string }[] = [
  { value: "MESSAGE", label: "メッセージ送信" },
  { value: "WAIT", label: "待機" },
  { value: "CONDITION", label: "条件分岐" },
  { value: "ACTION", label: "アクション" },
];

export function StepEditor({
  step,
  isOpen,
  onClose,
  onSave,
  isLine,
  allSteps = [],
}: StepEditorProps) {
  const [formData, setFormData] = useState<StepFormData>({
    type: (step?.type as StepType) || "MESSAGE",
    delayDays: step?.delayDays || 0,
    delayHours: step?.delayHours || 0,
    delayMinutes: step?.delayMinutes || 0,
    sendTime: step?.sendTime || undefined,
    subject: step?.subject || undefined,
    content: step?.content || { type: "text", text: "", texts: [""] },
    conditions: step?.conditions || undefined,
    trueBranchOrder: step?.trueBranchOrder ?? undefined,
    falseBranchOrder: step?.falseBranchOrder ?? undefined,
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const updateMessageContent = (updates: Partial<MessageContent>) => {
    setFormData({
      ...formData,
      content: { ...(formData.content as MessageContent), ...updates },
    });
  };

  const updateActionContent = (updates: Partial<ActionContent>) => {
    setFormData({
      ...formData,
      content: { ...(formData.content as ActionContent), ...updates },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step ? "ステップを編集" : "ステップを追加"}</DialogTitle>
          <DialogDescription>配信ステップの内容を設定します</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ステップタイプ */}
          <div className="space-y-2">
            <Label>ステップタイプ</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => {
                const type = value as StepType;
                let content = formData.content;
                if (type === "MESSAGE") content = { type: "text", text: "", texts: [""] };
                else if (type === "ACTION") content = { type: "add_tag" };
                else if (type === "WAIT") content = { type: "wait" };
                else if (type === "CONDITION")
                  content = { type: "condition", field: "", operator: "equals", value: "" };
                setFormData({ ...formData, type, content });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stepTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* タイミング設定 (MESSAGE / ACTION / CONDITION) */}
          {formData.type !== "WAIT" && (
            <div className="space-y-2">
              <Label>送信タイミング</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">日後</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.delayDays}
                    onChange={(e) =>
                      setFormData({ ...formData, delayDays: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">時間後</Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={formData.delayHours}
                    onChange={(e) =>
                      setFormData({ ...formData, delayHours: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">分後</Label>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={formData.delayMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, delayMinutes: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground">送信時刻（任意）</Label>
                <Input
                  type="time"
                  value={formData.sendTime || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, sendTime: e.target.value || undefined })
                  }
                  placeholder="HH:MM"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  指定すると、遅延後の指定時刻に送信されます
                </p>
              </div>
            </div>
          )}

          {/* WAIT 待機時間 */}
          {formData.type === "WAIT" && (
            <div className="space-y-2">
              <Label>待機時間</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">日</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.delayDays}
                    onChange={(e) =>
                      setFormData({ ...formData, delayDays: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">時間</Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={formData.delayHours}
                    onChange={(e) =>
                      setFormData({ ...formData, delayHours: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">分</Label>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={formData.delayMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, delayMinutes: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* MESSAGE コンテンツ — 別コンポーネントに委譲 */}
          {formData.type === "MESSAGE" && (
            <StepEditorMessage
              content={formData.content as MessageContent}
              subject={formData.subject}
              isLine={isLine}
              onContentChange={updateMessageContent}
              onSubjectChange={(subject) => setFormData({ ...formData, subject })}
            />
          )}

          {/* ACTION 設定 */}
          {formData.type === "ACTION" && (
            <div className="space-y-4">
              <div>
                <Label>アクションタイプ</Label>
                <Select
                  value={(formData.content as ActionContent).type}
                  onValueChange={(value) =>
                    updateActionContent({ type: value as ActionContent["type"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add_tag">タグを追加</SelectItem>
                    <SelectItem value="remove_tag">タグを削除</SelectItem>
                    <SelectItem value="update_score">スコアを更新</SelectItem>
                    <SelectItem value="start_campaign">別のキャンペーンを開始</SelectItem>
                    <SelectItem value="webhook">Webhookを送信</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {((formData.content as ActionContent).type === "add_tag" ||
                (formData.content as ActionContent).type === "remove_tag") && (
                <div>
                  <Label>タグID</Label>
                  <Input
                    value={(formData.content as ActionContent).tagId || ""}
                    onChange={(e) => updateActionContent({ tagId: e.target.value })}
                    placeholder="タグIDを入力"
                  />
                </div>
              )}

              {(formData.content as ActionContent).type === "update_score" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>スコアフィールド</Label>
                    <Select
                      value={(formData.content as ActionContent).scoreField || "leadScore"}
                      onValueChange={(value) => updateActionContent({ scoreField: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leadScore">リードスコア</SelectItem>
                        <SelectItem value="engagementScore">エンゲージメント</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>値</Label>
                    <Input
                      type="number"
                      value={(formData.content as ActionContent).scoreValue || 0}
                      onChange={(e) =>
                        updateActionContent({ scoreValue: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              )}

              {(formData.content as ActionContent).type === "webhook" && (
                <div>
                  <Label>Webhook URL</Label>
                  <Input
                    value={(formData.content as ActionContent).webhookUrl || ""}
                    onChange={(e) => updateActionContent({ webhookUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}
            </div>
          )}

          {/* CONDITION 設定 */}
          {formData.type === "CONDITION" && (
            <div className="space-y-4">
              <div>
                <Label>条件フィールド</Label>
                <Select
                  value={(formData.content as ConditionContent).field || "score"}
                  onValueChange={(value) => {
                    const cur = formData.content as ConditionContent;
                    setFormData({
                      ...formData,
                      content: {
                        type: "condition",
                        field: value,
                        operator: cur.operator || "equals",
                        value: cur.value || "",
                      } as ConditionContent,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">スコア</SelectItem>
                    <SelectItem value="tags">タグ</SelectItem>
                    <SelectItem value="email">メールアドレス</SelectItem>
                    <SelectItem value="lineUserId">LINE ID</SelectItem>
                    <SelectItem value="customFields.company">会社名</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>演算子</Label>
                <Select
                  value={(formData.content as ConditionContent).operator || "equals"}
                  onValueChange={(value) => {
                    const cur = formData.content as ConditionContent;
                    setFormData({
                      ...formData,
                      content: {
                        type: "condition",
                        field: cur.field || "score",
                        operator: value as ConditionContent["operator"],
                        value: cur.value || "",
                      } as ConditionContent,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">等しい</SelectItem>
                    <SelectItem value="not_equals">等しくない</SelectItem>
                    <SelectItem value="contains">含む</SelectItem>
                    <SelectItem value="greater_than">より大きい</SelectItem>
                    <SelectItem value="less_than">より小さい</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>比較値</Label>
                <Input
                  value={String((formData.content as ConditionContent).value || "")}
                  onChange={(e) => {
                    const cur = formData.content as ConditionContent;
                    setFormData({
                      ...formData,
                      content: {
                        type: "condition",
                        field: cur.field || "score",
                        operator: cur.operator || "equals",
                        value: e.target.value,
                      } as ConditionContent,
                    });
                  }}
                  placeholder="比較する値を入力"
                />
              </div>

              {/* 分岐先選択 */}
              <div className="pt-4 border-t">
                <Label className="text-base font-semibold">分岐先の設定</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  条件の結果に応じて進むステップを選択します
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-green-600">✓ 条件が一致した場合</Label>
                    <Select
                      value={formData.trueBranchOrder?.toString() || "next"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          trueBranchOrder: value === "next" ? undefined : parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="次のステップへ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="next">次のステップへ</SelectItem>
                        {allSteps
                          .filter((s) => s.order !== step?.order)
                          .map((s) => (
                            <SelectItem key={s.order} value={s.order.toString()}>
                              ステップ {s.order}: {s.type}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-red-600">✗ 条件が一致しない場合</Label>
                    <Select
                      value={formData.falseBranchOrder?.toString() || "next"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          falseBranchOrder: value === "next" ? undefined : parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="次のステップへ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="next">次のステップへ</SelectItem>
                        {allSteps
                          .filter((s) => s.order !== step?.order)
                          .map((s) => (
                            <SelectItem key={s.order} value={s.order.toString()}>
                              ステップ {s.order}: {s.type}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
