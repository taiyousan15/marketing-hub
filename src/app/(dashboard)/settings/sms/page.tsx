"use client";

import { useState, useEffect } from "react";
import {
  Save,
  ExternalLink,
  MessageSquare,
  Send,
  Phone,
  Clock,
  Shield,
  AlertTriangle,
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

interface SMSSettings {
  provider: string;
  accountSid: string | null;
  authToken: string | null;
  fromNumber: string | null;
  messagingServiceSid: string | null;
  enabled: boolean;
  sendingHoursStart: number;
  sendingHoursEnd: number;
  removeUrls: boolean;
  maxPerMinute: number;
  maxPerDay: number;
}

export default function SMSSettingsPage() {
  const [settings, setSettings] = useState<SMSSettings>({
    provider: "twilio",
    accountSid: null,
    authToken: null,
    fromNumber: null,
    messagingServiceSid: null,
    enabled: false,
    sendingHoursStart: 9,
    sendingHoursEnd: 20,
    removeUrls: true,
    maxPerMinute: 30,
    maxPerDay: 1000,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/sms/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch SMS settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/sms/settings", {
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
    if (!testPhone) {
      alert("テスト送信先の電話番号を入力してください");
      return;
    }
    setIsTesting(true);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testPhone.startsWith("+") ? testPhone : `+81${testPhone.replace(/^0/, "")}`,
          body: "Marketing Hubからのテストメッセージです。",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "送信に失敗しました");
      }
      alert("テストSMSを送信しました");
    } catch (error) {
      console.error("Test SMS failed:", error);
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
        <h1 className="text-2xl font-bold tracking-tight">SMS設定</h1>
        <p className="text-muted-foreground">
          Twilioを使用したSMS配信を設定します
        </p>
      </div>

      <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                日本向けSMSの注意事項
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                日本のキャリア（docomo, au, SoftBank）はURLを含むSMSをブロックする場合があります。
                URL除去オプションを有効にすることを推奨します。
              </p>
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
                <CardDescription>Twilioとの接続状態</CardDescription>
              </div>
              <Badge variant={settings.enabled ? "default" : "secondary"}>
                {settings.enabled ? "有効" : "無効"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <MessageSquare className="h-5 w-5" />
                <span>
                  {settings.enabled
                    ? "SMS配信が有効です"
                    : "Twilioを接続してSMS配信を開始しましょう"}
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
              Twilioダッシュボードから認証情報を取得して入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromNumber">送信元電話番号（E.164形式）</Label>
                <Input
                  id="fromNumber"
                  placeholder="+81XXXXXXXXXX"
                  value={settings.fromNumber || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, fromNumber: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Twilioで取得した電話番号を入力
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="messagingServiceSid">
                  Messaging Service SID（オプション）
                </Label>
                <Input
                  id="messagingServiceSid"
                  placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={settings.messagingServiceSid || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      messagingServiceSid: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  スケジュール配信に必要
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              配信設定
            </CardTitle>
            <CardDescription>
              SMS配信のタイミングと制限を設定します
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
                <p className="text-xs text-muted-foreground">
                  推奨: 9:00-20:00
                </p>
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
                          maxPerMinute: parseInt(e.target.value) || 30,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      通/分
                    </p>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      通/日
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="removeUrls" className="cursor-pointer">
                  URLを自動除去
                </Label>
                <p className="text-xs text-muted-foreground">
                  日本のキャリアでブロックされるURLを自動的に除去します（推奨）
                </p>
              </div>
              <Switch
                id="removeUrls"
                checked={settings.removeUrls}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, removeUrls: checked })
                }
              />
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
              設定が正しいことを確認するためにテストSMSを送信します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
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
            <CardTitle>設定手順</CardTitle>
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
                にログイン（アカウントがない場合は作成）
              </li>
              <li>
                ダッシュボードから「Account SID」と「Auth Token」をコピー
              </li>
              <li>Phone Numbers → Buy a Number で日本の電話番号を取得</li>
              <li>上記フォームに認証情報と電話番号を入力</li>
              <li>「有効化」をONにして保存</li>
              <li>テスト送信で動作確認</li>
            </ol>
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
                <strong>特定電子メール法</strong>:
                事前にオプトイン（同意）を取得する必要があります
              </li>
              <li>
                <strong>オプトアウト対応</strong>: 「STOP」「停止」などのキーワードで配信停止
              </li>
              <li>
                <strong>送信時間</strong>: 深夜・早朝の送信は避けてください
              </li>
              <li>
                <strong>URL制限</strong>:
                日本のキャリアはURLを含むSMSをフィルタリングします
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
