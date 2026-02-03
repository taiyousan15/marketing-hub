"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserCheck,
  ShoppingCart,
  Lock,
  Mail,
  MessageCircle,
  Download,
  FileText,
  Loader2,
  Check,
  Video,
  Clock,
  Eye,
} from "lucide-react";

type RecordingAccessLevel = "ALL" | "SPECIFIED" | "PURCHASERS" | "NONE";

interface RecordingDistribution {
  id: string;
  accessLevel: RecordingAccessLevel;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  expiresAt: string | null;
  specifiedContactIds: string[] | null;
  requiredProductId: string | null;
  requiredTagId: string | null;
  notifyOnAvailable: boolean;
  notifyViaEmail: boolean;
  notifyViaLine: boolean;
  allowDownload: boolean;
  totalViews: number;
  uniqueViews: number;
}

interface Recording {
  id: string;
  fileUrl: string | null;
  duration: number | null;
  status: string;
}

interface Transcription {
  status: string;
  fullText: string | null;
  summary: string | null;
  keyPoints: string[] | null;
}

interface RecordingDistributionEditorProps {
  eventId: string;
  recordingId: string;
}

export function RecordingDistributionEditor({
  eventId,
  recordingId,
}: RecordingDistributionEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [distribution, setDistribution] = useState<RecordingDistribution | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: string; email: string; name: string | null }[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    accessLevel: "ALL" as RecordingAccessLevel,
    title: "",
    description: "",
    thumbnail: "",
    expiresAt: "",
    specifiedContactIds: [] as string[],
    requiredTagId: "",
    notifyOnAvailable: true,
    notifyViaEmail: true,
    notifyViaLine: true,
    allowDownload: false,
  });

  useEffect(() => {
    fetchData();
    fetchTags();
    fetchContacts();
  }, [eventId, recordingId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/livestream/${eventId}/recordings/${recordingId}/distribution`
      );
      if (res.ok) {
        const data = await res.json();
        setRecording(data.recording);
        setDistribution(data.distribution);
        setTranscription(data.transcription);

        if (data.distribution) {
          setFormData({
            accessLevel: data.distribution.accessLevel,
            title: data.distribution.title || "",
            description: data.distribution.description || "",
            thumbnail: data.distribution.thumbnail || "",
            expiresAt: data.distribution.expiresAt
              ? new Date(data.distribution.expiresAt).toISOString().slice(0, 16)
              : "",
            specifiedContactIds: data.distribution.specifiedContactIds || [],
            requiredTagId: data.distribution.requiredTagId || "",
            notifyOnAvailable: data.distribution.notifyOnAvailable,
            notifyViaEmail: data.distribution.notifyViaEmail,
            notifyViaLine: data.distribution.notifyViaLine,
            allowDownload: data.distribution.allowDownload,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch distribution:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts?limit=100");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(
        `/api/livestream/${eventId}/recordings/${recordingId}/distribution`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            expiresAt: formData.expiresAt || null,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setDistribution(data.distribution);
      }
    } catch (error) {
      console.error("Failed to save distribution:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleStartTranscription = async () => {
    try {
      const res = await fetch(
        `/api/livestream/${eventId}/recordings/${recordingId}/transcription`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: "ja", generateSummary: true }),
        }
      );

      if (res.ok) {
        // Refetch to get updated status
        fetchData();
      }
    } catch (error) {
      console.error("Failed to start transcription:", error);
    }
  };

  const accessLevelOptions = [
    {
      value: "ALL",
      label: "全参加者",
      description: "ライブ配信に参加した全員に配布",
      icon: Users,
    },
    {
      value: "SPECIFIED",
      label: "指定メンバー",
      description: "選択したメンバーにのみ配布",
      icon: UserCheck,
    },
    {
      value: "PURCHASERS",
      label: "購入者のみ",
      description: "指定タグを持つ購入者にのみ配布",
      icon: ShoppingCart,
    },
    {
      value: "NONE",
      label: "非公開",
      description: "録画を配布しない",
      icon: Lock,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 録画情報 */}
      {recording && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              録画情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ステータス</p>
                  <p className="font-medium">{recording.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">再生時間</p>
                  <p className="font-medium">
                    {recording.duration
                      ? `${Math.floor(recording.duration / 60)}分${recording.duration % 60}秒`
                      : "不明"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">視聴回数</p>
                  <p className="font-medium flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {distribution?.totalViews || 0} 回
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="distribution">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="distribution">配布設定</TabsTrigger>
          <TabsTrigger value="transcription">文字起こし</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-6 mt-4">
          {/* アクセスレベル選択 */}
          <Card>
            <CardHeader>
              <CardTitle>配布対象</CardTitle>
              <CardDescription>
                録画を配布する対象を選択してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {accessLevelOptions.map((option) => (
                  <Card
                    key={option.value}
                    className={`cursor-pointer transition-all ${
                      formData.accessLevel === option.value
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        accessLevel: option.value as RecordingAccessLevel,
                      })
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <option.icon className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                        {formData.accessLevel === option.value && (
                          <Check className="w-5 h-5 text-primary ml-auto" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 指定メンバー選択 */}
              {formData.accessLevel === "SPECIFIED" && (
                <div className="mt-4 p-4 border rounded-lg">
                  <Label>配布先メンバー</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    録画を配布するメンバーを選択してください
                  </p>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {contacts.map((contact) => (
                      <label
                        key={contact.id}
                        className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.specifiedContactIds.includes(contact.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                specifiedContactIds: [
                                  ...formData.specifiedContactIds,
                                  contact.id,
                                ],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                specifiedContactIds:
                                  formData.specifiedContactIds.filter(
                                    (id) => id !== contact.id
                                  ),
                              });
                            }
                          }}
                        />
                        <span>{contact.name || contact.email}</span>
                        <span className="text-sm text-muted-foreground">
                          {contact.email}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {formData.specifiedContactIds.length}人選択中
                  </p>
                </div>
              )}

              {/* 購入者タグ選択 */}
              {formData.accessLevel === "PURCHASERS" && (
                <div className="mt-4 p-4 border rounded-lg">
                  <Label>必要なタグ</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    このタグを持つユーザーのみ録画を視聴できます
                  </p>
                  <Select
                    value={formData.requiredTagId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, requiredTagId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="タグを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 配布オプション */}
          <Card>
            <CardHeader>
              <CardTitle>配布オプション</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">タイトル（任意）</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="録画のタイトル"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">有効期限（任意）</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) =>
                      setFormData({ ...formData, expiresAt: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">説明（任意）</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="録画の説明文"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  <div>
                    <p className="font-medium">ダウンロードを許可</p>
                    <p className="text-sm text-muted-foreground">
                      視聴者が録画をダウンロードできるようにします
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.allowDownload}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allowDownload: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* 通知設定 */}
          <Card>
            <CardHeader>
              <CardTitle>通知設定</CardTitle>
              <CardDescription>
                録画が利用可能になった際の通知方法
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span>配布時に通知を送信</span>
                </div>
                <Switch
                  checked={formData.notifyOnAvailable}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notifyOnAvailable: checked })
                  }
                />
              </div>

              {formData.notifyOnAvailable && (
                <div className="ml-7 space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>メールで通知</span>
                    </div>
                    <Switch
                      checked={formData.notifyViaEmail}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, notifyViaEmail: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>LINEで通知</span>
                    </div>
                    <Switch
                      checked={formData.notifyViaLine}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, notifyViaLine: checked })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              "配布設定を保存"
            )}
          </Button>
        </TabsContent>

        <TabsContent value="transcription" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                文字起こし
              </CardTitle>
              <CardDescription>
                録画の文字起こしを生成・管理します
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!transcription ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    文字起こしがまだありません
                  </p>
                  <Button onClick={handleStartTranscription}>
                    文字起こしを開始
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {transcription.status === "COMPLETED" ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : transcription.status === "PROCESSING" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                      <span>
                        ステータス:{" "}
                        {transcription.status === "COMPLETED"
                          ? "完了"
                          : transcription.status === "PROCESSING"
                          ? "処理中"
                          : transcription.status === "PENDING"
                          ? "待機中"
                          : "エラー"}
                      </span>
                    </div>
                    {transcription.status === "COMPLETED" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/api/livestream/${eventId}/recordings/${recordingId}/transcription?format=srt`,
                              "_blank"
                            )
                          }
                        >
                          SRTダウンロード
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/api/livestream/${eventId}/recordings/${recordingId}/transcription?format=vtt`,
                              "_blank"
                            )
                          }
                        >
                          VTTダウンロード
                        </Button>
                      </div>
                    )}
                  </div>

                  {transcription.summary && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">要約</h4>
                      <p className="text-sm text-muted-foreground">
                        {transcription.summary}
                      </p>
                    </div>
                  )}

                  {transcription.keyPoints && transcription.keyPoints.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">要点</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {transcription.keyPoints.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {transcription.fullText && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">全文</h4>
                      <div className="max-h-64 overflow-y-auto text-sm text-muted-foreground whitespace-pre-wrap">
                        {transcription.fullText}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
