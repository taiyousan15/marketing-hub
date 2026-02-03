"use client";

import { useState, useEffect } from "react";
import {
  Save,
  ExternalLink,
  MessageCircle,
  Send,
  Phone,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  Image,
} from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTenant } from "@/hooks/use-tenant";

interface WhatsAppSettings {
  provider: string;
  accountSid: string | null;
  authToken: string | null;
  whatsappNumber: string | null;
  metaAccessToken: string | null;
  metaPhoneNumberId: string | null;
  metaBusinessId: string | null;
  enabled: boolean;
  sendingHoursStart: number;
  sendingHoursEnd: number;
  maxPerMinute: number;
  maxPerDay: number;
  welcomeTemplateId: string | null;
}

export default function WhatsAppSettingsPage() {
  const { tenantId } = useTenant();
  const [settings, setSettings] = useState<WhatsAppSettings>({
    provider: "twilio",
    accountSid: null,
    authToken: null,
    whatsappNumber: null,
    metaAccessToken: null,
    metaPhoneNumberId: null,
    metaBusinessId: null,
    enabled: false,
    sendingHoursStart: 9,
    sendingHoursEnd: 21,
    maxPerMinute: 60,
    maxPerDay: 1000,
    welcomeTemplateId: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Marketing Hubからのテストメッセージです。");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tenantId) {
      fetchSettings();
    }
  }, [tenantId]);

  const fetchSettings = async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/whatsapp/settings?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch WhatsApp settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/whatsapp/settings?tenantId=${tenantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        throw new Error("Failed to save settings");
      }
      alert("設定を保存しました");
    } catch (error) {
      console.error("Failed to save:", error);
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone || !tenantId) {
      alert("テスト送信先の電話番号を入力してください");
      return;
    }
    setIsTesting(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          to: testPhone.startsWith("+")
            ? testPhone
            : `+81${testPhone.replace(/^0/, "")}`,
          body: testMessage,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "送信に失敗しました");
      }
      alert("テストメッセージを送信しました");
    } catch (error) {
      console.error("Test WhatsApp failed:", error);
      alert(error instanceof Error ? error.message : "送信に失敗しました");
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-green-500" />
          WhatsApp設定
        </h1>
        <p className="text-muted-foreground">
          WhatsApp Business APIを使用したメッセージ配信を設定します
        </p>
      </div>

      <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">
                WhatsApp Business APIのメリット
              </h4>
              <ul className="text-sm text-green-700 dark:text-green-300 mt-1 space-y-1">
                <li>• 高い開封率（90%以上）とエンゲージメント</li>
                <li>• 画像・動画・ドキュメントの送信が可能</li>
                <li>• 既読確認機能でメッセージの到達を確認</li>
                <li>• グローバル対応（海外顧客にも対応）</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>接続状態</CardTitle>
                <CardDescription>WhatsApp Business APIとの接続状態</CardDescription>
              </div>
              <Badge variant={settings.enabled ? "default" : "secondary"}>
                {settings.enabled ? "有効" : "無効"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <span>
                  {settings.enabled
                    ? "WhatsApp配信が有効です"
                    : "WhatsAppを接続してメッセージ配信を開始しましょう"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="enabled">有効化</Label>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enabled: checked })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API設定</CardTitle>
            <CardDescription>
              WhatsApp Business APIの認証情報を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={settings.provider}
              onValueChange={(v) => setSettings({ ...settings, provider: v })}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="twilio">Twilio（推奨）</TabsTrigger>
                <TabsTrigger value="meta">Meta Cloud API</TabsTrigger>
              </TabsList>

              <TabsContent value="twilio" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="accountSid">Account SID</Label>
                    <Input
                      id="accountSid"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={settings.accountSid || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, accountSid: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="authToken">Auth Token</Label>
                    <Input
                      id="authToken"
                      type="password"
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={settings.authToken || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, authToken: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">
                    WhatsApp番号（whatsapp:+1234567890形式）
                  </Label>
                  <Input
                    id="whatsappNumber"
                    placeholder="whatsapp:+14155238886"
                    value={settings.whatsappNumber || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, whatsappNumber: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Twilio SandboxまたはWhatsApp対応番号を入力
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="meta" className="space-y-4">
                <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Meta Cloud APIは高度な設定が必要です。
                        まずはTwilio経由での統合をお勧めします。
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="metaAccessToken">Access Token</Label>
                    <Input
                      id="metaAccessToken"
                      type="password"
                      placeholder="EAAxxxxxxxx..."
                      value={settings.metaAccessToken || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          metaAccessToken: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaPhoneNumberId">Phone Number ID</Label>
                    <Input
                      id="metaPhoneNumberId"
                      placeholder="1234567890"
                      value={settings.metaPhoneNumberId || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          metaPhoneNumberId: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaBusinessId">Business Account ID</Label>
                  <Input
                    id="metaBusinessId"
                    placeholder="1234567890"
                    value={settings.metaBusinessId || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, metaBusinessId: e.target.value })
                    }
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              配信設定
            </CardTitle>
            <CardDescription>
              WhatsApp配信のタイミングと制限を設定します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>送信可能時間帯（JST）</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(settings.sendingHoursStart)}
                    onValueChange={(v) =>
                      setSettings({
                        ...settings,
                        sendingHoursStart: parseInt(v),
                      })
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {i}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>〜</span>
                  <Select
                    value={String(settings.sendingHoursEnd)}
                    onValueChange={(v) =>
                      setSettings({ ...settings, sendingHoursEnd: parseInt(v) })
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {i}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">推奨: 9:00-21:00</p>
              </div>

              <div className="space-y-2">
                <Label>レート制限</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      value={settings.maxPerMinute}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          maxPerMinute: parseInt(e.target.value) || 60,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">通/分</p>
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={settings.maxPerDay}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          maxPerDay: parseInt(e.target.value) || 1000,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">通/日</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              テスト送信
            </CardTitle>
            <CardDescription>
              設定が正しいことを確認するためにテストメッセージを送信します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="testPhone">送信先電話番号</Label>
                <Input
                  id="testPhone"
                  placeholder="090-1234-5678"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSendTest}
                  disabled={isTesting || !settings.enabled || !testPhone}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isTesting ? "送信中..." : "テスト送信"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="testMessage">テストメッセージ</Label>
              <Textarea
                id="testMessage"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "保存中..." : "設定を保存"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>設定手順（Twilio）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                <a
                  href="https://www.twilio.com/console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  Twilioダッシュボード
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
                にログイン
              </li>
              <li>
                Messaging → Try it out → Send a WhatsApp message
              </li>
              <li>
                Sandbox番号（whatsapp:+14155238886）をメモ
              </li>
              <li>
                テスト用端末でSandboxに参加（QRコードまたはコード送信）
              </li>
              <li>
                上記フォームに認証情報と番号を入力して保存
              </li>
              <li>
                テスト送信で動作確認
              </li>
            </ol>
            <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>本番環境への移行：</strong>
                  Twilioで正式なWhatsApp番号を申請し、Meta承認を受ける必要があります。
                  Sandbox番号は開発・テスト用です。
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              WhatsApp機能
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border">
                <h4 className="font-medium">テキストメッセージ</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  シンプルなテキストメッセージを送信
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <h4 className="font-medium">画像・動画</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  リッチメディアを含むメッセージ
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <h4 className="font-medium">テンプレート</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Meta承認済みテンプレートで24時間制限を回避
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              コンプライアンス
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>24時間ルール：</strong>
                ユーザーからのメッセージ受信後24時間以内のみ自由にメッセージ送信可能
              </li>
              <li>
                <strong>テンプレートメッセージ：</strong>
                24時間経過後はMeta承認済みテンプレートのみ送信可能
              </li>
              <li>
                <strong>オプトイン必須：</strong>
                事前にユーザーの同意を取得する必要があります
              </li>
              <li>
                <strong>オプトアウト対応：</strong>
                「STOP」「停止」などのキーワードで配信停止
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
