"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { EnrollmentTable } from "@/components/courses/enrollment-table";
import { getRankOptions } from "@/components/courses/rank-badge";
import { MemberRank } from "@prisma/client";

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

export default function EnrollmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEnrollment, setNewEnrollment] = useState({
    contactId: "",
    memberRank: "BRONZE" as MemberRank,
  });
  const [isAdding, setIsAdding] = useState(false);

  const rankOptions = getRankOptions();

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      const [courseRes, enrollmentsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/courses/${courseId}/enrollments`),
      ]);

      if (!courseRes.ok || !enrollmentsRes.ok) {
        throw new Error("Failed to fetch");
      }

      const courseData = await courseRes.json();
      const enrollmentsData = await enrollmentsRes.json();

      setCourseName(courseData.course.name);
      setEnrollments(enrollmentsData.enrollments);
    } catch (error) {
      toast.error("データの取得に失敗しました");
      router.push("/courses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRank = async (contactId: string, memberRank: MemberRank) => {
    const res = await fetch(`/api/courses/${courseId}/enrollments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, memberRank }),
    });

    if (!res.ok) throw new Error("Failed to update");
    await fetchData();
  };

  const handleRemove = async (contactId: string) => {
    const res = await fetch(
      `/api/courses/${courseId}/enrollments?contactId=${contactId}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) throw new Error("Failed to delete");
    setEnrollments(enrollments.filter((e) => e.contact.id !== contactId));
  };

  const handleAddEnrollment = async () => {
    if (!newEnrollment.contactId.trim()) {
      toast.error("コンタクトIDを入力してください");
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEnrollment),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add");
      }

      toast.success("受講者を追加しました");
      setIsDialogOpen(false);
      setNewEnrollment({ contactId: "", memberRank: "BRONZE" });
      await fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "追加に失敗しました"
      );
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/courses/${courseId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">受講者管理</h1>
            <p className="text-muted-foreground">{courseName}</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              受講者を追加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>受講者を追加</DialogTitle>
              <DialogDescription>
                コンタクトIDを入力して受講者を追加します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="contactId">コンタクトID</Label>
                <Input
                  id="contactId"
                  value={newEnrollment.contactId}
                  onChange={(e) =>
                    setNewEnrollment({
                      ...newEnrollment,
                      contactId: e.target.value,
                    })
                  }
                  placeholder="コンタクトIDを入力"
                />
              </div>

              <div className="space-y-2">
                <Label>ランク</Label>
                <Select
                  value={newEnrollment.memberRank}
                  onValueChange={(value) =>
                    setNewEnrollment({
                      ...newEnrollment,
                      memberRank: value as MemberRank,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  キャンセル
                </Button>
                <Button onClick={handleAddEnrollment} disabled={isAdding}>
                  {isAdding ? "追加中..." : "追加"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>受講者一覧</CardTitle>
          <CardDescription>
            {enrollments.length}人の受講者が登録されています
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnrollmentTable
            enrollments={enrollments}
            onUpdateRank={handleUpdateRank}
            onRemove={handleRemove}
          />
        </CardContent>
      </Card>
    </div>
  );
}
