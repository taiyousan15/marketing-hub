"use client";

import { useState } from "react";
import { MemberRank } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RankBadge, getRankOptions } from "./rank-badge";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Enrollment {
  id: string;
  memberRank: MemberRank;
  enrolledAt: string;
  expiresAt: string | null;
  contact: {
    id: string;
    name: string | null;
    email: string | null;
    lineUserId: string | null;
  };
  progress: {
    completedLessons: number;
    totalLessons: number;
    progress: number;
  };
}

interface EnrollmentTableProps {
  enrollments: Enrollment[];
  onUpdateRank: (contactId: string, rank: MemberRank) => Promise<void>;
  onRemove: (contactId: string) => Promise<void>;
}

export function EnrollmentTable({
  enrollments,
  onUpdateRank,
  onRemove,
}: EnrollmentTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const rankOptions = getRankOptions();

  const handleRankChange = async (contactId: string, newRank: MemberRank) => {
    setLoadingId(contactId);
    try {
      await onUpdateRank(contactId, newRank);
      toast.success("ランクを更新しました");
    } catch (error) {
      toast.error("更新に失敗しました");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (contactId: string, contactName: string) => {
    if (!confirm(`${contactName || "この受講者"}を削除してもよろしいですか？`)) {
      return;
    }

    setLoadingId(contactId);
    try {
      await onRemove(contactId);
      toast.success("受講者を削除しました");
    } catch (error) {
      toast.error("削除に失敗しました");
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        受講者がいません
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>受講者</TableHead>
          <TableHead>ランク</TableHead>
          <TableHead>進捗</TableHead>
          <TableHead>登録日</TableHead>
          <TableHead>有効期限</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {enrollments.map((enrollment) => (
          <TableRow key={enrollment.id}>
            <TableCell>
              <div>
                <div className="font-medium">
                  {enrollment.contact.name || "名前なし"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {enrollment.contact.email || enrollment.contact.lineUserId}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Select
                value={enrollment.memberRank}
                onValueChange={(value) =>
                  handleRankChange(enrollment.contact.id, value as MemberRank)
                }
                disabled={loadingId === enrollment.contact.id}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue>
                    <RankBadge rank={enrollment.memberRank} size="sm" />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {rankOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Progress
                    value={enrollment.progress.progress}
                    className="h-2 w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    {enrollment.progress.progress}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {enrollment.progress.completedLessons} /{" "}
                  {enrollment.progress.totalLessons} レッスン完了
                </div>
              </div>
            </TableCell>
            <TableCell className="text-sm">
              {formatDate(enrollment.enrolledAt)}
            </TableCell>
            <TableCell className="text-sm">
              {enrollment.expiresAt ? formatDate(enrollment.expiresAt) : "-"}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  handleRemove(
                    enrollment.contact.id,
                    enrollment.contact.name || ""
                  )
                }
                disabled={loadingId === enrollment.contact.id}
              >
                {loadingId === enrollment.contact.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
