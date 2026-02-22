"use client";

import { useState, useTransition } from "react";
import { LifecycleStage } from "@prisma/client";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { updateLifecycleStage } from "@/actions/contacts";
import { LIFECYCLE_STAGES } from "@/lib/contacts/constants";

interface LifecycleStageSelectorProps {
  contactId: string;
  currentStage: LifecycleStage;
}

export function LifecycleStageSelector({
  contactId,
  currentStage,
}: LifecycleStageSelectorProps) {
  const [stage, setStage] = useState<LifecycleStage>(currentStage);
  const [isPending, startTransition] = useTransition();

  const stageInfo = LIFECYCLE_STAGES.find((s) => s.value === stage);

  const handleSelect = (newStage: LifecycleStage) => {
    startTransition(async () => {
      try {
        await updateLifecycleStage(contactId, newStage);
        setStage(newStage);
        toast.success("ステージを更新しました");
      } catch {
        toast.error("ステージの更新に失敗しました");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isPending}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-opacity ${stageInfo?.color} ${isPending ? "opacity-60" : "hover:opacity-80"}`}
        >
          {stageInfo?.label}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {LIFECYCLE_STAGES.map((s) => (
          <DropdownMenuItem
            key={s.value}
            onClick={() => handleSelect(s.value)}
            className={stage === s.value ? "font-semibold" : ""}
          >
            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium mr-2 ${s.color}`}>
              {s.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
