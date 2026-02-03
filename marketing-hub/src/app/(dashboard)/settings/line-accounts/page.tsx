"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  Users,
  ArrowUpDown,
  Info,
  FolderPlus,
  Folder,
  Pencil,
} from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LineProject {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  totalAccounts: number;
  activeAccounts: number;
  totalFriends: number;
  distributionSetting?: DistributionSetting;
}

interface LineAccount {
  id: string;
  name: string;
  channelId: string;
  projectId?: string;
  project?: {
    id: string;
    name: string;
    color: string;
  };
  botDisplayName?: string;
  botBasicId?: string;
  botPictureUrl?: string;
  isActive: boolean;
  isConnected: boolean;
  order: number;
  weight: number;
  maxFriends: number | null;
  currentFriends: number;
  lastTestedAt?: string;
}

interface DistributionSetting {
  isEnabled: boolean;
  distributionType: string;
  maxListsPerRotation: number;
  currentIndex: number;
  onLimitReached: string;
}

const PROJECT_COLORS = [
  "#6366f1", // インディゴ
  "#22c55e", // グリーン
  "#f59e0b", // アンバー
  "#ef4444", // レッド
  "#8b5cf6", // バイオレット
  "#06b6d4", // シアン
  "#ec4899", // ピンク
  "#84cc16", // ライム
];

