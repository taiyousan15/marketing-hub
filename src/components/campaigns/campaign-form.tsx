"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Campaign, CampaignType, CampaignFormData } from "@/types/campaign";

const LIFECYCLE_STAGE_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "SUBSCRIBER", label: "購読者", color: "text-gray-700" },
  { value: "LEAD", label: "リード", color: "text-blue-700" },
  { value: "MQL", label: "MQL", color: "text-indigo-700" },
  { value: "SQL", label: "SQL", color: "text-violet-700" },
  { value: "OPPORTUNITY", label: "商談中", color: "text-amber-700" },
  { value: "CUSTOMER", label: "顧客", color: "text-green-700" },
  { value: "EVANGELIST", label: "推薦者", color: "text-rose-700" },
];

interface CampaignFormProps {
  campaign?: Campaign;
  onSubmit: (data: CampaignFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const campaignTypes: { value: CampaignType; label: string; description: string }[] = [
  { value: "LINE_STEP", label: "LINEステップ配信", description: "時間差で複数のメッセージを自動送信" },
  { value: "LINE_BROADCAST", label: "LINE一斉配信", description: "全員または特定セグメントに一斉送信" },
  { value: "EMAIL_STEP", label: "メールステップ配信", description: "メールでステップ配信" },
  { value: "EMAIL_BROADCAST", label: "メール一斉配信", description: "メールで一斉配信" },
];

export function CampaignForm({ campaign, onSubmit, onCancel, isSubmitting }: CampaignFormProps) {
  const campaignSettings = (campaign?.settings || {}) as Record<string, unknown>;
  const [formData, setFormData] = useState<CampaignFormData>({
    name: campaign?.name || "",
    type: campaign?.type || "LINE_STEP",
    segmentId: campaign?.segmentId || undefined,
    useOptimalSendTime: campaign?.useOptimalSendTime || false,
    minScoreThreshold: campaign?.minScoreThreshold || undefined,
    targetLifecycleStages: (campaignSettings.targetLifecycleStages as string[] | undefined) || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const isStepType = formData.type.includes("STEP");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>基本設定</CardTitle>
          <CardDescription>キャンペーンの基本情報を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">キャンペーン名</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例: 新規登録者向けステップメール"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">配信タイプ</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as CampaignType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="配信タイプを選択" />
              </SelectTrigger>
              <SelectContent>
                {campaignTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>送信対象フィルター</CardTitle>
          <CardDescription>
            配信するコンタクトのライフサイクルステージを絞り込めます（未選択の場合はすべてを対象）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {LIFECYCLE_STAGE_OPTIONS.map((stage) => {
              const isChecked = (formData.targetLifecycleStages || []).includes(stage.value);
              return (
                <div key={stage.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`stage-${stage.value}`}
                    checked={isChecked}
                    onChange={(e) => {
                      const current = formData.targetLifecycleStages || [];
                      setFormData({
                        ...formData,
                        targetLifecycleStages: e.target.checked
                          ? [...current, stage.value]
                          : current.filter((s) => s !== stage.value),
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                  />
                  <Label
                    htmlFor={`stage-${stage.value}`}
                    className={`cursor-pointer ${stage.color}`}
                  >
                    {stage.label}
                  </Label>
                </div>
              );
            })}
          </div>
          {(formData.targetLifecycleStages || []).length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              選択中: {(formData.targetLifecycleStages || [])
                .map((s) => LIFECYCLE_STAGE_OPTIONS.find((o) => o.value === s)?.label)
                .join("、")}
            </p>
          )}
        </CardContent>
      </Card>

      {isStepType && (
        <Card>
          <CardHeader>
            <CardTitle>送信最適化</CardTitle>
            <CardDescription>AIを活用した送信タイミングの最適化設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>最適送信時間を使用</Label>
                <p className="text-sm text-muted-foreground">
                  各コンタクトの開封パターンに基づいて最適な時間に送信
                </p>
              </div>
              <Switch
                checked={formData.useOptimalSendTime}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, useOptimalSendTime: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minScoreThreshold">最低スコア閾値（任意）</Label>
              <Input
                id="minScoreThreshold"
                type="number"
                min={0}
                max={100}
                value={formData.minScoreThreshold || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minScoreThreshold: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="例: 50"
              />
              <p className="text-xs text-muted-foreground">
                指定した場合、このスコア以上のコンタクトのみに配信されます
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.name}>
          {isSubmitting ? "保存中..." : campaign ? "更新" : "作成"}
        </Button>
      </div>
    </form>
  );
}
