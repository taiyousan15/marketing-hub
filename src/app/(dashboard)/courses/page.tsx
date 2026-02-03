"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Copy,
  Trash2,
  Users,
  PlayCircle,
  GraduationCap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const sampleCourses = [
  {
    id: "1",
    name: "マーケティング入門コース",
    description: "マーケティングの基礎を学ぶ初心者向けコース",
    thumbnail: null,
    lessonCount: 12,
    enrollmentCount: 156,
    isPublished: true,
    createdAt: "2025-01-10",
  },
  {
    id: "2",
    name: "LINE配信マスター講座",
    description: "効果的なLINE配信の方法を徹底解説",
    thumbnail: null,
    lessonCount: 8,
    enrollmentCount: 89,
    isPublished: true,
    createdAt: "2025-01-15",
  },
  {
    id: "3",
    name: "セールスファネル構築講座",
    description: "売れるファネルの作り方を学ぶ",
    thumbnail: null,
    lessonCount: 15,
    enrollmentCount: 0,
    isPublished: false,
    createdAt: "2025-01-25",
  },
];

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = sampleCourses.filter((course) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEnrollments = sampleCourses.reduce((sum, c) => sum + c.enrollmentCount, 0);
  const publishedCourses = sampleCourses.filter((c) => c.isPublished).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">会員サイト・コース</h1>
          <p className="text-muted-foreground">
            オンラインコースを作成・管理します
          </p>
        </div>
        <Button asChild>
          <Link href="/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            新規コース作成
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">公開中コース</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総受講者数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総レッスン数</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sampleCourses.reduce((sum, c) => sum + c.lessonCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="コース名で検索..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                コースが見つかりません
              </div>
            ) : (
              filteredCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <GraduationCap className="h-12 w-12 text-primary/50" />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base line-clamp-1">{course.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={"/courses/" + course.id}>
                              <Edit className="mr-2 h-4 w-4" />
                              編集
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            プレビュー
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            複製
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <PlayCircle className="h-4 w-4" />
                          <span>{course.lessonCount}レッスン</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{course.enrollmentCount}人</span>
                        </div>
                      </div>
                      <Badge variant={course.isPublished ? "default" : "secondary"}>
                        {course.isPublished ? "公開中" : "下書き"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
