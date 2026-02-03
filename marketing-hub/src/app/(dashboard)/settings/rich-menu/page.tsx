"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  RefreshCw,
  MoreHorizontal,
  Star,
  Trash2,
  Edit,
  Image as ImageIcon,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/use-tenant";
import { RichMenuEditor } from "@/components/line/rich-menu-editor";

interface RichMenuArea {
  bounds: { x: number; y: number; width: number; height: number };
  action: { type: string; data?: string; uri?: string; text?: string };
}

interface ConditionRule {
  field: string;
  operator: string;
  value: string | number;
}

interface RichMenu {
  id: string;
  name: string;
  lineRichMenuId: string | null;
  size: { width: number; height: number };
  areas: RichMenuArea[];
  imageUrl: string | null;
  chatBarText: string;
  conditions: ConditionRule[] | null;
  isDefault: boolean;
  createdAt: string;
}

export default function RichMenuPage() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [richMenus, setRichMenus] = useState<RichMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingMenu, setEditingMenu] = useState<RichMenu | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchRichMenus();
    }
  }, [tenantId]);

  const fetchRichMenus = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/line/rich-menu?tenantId=${tenantId}`);
      const data = await res.json();
      setRichMenus(data.richMenus || []);
    } catch (error) {
      console.error("Failed to fetch rich menus:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: Partial<RichMenu>) => {
    if (!tenantId) return;

    try {
      const res = await fetch("/api/line/rich-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          name: data.name,
          size: data.size,
          chatBarText: data.chatBarText,
          isDefault: data.isDefault,
          conditions: data.conditions,
          areas: [], // 初期は空
        }),
      });

      if (res.ok) {
        fetchRichMenus();
        setShowEditor(false);
      } else {
        const error = await res.json();
        alert(error.error || "作成に失敗しました");
      }
    } catch (error) {
      console.error("Failed to create rich menu:", error);
    }
  };

  const handleUpdate = async (data: Partial<RichMenu>) => {
    if (!editingMenu) return;

    try {
      const res = await fetch("/api/line/rich-menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingMenu.id,
          ...data,
        }),
      });

      if (res.ok) {
        fetchRichMenus();
        setEditingMenu(null);
      } else {
        const error = await res.json();
        alert(error.error || "更新に失敗しました");
      }
    } catch (error) {
      console.error("Failed to update rich menu:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このリッチメニューを削除しますか？")) return;

    try {
      const res = await fetch(`/api/line/rich-menu?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchRichMenus();
      } else {
        const error = await res.json();
        alert(error.error || "削除に失敗しました");
      }
    } catch (error) {
      console.error("Failed to delete rich menu:", error);
    }
  };

  const handleSetDefault = async (menu: RichMenu) => {
    try {
      const res = await fetch("/api/line/rich-menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: menu.id,
          isDefault: true,
        }),
      });

      if (res.ok) {
        fetchRichMenus();
      }
    } catch (error) {
      console.error("Failed to set default:", error);
    }
  };

  const getSizeLabel = (size: { width: number; height: number }) => {
    if (size.width === 2500 && size.height === 1686) return "フル";
    if (size.width === 2500 && size.height === 843) return "ハーフ";
    if (size.width === 1200 && size.height === 810) return "コンパクト";
    if (size.width === 1200 && size.height === 405) return "コンパクトハーフ";
    return `${size.width}x${size.height}`;
  };

  if (tenantLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">リッチメニュー管理</h1>
          <p className="text-muted-foreground">
            LINEのリッチメニューを管理します
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRichMenus}>
            <RefreshCw className="mr-2 h-4 w-4" />
            更新
          </Button>
          <Button onClick={() => setShowEditor(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">登録メニュー</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{richMenus.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LINE同期済み</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {richMenus.filter((m) => m.lineRichMenuId).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">条件付きメニュー</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {richMenus.filter((m) => m.conditions).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* メニュー一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>リッチメニュー一覧</CardTitle>
          <CardDescription>
            条件付きメニューは上から順に評価され、最初に一致したメニューが表示されます
          </CardDescription>
        </CardHeader>
        <CardContent>
          {richMenus.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                リッチメニューがありません
              </p>
              <Button onClick={() => setShowEditor(true)}>
                <Plus className="mr-2 h-4 w-4" />
                最初のメニューを作成
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>メニュー名</TableHead>
                  <TableHead>サイズ</TableHead>
                  <TableHead>チャットバー</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>条件</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {richMenus.map((menu) => (
                  <TableRow key={menu.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {menu.isDefault && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <span className="font-medium">{menu.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getSizeLabel(menu.size)}</Badge>
                    </TableCell>
                    <TableCell>{menu.chatBarText}</TableCell>
                    <TableCell>
                      {menu.lineRichMenuId ? (
                        <Badge variant="default">
                          {menu.imageUrl ? "画像設定済み" : "同期済み"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">未同期</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {menu.conditions ? (
                        <Badge variant="outline">条件あり</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingMenu(menu)}>
                            <Edit className="mr-2 h-4 w-4" />
                            編集
                          </DropdownMenuItem>
                          {!menu.isDefault && (
                            <DropdownMenuItem onClick={() => handleSetDefault(menu)}>
                              <Star className="mr-2 h-4 w-4" />
                              デフォルトに設定
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(menu.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 使い方ガイド */}
      <Card>
        <CardHeader>
          <CardTitle>使い方</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. 「新規作成」でリッチメニューを作成します（サイズと名前を設定）</p>
          <p>2. 作成後、編集画面から画像をアップロードします</p>
          <p>3. 条件を設定すると、特定のセグメントにのみメニューが表示されます</p>
          <p>4. デフォルトメニューは、条件に一致しないユーザーに表示されます</p>
        </CardContent>
      </Card>

      {/* 新規作成モーダル */}
      <RichMenuEditor
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={handleCreate}
      />

      {/* 編集モーダル */}
      {editingMenu && (
        <RichMenuEditor
          richMenu={editingMenu}
          isOpen={!!editingMenu}
          onClose={() => setEditingMenu(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}
