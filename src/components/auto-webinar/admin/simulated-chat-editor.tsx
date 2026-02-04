"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Upload,
  Wand2,
  MessageSquare,
  Clock,
  Edit,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ChatMessage {
  id: string;
  appearAtSeconds: number;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  messageType: "COMMENT" | "QUESTION" | "REACTION" | "TESTIMONIAL";
  order: number;
}

interface SimulatedChatEditorProps {
  webinarId: string;
  videoDuration: number;
  webinarTitle?: string;
  webinarDescription?: string;
}

const MESSAGE_TYPE_CONFIG = {
  COMMENT: { label: "コメント", color: "secondary" as const },
  QUESTION: { label: "質問", color: "default" as const },
  REACTION: { label: "リアクション", color: "outline" as const },
  TESTIMONIAL: { label: "感想", color: "default" as const },
};

export function SimulatedChatEditor({
  webinarId,
  videoDuration,
  webinarTitle = "",
  webinarDescription = "",
}: SimulatedChatEditorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiConfig, setAiConfig] = useState({
    count: 20,
    density: "medium" as "sparse" | "medium" | "dense",
    includeQuestions: true,
    includeTestimonials: true,
    topic: "",
    clearExisting: false,
  });
  const [newMessage, setNewMessage] = useState({
    appearAtSeconds: 0,
    senderName: "",
    content: "",
    messageType: "COMMENT" as const,
  });
  const [importContent, setImportContent] = useState("");
  const [importFormat, setImportFormat] = useState<"csv" | "json">("csv");

  useEffect(() => {
    fetchMessages();
  }, [webinarId]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/auto-webinars/${webinarId}/chat`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const addMessage = async () => {
    try {
      await fetch(`/api/auto-webinars/${webinarId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });
      setShowAddDialog(false);
      setNewMessage({
        appearAtSeconds: 0,
        senderName: "",
        content: "",
        messageType: "COMMENT",
      });
      fetchMessages();
    } catch (error) {
      console.error("Failed to add message:", error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await fetch(`/api/auto-webinars/${webinarId}/chat?messageId=${messageId}`, {
        method: "DELETE",
      });
      fetchMessages();
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const importMessages = async () => {
    try {
      await fetch(`/api/auto-webinars/${webinarId}/chat/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: importFormat,
          content: importContent,
          clearExisting: false,
        }),
      });
      setShowImportDialog(false);
      setImportContent("");
      fetchMessages();
    } catch (error) {
      console.error("Failed to import messages:", error);
    }
  };

  const generateTemplate = async () => {
    if (!confirm("テンプレートを生成しますか？既存のメッセージは保持されます。")) {
      return;
    }
    try {
      await fetch(`/api/auto-webinars/${webinarId}/chat/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generateTemplate: true,
          density: "medium",
          clearExisting: false,
        }),
      });
      fetchMessages();
    } catch (error) {
      console.error("Failed to generate template:", error);
    }
  };

  const generateWithAI = async () => {
    setAiGenerating(true);
    setAiError(null);

    try {
      // AI生成APIを呼び出し
      const res = await fetch("/api/ai/generate-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: webinarTitle || "ウェビナー",
          description: webinarDescription,
          videoDuration,
          topic: aiConfig.topic,
          count: aiConfig.count,
          density: aiConfig.density,
          includeQuestions: aiConfig.includeQuestions,
          includeTestimonials: aiConfig.includeTestimonials,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "生成に失敗しました");
      }

      // 既存メッセージをクリアする場合
      if (aiConfig.clearExisting && messages.length > 0) {
        // 既存メッセージを削除
        for (const msg of messages) {
          await fetch(`/api/auto-webinars/${webinarId}/chat?messageId=${msg.id}`, {
            method: "DELETE",
          });
        }
      }

      // 生成されたメッセージを追加
      for (const msg of data.messages) {
        await fetch(`/api/auto-webinars/${webinarId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appearAtSeconds: msg.seconds,
            senderName: msg.name,
            content: msg.message,
            messageType: msg.type,
          }),
        });
      }

      setShowAIDialog(false);
      fetchMessages();
    } catch (error) {
      console.error("AI generation failed:", error);
      setAiError(error instanceof Error ? error.message : "生成に失敗しました");
    } finally {
      setAiGenerating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const parseTime = (str: string): number => {
    const parts = str.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parseInt(str) || 0;
  };

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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              シミュレートチャット
            </CardTitle>
            <CardDescription>
              動画の進行に合わせて表示されるチャットメッセージを設定します
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI生成
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AIでチャットを生成
                  </DialogTitle>
                  <DialogDescription>
                    ローカルLLM（Ollama）を使用してリアルなチャットメッセージを自動生成します
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {aiError && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">エラー</p>
                        <p>{aiError}</p>
                        {aiError.includes("接続できません") && (
                          <p className="mt-1 text-xs">
                            Ollamaが起動していることを確認してください：
                            <code className="bg-muted px-1 rounded">ollama serve</code>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>トピック・テーマ（任意）</Label>
                    <Input
                      value={aiConfig.topic}
                      onChange={(e) => setAiConfig({ ...aiConfig, topic: e.target.value })}
                      placeholder="例: マーケティング戦略、投資入門など"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>生成件数</Label>
                      <Select
                        value={aiConfig.count.toString()}
                        onValueChange={(v) => setAiConfig({ ...aiConfig, count: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10件</SelectItem>
                          <SelectItem value="20">20件</SelectItem>
                          <SelectItem value="30">30件</SelectItem>
                          <SelectItem value="50">50件</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>密度</Label>
                      <Select
                        value={aiConfig.density}
                        onValueChange={(v) => setAiConfig({ ...aiConfig, density: v as typeof aiConfig.density })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sparse">まばら</SelectItem>
                          <SelectItem value="medium">普通</SelectItem>
                          <SelectItem value="dense">密集</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>質問を含める</Label>
                      <Switch
                        checked={aiConfig.includeQuestions}
                        onCheckedChange={(checked) => setAiConfig({ ...aiConfig, includeQuestions: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>感想・体験談を含める</Label>
                      <Switch
                        checked={aiConfig.includeTestimonials}
                        onCheckedChange={(checked) => setAiConfig({ ...aiConfig, includeTestimonials: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>既存メッセージを削除</Label>
                      <Switch
                        checked={aiConfig.clearExisting}
                        onCheckedChange={(checked) => setAiConfig({ ...aiConfig, clearExisting: checked })}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={generateWithAI}
                    disabled={aiGenerating}
                    className="w-full"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        AIで生成
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    ローカルLLM（Ollama）を使用。クラウドAPIは使用しません。
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={generateTemplate}>
              <Wand2 className="w-4 h-4 mr-2" />
              テンプレート生成
            </Button>
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  インポート
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>チャットメッセージをインポート</DialogTitle>
                  <DialogDescription>
                    CSVまたはJSON形式でメッセージをインポートできます
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>フォーマット</Label>
                    <Select
                      value={importFormat}
                      onValueChange={(v) => setImportFormat(v as "csv" | "json")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>データ</Label>
                    <Textarea
                      value={importContent}
                      onChange={(e) => setImportContent(e.target.value)}
                      placeholder={
                        importFormat === "csv"
                          ? "秒数,名前,メッセージ,タイプ\n30,田中,よろしくお願いします,COMMENT"
                          : '[{"seconds": 30, "name": "田中", "message": "よろしくお願いします"}]'
                      }
                      rows={10}
                    />
                  </div>
                  <Button onClick={importMessages} className="w-full">
                    インポート
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  追加
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>チャットメッセージを追加</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>表示タイミング</Label>
                      <Input
                        value={formatTime(newMessage.appearAtSeconds)}
                        onChange={(e) =>
                          setNewMessage({
                            ...newMessage,
                            appearAtSeconds: parseTime(e.target.value),
                          })
                        }
                        placeholder="1:30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>タイプ</Label>
                      <Select
                        value={newMessage.messageType}
                        onValueChange={(v) =>
                          setNewMessage({
                            ...newMessage,
                            messageType: v as typeof newMessage.messageType,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COMMENT">コメント</SelectItem>
                          <SelectItem value="QUESTION">質問</SelectItem>
                          <SelectItem value="REACTION">リアクション</SelectItem>
                          <SelectItem value="TESTIMONIAL">感想</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>送信者名</Label>
                    <Input
                      value={newMessage.senderName}
                      onChange={(e) =>
                        setNewMessage({ ...newMessage, senderName: e.target.value })
                      }
                      placeholder="参加者A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>メッセージ</Label>
                    <Textarea
                      value={newMessage.content}
                      onChange={(e) =>
                        setNewMessage({ ...newMessage, content: e.target.value })
                      }
                      placeholder="メッセージ内容"
                      rows={3}
                    />
                  </div>
                  <Button onClick={addMessage} className="w-full">
                    追加
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>チャットメッセージがありません</p>
            <p className="text-sm mt-1">
              「テンプレート生成」で自動生成するか、手動で追加してください
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">時間</TableHead>
                <TableHead className="w-[100px]">送信者</TableHead>
                <TableHead>メッセージ</TableHead>
                <TableHead className="w-[100px]">タイプ</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="font-mono">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatTime(message.appearAtSeconds)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {message.senderName}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {message.content}
                  </TableCell>
                  <TableCell>
                    <Badge variant={MESSAGE_TYPE_CONFIG[message.messageType].color}>
                      {MESSAGE_TYPE_CONFIG[message.messageType].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMessage(message.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="mt-4 text-sm text-muted-foreground">
          合計 {messages.length} メッセージ | 動画の長さ: {formatTime(videoDuration)}
        </div>
      </CardContent>
    </Card>
  );
}
