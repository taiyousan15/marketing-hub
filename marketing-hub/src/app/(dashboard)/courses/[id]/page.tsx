"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Settings, List, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CourseSettings } from "@/components/courses/course-settings";
import { LessonList } from "@/components/courses/lesson-list";
import { MemberRank, CourseAccessMode } from "@prisma/client";

interface Lesson {
  id: string;
  name: string;
  description: string | null;
  order: number;
  duration: number | null;
  isPublished: boolean;
  requiredRank: MemberRank;
  isSequentialStart: boolean;
  requireCompletion: boolean;
}

interface Course {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  isPublished: boolean;
  accessMode: CourseAccessMode;
  isPublicCourse: boolean;
  shareCode: string | null;
  lessons: Lesson[];
  _count: {
    lessons: number;
    enrollments: number;
  };
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    thumbnail: "",
    isPublished: false,
  });

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCourse(data.course);
      setFormData({
        name: data.course.name,
        description: data.course.description || "",
        thumbnail: data.course.thumbnail || "",
        isPublished: data.course.isPublished,
      });
    } catch (error) {
      toast.error("コースの取得に失敗しました");
      router.push("/courses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setCourse(data.course);
      toast.success("保存しました");
    } catch (error) {
      toast.error("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingsUpdate = async (data: {
    accessMode?: CourseAccessMode;
    isPublicCourse?: boolean;
    regenerateCode?: boolean;
  }) => {
    const res = await fetch(`/api/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update");
    const result = await res.json();
    setCourse(result.course);
  };

  const handleLessonReorder = async (lessonId: string, newOrder: number) => {
    if (!course) return;

    const lessonOrders = course.lessons.map((l) => {
      if (l.id === lessonId) {
        return { lessonId: l.id, order: newOrder };
      }
      if (l.order >= newOrder) {
        return { lessonId: l.id, order: l.order + 1 };
      }
      return { lessonId: l.id, order: l.order };
    });

    const res = await fetch(`/api/courses/${id}/lessons`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonOrders }),
    });

    if (!res.ok) throw new Error("Failed to reorder");
    const data = await res.json();
    setCourse({ ...course, lessons: data.lessons });
  };

  const handleLessonDelete = async (lessonId: string) => {
    const res = await fetch(`/api/courses/${id}/lessons/${lessonId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete");
    await fetchCourse();
  };

  const handleLessonTogglePublish = async (
    lessonId: string,
    isPublished: boolean
  ) => {
    const res = await fetch(`/api/courses/${id}/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished }),
    });
    if (!res.ok) throw new Error("Failed to update");
    await fetchCourse();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/courses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
            <p className="text-muted-foreground">
              {course._count.lessons}レッスン · {course._count.enrollments}
              人受講中
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/courses/${id}/enrollments`}>
              <Users className="mr-2 h-4 w-4" />
              受講者管理
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="lessons">
            <List className="mr-2 h-4 w-4" />
            レッスン
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            アクセス設定
          </TabsTrigger>
        </TabsList>

        {/* 基本情報タブ */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">コース名</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">サムネイル URL</Label>
                <Input
                  id="thumbnail"
                  value={formData.thumbnail}
                  onChange={(e) =>
                    setFormData({ ...formData, thumbnail: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label>コースを公開</Label>
                  <p className="text-sm text-muted-foreground">
                    公開すると受講者がコースを閲覧できます
                  </p>
                </div>
                <Switch
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPublished: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* レッスンタブ */}
        <TabsContent value="lessons">
          <LessonList
            lessons={course.lessons}
            onReorder={handleLessonReorder}
            onEdit={(lessonId) =>
              router.push(`/courses/${id}/lessons/${lessonId}`)
            }
            onDelete={handleLessonDelete}
            onTogglePublish={handleLessonTogglePublish}
            onAdd={() => router.push(`/courses/${id}/lessons/new`)}
          />
        </TabsContent>

        {/* アクセス設定タブ */}
        <TabsContent value="settings">
          <CourseSettings
            course={{
              id: course.id,
              accessMode: course.accessMode,
              isPublicCourse: course.isPublicCourse,
              shareCode: course.shareCode,
            }}
            baseUrl={baseUrl}
            onUpdate={handleSettingsUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
