"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Video,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  Archive,
  Edit,
  Trash2,
  Users,
  Clock,
  MessageSquare,
  Gift,
} from "lucide-react";

interface AutoWebinar {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  videoDuration: number;
  scheduleType: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  _count: {
    chatMessages: number;
    timedOffers: number;
    registrations: number;
    sessions: number;
  };
}

const STATUS_CONFIG = {
  DRAFT: { label: "下書き", variant: "secondary" as const },
  ACTIVE: { label: "公開中", variant: "default" as const },
  PAUSED: { label: "一時停止", variant: "outline" as const },
  ARCHIVED: { label: "アーカイブ", variant: "destructive" as const },
};

const SCHEDULE_TYPE_LABELS = {
  JUST_IN_TIME: "Just-In-Time",
  RECURRING: "定期開催",
  SPECIFIC_DATES: "特定日時",
  ON_DEMAND: "オンデマンド",
};

export function AutoWebinarList() {
  const [webinars, setWebinars] = useState<AutoWebinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchWebinars();
  }, []);

  const fetchWebinars = async () => {
    try {
      const res = await fetch("/api/auto-webinars");
      const data = await res.json();
      setWebinars(data.webinars || []);
    } catch (error) {
      console.error("Failed to fetch webinars:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/auto-webinars/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchWebinars();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const deleteWebinar = async (id: string) => {
    if (!confirm("このウェビナーを削除しますか？")) return;
    try {
      await fetch(`/api/auto-webinars/${id}`, { method: "DELETE" });
      fetchWebinars();
    } catch (error) {
      console.error("Failed to delete webinar:", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}時間${m}分`;
    return `${m}分`;
  };

  const filteredWebinars = webinars.filter((w) => {
    if (activeTab === "all") return true;
    return w.status === activeTab.toUpperCase();
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">オートウェビナー</h1>
          <p className="text-muted-foreground">
            EverWebinar型の擬似ライブウェビナーを管理
          </p>
        </div>
        <Link href="/auto-webinar/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新規作成
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">すべて ({webinars.length})</TabsTrigger>
          <TabsTrigger value="active">
            公開中 ({webinars.filter((w) => w.status === "ACTIVE").length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            下書き ({webinars.filter((w) => w.status === "DRAFT").length})
          </TabsTrigger>
          <TabsTrigger value="paused">
            一時停止 ({webinars.filter((w) => w.status === "PAUSED").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredWebinars.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  オートウェビナーがありません
                </h3>
                <p className="text-muted-foreground mb-4">
                  録画済み動画を擬似ライブとして配信できます
                </p>
                <Link href="/auto-webinar/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    最初のウェビナーを作成
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>タイトル</TableHead>
                    <TableHead>スケジュール</TableHead>
                    <TableHead className="text-center">登録者</TableHead>
                    <TableHead className="text-center">視聴</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWebinars.map((webinar) => (
                    <TableRow key={webinar.id}>
                      <TableCell>
                        <Link
                          href={`/auto-webinar/${webinar.id}`}
                          className="hover:underline"
                        >
                          <div className="font-medium">{webinar.title}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(webinar.videoDuration)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {webinar._count.chatMessages}
                            </span>
                            <span className="flex items-center gap-1">
                              <Gift className="w-3 h-3" />
                              {webinar._count.timedOffers}
                            </span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {SCHEDULE_TYPE_LABELS[webinar.scheduleType as keyof typeof SCHEDULE_TYPE_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {webinar._count.registrations}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {webinar._count.sessions}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_CONFIG[webinar.status].variant}>
                          {STATUS_CONFIG[webinar.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/auto-webinar/${webinar.id}`}>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                編集
                              </DropdownMenuItem>
                            </Link>
                            {webinar.status === "DRAFT" && (
                              <DropdownMenuItem
                                onClick={() => updateStatus(webinar.id, "ACTIVE")}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                公開する
                              </DropdownMenuItem>
                            )}
                            {webinar.status === "ACTIVE" && (
                              <DropdownMenuItem
                                onClick={() => updateStatus(webinar.id, "PAUSED")}
                              >
                                <Pause className="w-4 h-4 mr-2" />
                                一時停止
                              </DropdownMenuItem>
                            )}
                            {webinar.status === "PAUSED" && (
                              <DropdownMenuItem
                                onClick={() => updateStatus(webinar.id, "ACTIVE")}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                再開
                              </DropdownMenuItem>
                            )}
                            {webinar.status !== "ARCHIVED" && (
                              <DropdownMenuItem
                                onClick={() => updateStatus(webinar.id, "ARCHIVED")}
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                アーカイブ
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => deleteWebinar(webinar.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
