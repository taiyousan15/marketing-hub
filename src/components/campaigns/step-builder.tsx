"use client";

import { useState } from "react";
import { Plus, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StepCard } from "./step-card";
import { StepEditor } from "./step-editor";
import type { CampaignStep, StepFormData } from "@/types/campaign";

interface StepBuilderProps {
  campaignId: string;
  steps: CampaignStep[];
  isLine: boolean;
  onAddStep: (data: StepFormData) => Promise<void>;
  onUpdateStep: (stepId: string, data: StepFormData) => Promise<void>;
  onDeleteStep: (stepId: string) => Promise<void>;
  onReorderSteps: (steps: { id: string; order: number }[]) => Promise<void>;
}

export function StepBuilder({
  campaignId,
  steps,
  isLine,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onReorderSteps,
}: StepBuilderProps) {
  const [editingStep, setEditingStep] = useState<CampaignStep | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  const handleSaveNewStep = async (data: StepFormData) => {
    await onAddStep(data);
    setIsAddingStep(false);
  };

  const handleUpdateStep = async (data: StepFormData) => {
    if (editingStep) {
      await onUpdateStep(editingStep.id, data);
      setEditingStep(null);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (confirm("このステップを削除しますか？")) {
      await onDeleteStep(stepId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>ステップ配信</CardTitle>
            <CardDescription>
              順番にメッセージを自動送信します
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddingStep(true)}>
            <Plus className="mr-2 h-4 w-4" />
            ステップ追加
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sortedSteps.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">
              ステップがありません。最初のステップを追加してください。
            </p>
            <Button onClick={() => setIsAddingStep(true)}>
              <Plus className="mr-2 h-4 w-4" />
              最初のステップを追加
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSteps.map((step, index) => (
              <div key={step.id}>
                <StepCard
                  step={step}
                  index={index}
                  isLine={isLine}
                  onEdit={() => setEditingStep(step)}
                  onDelete={() => handleDeleteStep(step.id)}
                />
                {index < sortedSteps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowDown className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* 末尾に追加ボタン */}
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={() => setIsAddingStep(true)}>
                <Plus className="mr-2 h-4 w-4" />
                ステップを追加
              </Button>
            </div>
          </div>
        )}

        {/* 新規ステップ追加モーダル */}
        <StepEditor
          isOpen={isAddingStep}
          onClose={() => setIsAddingStep(false)}
          onSave={handleSaveNewStep}
          isLine={isLine}
        />

        {/* ステップ編集モーダル */}
        {editingStep && (
          <StepEditor
            step={editingStep}
            isOpen={!!editingStep}
            onClose={() => setEditingStep(null)}
            onSave={handleUpdateStep}
            isLine={isLine}
          />
        )}
      </CardContent>
    </Card>
  );
}
