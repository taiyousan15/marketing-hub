"use client";

import {
  MessageSquare,
  Clock,
  GitBranch,
  Zap,
  MoreHorizontal,
  Trash2,
  Edit,
  GripVertical,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CampaignStep, StepType, MessageContent, ActionContent } from "@/types/campaign";

interface StepCardProps {
  step: CampaignStep;
  index: number;
  isLine: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
}

const stepTypeConfig: Record<StepType, { icon: typeof MessageSquare; label: string; color: string }> = {
  MESSAGE: { icon: MessageSquare, label: "メッセージ", color: "bg-blue-100 text-blue-700" },
  WAIT: { icon: Clock, label: "待機", color: "bg-yellow-100 text-yellow-700" },
  CONDITION: { icon: GitBranch, label: "条件分岐", color: "bg-purple-100 text-purple-700" },
  ACTION: { icon: Zap, label: "アクション", color: "bg-green-100 text-green-700" },
};

export function StepCard({ step, index, isLine, onEdit, onDelete, isDragging }: StepCardProps) {
  const config = stepTypeConfig[step.type as StepType];
  const Icon = config?.icon || MessageSquare;

  const getDelayText = () => {
    const parts: string[] = [];
    if (step.delayDays > 0) parts.push(`${step.delayDays}日`);
    if (step.delayHours > 0) parts.push(`${step.delayHours}時間`);
    if (step.delayMinutes > 0) parts.push(`${step.delayMinutes}分`);
    if (parts.length === 0) return "即時";
    return parts.join(" ");
  };

  const getContentPreview = () => {
    if (step.type === "MESSAGE") {
      const content = step.content as MessageContent;
      if (content.text) {
        return content.text.length > 50 ? content.text.slice(0, 50) + "..." : content.text;
      }
      if (content.type === "flex") return "Flexメッセージ";
      if (content.type === "image") return "画像";
      if (content.type === "video") return "動画";
    }
    if (step.type === "ACTION") {
      const content = step.content as ActionContent;
      switch (content.type) {
        case "add_tag": return "タグを追加";
        case "remove_tag": return "タグを削除";
        case "update_score": return "スコアを更新";
        case "start_campaign": return "別のキャンペーンを開始";
        case "webhook": return "Webhook送信";
        default: return "アクション";
      }
    }
    if (step.type === "WAIT") {
      return `${getDelayText()}後に次のステップへ`;
    }
    if (step.type === "CONDITION") {
      return "条件に基づいて分岐";
    }
    return "";
  };

  return (
    <Card className={`relative ${isDragging ? "opacity-50" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* ドラッグハンドル */}
          <div className="cursor-grab text-muted-foreground hover:text-foreground">
            <GripVertical className="h-5 w-5" />
          </div>

          {/* ステップ番号 */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            {index + 1}
          </div>

          {/* アイコン */}
          <div className={`flex-shrink-0 p-2 rounded-lg ${config?.color || "bg-gray-100"}`}>
            {isLine ? (
              <Icon className="h-5 w-5" />
            ) : (
              <Mail className="h-5 w-5" />
            )}
          </div>

          {/* コンテンツ */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{config?.label || step.type}</span>
              {step.sendTime && (
                <Badge variant="outline" className="text-xs">
                  {step.sendTime}に送信
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {getContentPreview()}
            </p>
            {step.type !== "WAIT" && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <Clock className="h-3 w-3" />
                {getDelayText()}後
              </div>
            )}
          </div>

          {/* アクションメニュー */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                編集
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