export default function LineAccountsPage() {
  const [projects, setProjects] = useState<LineProject[]>([]);
  const [accounts, setAccounts] = useState<LineAccount[]>([]);
  const [selectedProject, setSelectedProject] = useState<LineProject | null>(null);
  const [setting, setSetting] = useState<DistributionSetting>({
    isEnabled: false,
    distributionType: "ROUND_ROBIN",
    maxListsPerRotation: 1,
    currentIndex: 0,
    onLimitReached: "NEXT_ACCOUNT",
  });

  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    color: "#6366f1",
  });

  const [newAccount, setNewAccount] = useState({
    name: "",
    channelId: "",
    channelSecret: "",
    accessToken: "",
  });

  const { tenantId, loading: tenantLoading } = useTenant();

  useEffect(() => {
    if (tenantId) {
      fetchProjects();
    }
  }, [tenantId]);

  useEffect(() => {
    if (selectedProject) {
      fetchAccounts(selectedProject.id);
    } else {
      fetchAllAccounts();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/line/projects?tenantId=${tenantId}`);
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchAllAccounts = async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/line/accounts?tenantId=${tenantId}`);
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async (projectId: string) => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/line/accounts?tenantId=${tenantId}&projectId=${projectId}`);
      const data = await res.json();
      setAccounts(data.accounts || []);
      if (data.distributionSetting) {
        setSetting(data.distributionSetting);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProject = async () => {
    if (!newProject.name || !tenantId) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/line/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          ...newProject,
        }),
      });

      if (res.ok) {
        setIsAddProjectDialogOpen(false);
        setNewProject({ name: "", description: "", color: "#6366f1" });
        fetchProjects();
      } else {
        const error = await res.json();
        alert(error.error || "追加に失敗しました");
      }
    } catch (error) {
      console.error("Failed to add project:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("このプロジェクトを削除しますか？紐付いているアカウントはプロジェクト未割り当てになります。")) {
      return;
    }

    try {
      await fetch(`/api/line/projects?id=${projectId}`, {
        method: "DELETE",
      });
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      fetchProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.name || !newAccount.channelId || !newAccount.channelSecret || !newAccount.accessToken || !tenantId) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/line/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          projectId: selectedProject?.id,
          ...newAccount,
        }),
      });

      if (res.ok) {
        setIsAddAccountDialogOpen(false);
        setNewAccount({ name: "", channelId: "", channelSecret: "", accessToken: "" });
        if (selectedProject) {
          fetchAccounts(selectedProject.id);
        } else {
          fetchAllAccounts();
        }
        fetchProjects();
      } else {
        const error = await res.json();
        alert(error.error || "追加に失敗しました");
      }
    } catch (error) {
      console.error("Failed to add account:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (accountId: string, isActive: boolean) => {
    try {
      await fetch("/api/line/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: accountId, isActive }),
      });
      if (selectedProject) {
        fetchAccounts(selectedProject.id);
      } else {
        fetchAllAccounts();
      }
    } catch (error) {
      console.error("Failed to update account:", error);
    }
  };

  const handleMoveAccountToProject = async (accountId: string, projectId: string | null) => {
    try {
      await fetch("/api/line/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: accountId, projectId }),
      });
      if (selectedProject) {
        fetchAccounts(selectedProject.id);
      } else {
        fetchAllAccounts();
      }
      fetchProjects();
    } catch (error) {
      console.error("Failed to move account:", error);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("このアカウントを削除しますか？紐付いているコンタクトは解除されます。")) {
      return;
    }

    try {
      await fetch(`/api/line/accounts?id=${accountId}`, {
        method: "DELETE",
      });
      if (selectedProject) {
        fetchAccounts(selectedProject.id);
      } else {
        fetchAllAccounts();
      }
      fetchProjects();
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  const handleSaveDistributionSetting = async () => {
    if (!selectedProject || !tenantId) return;

    setIsSaving(true);
    try {
      await fetch("/api/line/distribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          projectId: selectedProject.id,
          ...setting,
        }),
      });
    } catch (error) {
      console.error("Failed to save setting:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const totalFriends = accounts.reduce((sum, acc) => sum + acc.currentFriends, 0);

  if (tenantLoading) {
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
          <h1 className="text-2xl font-bold tracking-tight">LINEプロジェクト管理</h1>
          <p className="text-muted-foreground">
            プロジェクト別でLINE公式アカウントを管理・振り分け
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="mr-2 h-4 w-4" />
                プロジェクト作成
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規プロジェクト作成</DialogTitle>
                <DialogDescription>
                  LINE公式アカウントをグループ化するプロジェクトを作成
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>プロジェクト名</Label>
                  <Input
                    placeholder="例: キャンペーンA"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>説明（任意）</Label>
                  <Input
                    placeholder="プロジェクトの説明"
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({ ...newProject, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>識別色</Label>
                  <div className="flex gap-2 flex-wrap">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          newProject.color === color ? "border-primary" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewProject({ ...newProject, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddProjectDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddProject} disabled={isSaving}>
                  {isSaving ? "作成中..." : "作成"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddAccountDialogOpen} onOpenChange={setIsAddAccountDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                アカウント追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>LINE公式アカウント追加</DialogTitle>
                <DialogDescription>
                  LINE Developersからチャネル情報を入力してください
                  {selectedProject && (
                    <span className="block mt-1">
                      追加先: <Badge style={{ backgroundColor: selectedProject.color }}>{selectedProject.name}</Badge>
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>アカウント名（管理用）</Label>
                  <Input
                    placeholder="例: メインアカウント"
                    value={newAccount.name}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>チャネルID</Label>
                  <Input
                    placeholder="チャネルID"
                    value={newAccount.channelId}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, channelId: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>チャネルシークレット</Label>
                  <Input
                    type="password"
                    placeholder="チャネルシークレット"
                    value={newAccount.channelSecret}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, channelSecret: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>チャネルアクセストークン</Label>
                  <Input
                    type="password"
                    placeholder="チャネルアクセストークン"
                    value={newAccount.accessToken}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, accessToken: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddAccountDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddAccount} disabled={isSaving}>
                  {isSaving ? "追加中..." : "追加"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* プロジェクト一覧 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className={`cursor-pointer transition-all ${
            !selectedProject ? "ring-2 ring-primary" : "hover:shadow-md"
          }`}
          onClick={() => setSelectedProject(null)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Folder className="h-4 w-4" />
              すべてのアカウント
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">アカウント</p>
          </CardContent>
        </Card>

        {projects.map((project) => (
          <Card
            key={project.id}
            className={`cursor-pointer transition-all ${
              selectedProject?.id === project.id ? "ring-2 ring-primary" : "hover:shadow-md"
            }`}
            onClick={() => setSelectedProject(project)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Pencil className="mr-2 h-4 w-4" />
                      編集
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.totalAccounts}</div>
              <p className="text-xs text-muted-foreground">
                {project.totalFriends.toLocaleString()} 友だち
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 選択されたプロジェクトの振り分け設定 */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              振り分け設定
              <Badge style={{ backgroundColor: selectedProject.color }}>
                {selectedProject.name}
              </Badge>
            </CardTitle>
            <CardDescription>
              このプロジェクト内のアカウントへの振り分けルールを設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">振り分け機能を有効化</Label>
                <p className="text-sm text-muted-foreground">
                  プロジェクト内の複数アカウントへ自動振り分けを有効にします
                </p>
              </div>
              <Switch
                checked={setting.isEnabled}
                onCheckedChange={(checked) => {
                  setSetting({ ...setting, isEnabled: checked });
                }}
              />
            </div>

            {setting.isEnabled && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>振り分け方式</Label>
                    <Select
                      value={setting.distributionType}
                      onValueChange={(value) =>
                        setSetting({ ...setting, distributionType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROUND_ROBIN">
                          ラウンドロビン（順番に振り分け）
                        </SelectItem>
                        <SelectItem value="WEIGHTED">
                          重み付け（設定した比率で振り分け）
                        </SelectItem>
                        <SelectItem value="FILL_FIRST">
                          順次充填（1つが上限まで埋まったら次へ）
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>最大振り分けリスト数</Label>
                    <Select
                      value={String(setting.maxListsPerRotation)}
                      onValueChange={(value) =>
                        setSetting({ ...setting, maxListsPerRotation: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}リスト
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>上限到達時の動作</Label>
                  <Select
                    value={setting.onLimitReached}
                    onValueChange={(value) =>
                      setSetting({ ...setting, onLimitReached: value })
                    }
                  >
                    <SelectTrigger className="max-w-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEXT_ACCOUNT">
                        次のアカウントへ自動移行
                      </SelectItem>
                      <SelectItem value="STOP">
                        新規受付を停止
                      </SelectItem>
                      <SelectItem value="NOTIFY">
                        通知して続行
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSaveDistributionSetting} disabled={isSaving}>
                  {isSaving ? "保存中..." : "設定を保存"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* 統計 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedProject ? `${selectedProject.name}のアカウント数` : "登録アカウント数"}
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">
              有効: {accounts.filter((a) => a.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総友だち数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFriends.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {selectedProject ? selectedProject.name : "全プロジェクト"}合計
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">振り分けステータス</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedProject ? (
                setting.isEnabled ? (
                  <Badge className="bg-green-500">有効</Badge>
                ) : (
                  <Badge variant="secondary">無効</Badge>
                )
              ) : (
                <Badge variant="outline">プロジェクト選択</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedProject
                ? setting.distributionType === "ROUND_ROBIN"
                  ? "ラウンドロビン"
                  : setting.distributionType === "WEIGHTED"
                  ? "重み付け"
                  : "順次充填"
                : "プロジェクトを選択してください"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* アカウント一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>
            LINEアカウント一覧
            {selectedProject && (
              <Badge className="ml-2" style={{ backgroundColor: selectedProject.color }}>
                {selectedProject.name}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {selectedProject
              ? `${selectedProject.name}に所属するLINE公式アカウント`
              : "すべてのLINE公式アカウント（最大500アカウント）"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              読み込み中...
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <div className="font-medium">アカウントが登録されていません</div>
                <p className="text-sm text-muted-foreground">
                  「アカウント追加」ボタンからLINE公式アカウントを登録してください。
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">順序</TableHead>
                  <TableHead>アカウント名</TableHead>
                  {!selectedProject && <TableHead>プロジェクト</TableHead>}
                  <TableHead>Bot情報</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">友だち数</TableHead>
                  <TableHead className="text-right">上限</TableHead>
                  <TableHead>進捗</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => {
                  const progress = account.maxFriends
                    ? (account.currentFriends / account.maxFriends) * 100
                    : 0;
                  const isAtLimit =
                    account.maxFriends !== null &&
                    account.currentFriends >= account.maxFriends;

                  return (
                    <TableRow key={account.id}>
                      <TableCell>
                        <Badge variant="outline">{account.order}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {account.botPictureUrl ? (
                            <img
                              src={account.botPictureUrl}
                              alt={account.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <Users className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{account.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {account.channelId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {!selectedProject && (
                        <TableCell>
                          {account.project ? (
                            <Badge style={{ backgroundColor: account.project.color }}>
                              {account.project.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline">未割り当て</Badge>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="text-sm">
                          <div>{account.botDisplayName || "-"}</div>
                          <div className="text-xs text-muted-foreground">
                            {account.botBasicId || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {account.isConnected ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <Switch
                            checked={account.isActive}
                            onCheckedChange={(checked) =>
                              handleToggleActive(account.id, checked)
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {account.currentFriends.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.maxFriends?.toLocaleString() || "無制限"}
                      </TableCell>
                      <TableCell className="w-32">
                        {account.maxFriends ? (
                          <div className="space-y-1">
                            <Progress
                              value={progress}
                              className={isAtLimit ? "bg-red-100" : ""}
                            />
                            <div className="text-xs text-muted-foreground text-right">
                              {progress.toFixed(0)}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
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
                            <DropdownMenuItem>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              接続テスト
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              設定
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled>
                              <Folder className="mr-2 h-4 w-4" />
                              プロジェクト移動
                            </DropdownMenuItem>
                            {projects.map((project) => (
                              <DropdownMenuItem
                                key={project.id}
                                className="pl-8"
                                onClick={() => handleMoveAccountToProject(account.id, project.id)}
                              >
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: project.color }}
                                />
                                {project.name}
                              </DropdownMenuItem>
                            ))}
                            {account.projectId && (
                              <DropdownMenuItem
                                className="pl-8"
                                onClick={() => handleMoveAccountToProject(account.id, null)}
                              >
                                <XCircle className="h-3 w-3 mr-2" />
                                プロジェクト解除
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteAccount(account.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 振り分け図解 */}
      {selectedProject && setting.isEnabled && accounts.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>振り分けフロー</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="text-center p-4 border rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-sm font-medium">新規友だち</div>
              </div>
              <div className="text-2xl text-muted-foreground">→</div>
              <div className="text-center p-4 border rounded-lg bg-muted">
                <ArrowUpDown className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-sm font-medium">
                  {setting.distributionType === "ROUND_ROBIN"
                    ? "順番に振り分け"
                    : setting.distributionType === "WEIGHTED"
                    ? "重み付け振り分け"
                    : "順次充填"}
                </div>
              </div>
              <div className="text-2xl text-muted-foreground">→</div>
              <div className="flex gap-2">
                {accounts.slice(0, 3).map((acc) => (
                  <div
                    key={acc.id}
                    className="text-center p-3 border rounded-lg"
                    style={{ opacity: acc.isActive ? 1 : 0.5 }}
                  >
                    <div className="text-xs font-medium">{acc.name}</div>
                    <div className="text-lg font-bold">{acc.currentFriends}</div>
                  </div>
                ))}
                {accounts.length > 3 && (
                  <div className="text-center p-3 border rounded-lg border-dashed">
                    <div className="text-xs text-muted-foreground">
                      +{accounts.length - 3}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
