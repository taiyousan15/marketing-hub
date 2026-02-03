"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Users, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const sampleTags = [
  { id: "1", name: "購入者", color: "#22c55e", contactCount: 45 },
  { id: "2", name: "VIP", color: "#eab308", contactCount: 12 },
  { id: "3", name: "見込み客", color: "#3b82f6", contactCount: 234 },
  { id: "4", name: "セミナー参加者", color: "#8b5cf6", contactCount: 89 },
  { id: "5", name: "メルマガ登録", color: "#ec4899", contactCount: 567 },
  { id: "6", name: "休眠", color: "#6b7280", contactCount: 123 },
];

const colorOptions = [
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#6b7280",
];

export default function TagsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(colorOptions[0]);

  const handleCreateTag = () => {
    console.log("Creating tag:", { name: newTagName, color: newTagColor });
    setIsCreateOpen(false);
    setNewTagName("");
    setNewTagColor(colorOptions[0]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">タグ管理</h1>
          <p className="text-muted-foreground">
            コンタクトを分類・整理するためのタグを管理します
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規タグ作成
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規タグ作成</DialogTitle>
              <DialogDescription>
                コンタクトを分類するための新しいタグを作成します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">タグ名</Label>
                <Input
                  id="name"
                  placeholder="例: VIP顧客"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>カラー</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={"h-8 w-8 rounded-full border-2 " +
                        (newTagColor === color
                          ? "border-gray-900 dark:border-gray-100"
                          : "border-transparent")}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>プレビュー</Label>
                <Badge style={{ backgroundColor: newTagColor, color: "#fff" }}>
                  {newTagName || "タグ名"}
                </Badge>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
                作成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>タグ一覧</CardTitle>
          <CardDescription>
            全{sampleTags.length}件のタグ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sampleTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <div>
                    <p className="font-medium">{tag.name}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{tag.contactCount}件</span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Pencil className="mr-2 h-4 w-4" />
                      編集
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="mr-2 h-4 w-4" />
                      コンタクトを表示
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
