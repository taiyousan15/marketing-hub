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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Bell,
  Mail,
  MessageCircle,
  Clock,
  PlayCircle,
  RefreshCw,
  Loader2,
  Check,
  Send,
} from "lucide-react";

type NotificationChannel = "EMAIL" | "LINE" | "BOTH";

interface NotificationSettings {
  id: string;
  isEnabled: boolean;
  reminder30MinEnabled: boolean;
  reminder5MinEnabled: boolean;
  reminder1MinEnabled: boolean;
  startingNowEnabled: boolean;
  replayAvailableEnabled: boolean;
  replayExpiringEnabled: boolean;
  replayExpiringHours: number;
  defaultChannel: NotificationChannel;
  reminder30MinSubject: string | null;
  reminder30MinBody: string | null;
  reminder5MinSubject: string | null;
  reminder5MinBody: string | null;
  startingNowSubject: string | null;
  startingNowBody: string | null;
  replaySubject: string | null;
  replayBody: string | null;
}

interface NotificationSettingsEditorProps {
  webinarId: string;
}

export function NotificationSettingsEditor({
  webinarId,
}: NotificationSettingsEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    isEnabled: true,
    reminder30MinEnabled: true,
    reminder5MinEnabled: true,
    reminder1MinEnabled: false,
    startingNowEnabled: true,
    replayAvailableEnabled: true,
    replayExpiringEnabled: true,
    replayExpiringHours: 24,
    defaultChannel: "BOTH" as NotificationChannel,
    reminder30MinSubject: "",
    reminder30MinBody: "",
    reminder5MinSubject: "",
    reminder5MinBody: "",
    startingNowSubject: "",
    startingNowBody: "",
    replaySubject: "",
    replayBody: "",
  });

  useEffect(() => {
    fetchSettings();
  }, [webinarId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/auto-webinars/${webinarId}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setStats(data.stats);

        if (data.settings) {
          setFormData({
            isEnabled: data.settings.isEnabled,
            reminder30MinEnabled: data.settings.reminder30MinEnabled,
            reminder5MinEnabled: data.settings.reminder5MinEnabled,
            reminder1MinEnabled: data.settings.reminder1MinEnabled,
            startingNowEnabled: data.settings.startingNowEnabled,
            replayAvailableEnabled: data.settings.replayAvailableEnabled,
            replayExpiringEnabled: data.settings.replayExpiringEnabled,
            replayExpiringHours: data.settings.replayExpiringHours,
            defaultChannel: data.settings.defaultChannel,
            reminder30MinSubject: data.settings.reminder30MinSubject || "",
            reminder30MinBody: data.settings.reminder30MinBody || "",
            reminder5MinSubject: data.settings.reminder5MinSubject || "",
            reminder5MinBody: data.settings.reminder5MinBody || "",
            startingNowSubject: data.settings.startingNowSubject || "",
            startingNowBody: data.settings.startingNowBody || "",
            replaySubject: data.settings.replaySubject || "",
            replayBody: data.settings.replayBody || "",
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/auto-webinars/${webinarId}/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const channelOptions = [
    { value: "BOTH", label: "メール＆LINE", icon: <Bell className="w-4 h-4" /> },
    { value: "EMAIL", label: "メールのみ", icon: <Mail className="w-4 h-4" /> },
    { value: "LINE", label: "LINEのみ", icon: <MessageCircle className="w-4 h-4" /> },
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
      {/* メイン設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                通知設定
              </CardTitle>
              <CardDescription>
                ウェビナー参加者への通知を設定します
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">通知を有効化</span>
              <Switch
                checked={formData.isEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isEnabled: checked })
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 配信チャンネル */}
          <div className="space-y-2">
            <Label>配信チャンネル</Label>
            <Select
              value={formData.defaultChannel}
              onValueChange={(value: NotificationChannel) =>
                setFormData({ ...formData, defaultChannel: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {channelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 統計情報 */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.scheduled || 0}</p>
                <p className="text-sm text-muted-foreground">スケジュール済み</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {stats.byType?.filter((s: any) => s.success)?.reduce((sum: number, s: any) => sum + s._count, 0) || 0}
                </p>
                <p className="text-sm text-muted-foreground">送信成功</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">
                  {stats.byType?.filter((s: any) => !s.success)?.reduce((sum: number, s: any) => sum + s._count, 0) || 0}
                </p>
                <p className="text-sm text-muted-foreground">送信失敗</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* リマインダー設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            開始前リマインダー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 30分前 */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">30</span>
                </div>
                <div>
                  <p className="font-medium">30分前リマインダー</p>
                  <p className="text-sm text-muted-foreground">
                    開始30分前に通知を送信
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.reminder30MinEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, reminder30MinEnabled: checked })
                }
              />
            </div>

            {/* 5分前 */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-yellow-600">5</span>
                </div>
                <div>
                  <p className="font-medium">5分前リマインダー</p>
                  <p className="text-sm text-muted-foreground">
                    開始5分前に通知を送信
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.reminder5MinEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, reminder5MinEnabled: checked })
                }
              />
            </div>

            {/* 1分前 */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-red-600">1</span>
                </div>
                <div>
                  <p className="font-medium">1分前リマインダー</p>
                  <p className="text-sm text-muted-foreground">
                    開始1分前に通知を送信
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.reminder1MinEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, reminder1MinEnabled: checked })
                }
              />
            </div>

            {/* 開始通知 */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">開始通知</p>
                  <p className="text-sm text-muted-foreground">
                    ウェビナー開始時に通知を送信
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.startingNowEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, startingNowEnabled: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* リプレイ通知 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            リプレイ通知
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* リプレイ公開通知 */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">リプレイ公開通知</p>
              <p className="text-sm text-muted-foreground">
                リプレイが視聴可能になったら通知
              </p>
            </div>
            <Switch
              checked={formData.replayAvailableEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, replayAvailableEnabled: checked })
              }
            />
          </div>

          {/* 期限切れ警告 */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <p className="font-medium">期限切れ警告</p>
              <p className="text-sm text-muted-foreground">
                リプレイ期限切れ前に警告通知
              </p>
              {formData.replayExpiringEnabled && (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    value={formData.replayExpiringHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        replayExpiringHours: parseInt(e.target.value) || 24,
                      })
                    }
                    className="w-20"
                    min={1}
                  />
                  <span className="text-sm text-muted-foreground">時間前に通知</span>
                </div>
              )}
            </div>
            <Switch
              checked={formData.replayExpiringEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, replayExpiringEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* カスタムメッセージ */}
      <Card>
        <CardHeader>
          <CardTitle>カスタムメッセージ（任意）</CardTitle>
          <CardDescription>
            空欄の場合はデフォルトのメッセージが使用されます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="reminder30">
              <AccordionTrigger>30分前リマインダー</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>件名</Label>
                  <Input
                    value={formData.reminder30MinSubject}
                    onChange={(e) =>
                      setFormData({ ...formData, reminder30MinSubject: e.target.value })
                    }
                    placeholder="【30分後開始】{webinarTitle}"
                  />
                </div>
                <div className="space-y-2">
                  <Label>本文</Label>
                  <Textarea
                    value={formData.reminder30MinBody}
                    onChange={(e) =>
                      setFormData({ ...formData, reminder30MinBody: e.target.value })
                    }
                    placeholder="デフォルトのメッセージを使用"
                    rows={4}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="reminder5">
              <AccordionTrigger>5分前リマインダー</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>件名</Label>
                  <Input
                    value={formData.reminder5MinSubject}
                    onChange={(e) =>
                      setFormData({ ...formData, reminder5MinSubject: e.target.value })
                    }
                    placeholder="【5分後開始】{webinarTitle}"
                  />
                </div>
                <div className="space-y-2">
                  <Label>本文</Label>
                  <Textarea
                    value={formData.reminder5MinBody}
                    onChange={(e) =>
                      setFormData({ ...formData, reminder5MinBody: e.target.value })
                    }
                    placeholder="デフォルトのメッセージを使用"
                    rows={4}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="startingNow">
              <AccordionTrigger>開始通知</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>件名</Label>
                  <Input
                    value={formData.startingNowSubject}
                    onChange={(e) =>
                      setFormData({ ...formData, startingNowSubject: e.target.value })
                    }
                    placeholder="【開始しました】{webinarTitle}"
                  />
                </div>
                <div className="space-y-2">
                  <Label>本文</Label>
                  <Textarea
                    value={formData.startingNowBody}
                    onChange={(e) =>
                      setFormData({ ...formData, startingNowBody: e.target.value })
                    }
                    placeholder="デフォルトのメッセージを使用"
                    rows={4}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="replay">
              <AccordionTrigger>リプレイ通知</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>件名</Label>
                  <Input
                    value={formData.replaySubject}
                    onChange={(e) =>
                      setFormData({ ...formData, replaySubject: e.target.value })
                    }
                    placeholder="【リプレイ公開】{webinarTitle}"
                  />
                </div>
                <div className="space-y-2">
                  <Label>本文</Label>
                  <Textarea
                    value={formData.replayBody}
                    onChange={(e) =>
                      setFormData({ ...formData, replayBody: e.target.value })
                    }
                    placeholder="デフォルトのメッセージを使用"
                    rows={4}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            保存中...
          </>
        ) : (
          <>
            <Check className="w-4 h-4 mr-2" />
            通知設定を保存
          </>
        )}
      </Button>
    </div>
  );
}
