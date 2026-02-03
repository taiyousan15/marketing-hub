"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Video,
  Link as LinkIcon,
  Key,
  Mail,
  FileText,
  Download,
  Loader2,
  Check,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";

type ExternalMeetingPlatform = "ZOOM" | "GOOGLE_MEET" | "TEAMS" | "NONE";

interface ExternalMeetingIntegration {
  id: string;
  platform: ExternalMeetingPlatform;
  meetingId: string | null;
  meetingUrl: string | null;
  password: string | null;
  hostEmail: string | null;
  autoRecordEnabled: boolean;
  autoTranscribe: boolean;
  importRecordingOnEnd: boolean;
  accessToken: string | null;
  tokenExpiry: string | null;
}

interface ExternalMeetingIntegrationProps {
  eventId: string;
}

export function ExternalMeetingIntegrationEditor({
  eventId,
}: ExternalMeetingIntegrationProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [integration, setIntegration] = useState<ExternalMeetingIntegration | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    platform: "ZOOM" as ExternalMeetingPlatform,
    meetingId: "",
    meetingUrl: "",
    password: "",
    hostEmail: "",
    autoRecordEnabled: true,
    autoTranscribe: true,
    importRecordingOnEnd: true,
  });

  useEffect(() => {
    fetchIntegration();
  }, [eventId]);

  const fetchIntegration = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/livestream/${eventId}/external-meeting`);
      if (res.ok) {
        const data = await res.json();
        if (data.integration) {
          setIntegration(data.integration);
          setFormData({
            platform: data.integration.platform,
            meetingId: data.integration.meetingId || "",
            meetingUrl: data.integration.meetingUrl || "",
            password: data.integration.password || "",
            hostEmail: data.integration.hostEmail || "",
            autoRecordEnabled: data.integration.autoRecordEnabled,
            autoTranscribe: data.integration.autoTranscribe,
            importRecordingOnEnd: data.integration.importRecordingOnEnd,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch integration:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/livestream/${eventId}/external-meeting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setIntegration(data.integration);
      }
    } catch (error) {
      console.error("Failed to save integration:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleImportRecording = async () => {
    try {
      setImporting(true);
      const res = await fetch(`/api/livestream/${eventId}/external-meeting`, {
        method: "PATCH",
      });

      if (res.ok) {
        alert("録画のインポートが完了しました");
      } else {
        const data = await res.json();
        alert(data.error || "録画のインポートに失敗しました");
      }
    } catch (error) {
      console.error("Failed to import recording:", error);
      alert("録画のインポートに失敗しました");
    } finally {
      setImporting(false);
    }
  };

  const handleOAuthConnect = (platform: ExternalMeetingPlatform) => {
    const clientId =
      platform === "ZOOM"
        ? process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID
        : process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const redirectUri = `${window.location.origin}/api/auth/callback/${platform.toLowerCase()}`;
    const state = btoa(JSON.stringify({ eventId }));

    let authUrl = "";
    if (platform === "ZOOM") {
      authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    } else if (platform === "GOOGLE_MEET") {
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/drive.readonly&state=${state}`;
    }

    if (authUrl) {
      window.open(authUrl, "_blank", "width=600,height=700");
    }
  };

  const platformOptions = [
    {
      value: "ZOOM",
      label: "Zoom",
      icon: "/images/zoom-logo.svg",
      description: "Zoomミーティングと連携",
    },
    {
      value: "GOOGLE_MEET",
      label: "Google Meet",
      icon: "/images/google-meet-logo.svg",
      description: "Google Meetと連携",
    },
    {
      value: "TEAMS",
      label: "Microsoft Teams",
      icon: "/images/teams-logo.svg",
      description: "Teamsと連携（準備中）",
      disabled: true,
    },
    {
      value: "NONE",
      label: "連携なし",
      icon: null,
      description: "外部プラットフォームを使用しない",
    },
  ];

  const isConnected =
    integration?.accessToken &&
    integration.tokenExpiry &&
    new Date(integration.tokenExpiry) > new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* プラットフォーム選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            外部ミーティング連携
          </CardTitle>
          <CardDescription>
            Zoom/Google Meetと連携して、ミーティングの録画を自動インポートできます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {platformOptions.map((option) => (
              <Card
                key={option.value}
                className={`cursor-pointer transition-all ${
                  option.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : formData.platform === option.value
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => {
                  if (!option.disabled) {
                    setFormData({
                      ...formData,
                      platform: option.value as ExternalMeetingPlatform,
                    });
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {option.icon ? (
                      <div className="w-8 h-8 relative">
                        <Image
                          src={option.icon}
                          alt={option.label}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <Video className="w-8 h-8 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                    {formData.platform === option.value && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 連携設定（プラットフォームがNONE以外の場合） */}
      {formData.platform !== "NONE" && (
        <>
          {/* OAuth接続 */}
          <Card>
            <CardHeader>
              <CardTitle>アカウント接続</CardTitle>
              <CardDescription>
                {formData.platform === "ZOOM" ? "Zoom" : "Google"}
                アカウントと接続して、録画を自動インポートします
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isConnected ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-green-700">
                      アカウントが接続されています
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOAuthConnect(formData.platform)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    再接続
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleOAuthConnect(formData.platform)}
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {formData.platform === "ZOOM" ? "Zoom" : "Google"}
                  アカウントを接続
                </Button>
              )}
            </CardContent>
          </Card>

          {/* ミーティング情報 */}
          <Card>
            <CardHeader>
              <CardTitle>ミーティング情報</CardTitle>
              <CardDescription>
                連携するミーティングの情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meetingId">
                    <Key className="w-4 h-4 inline mr-1" />
                    ミーティングID
                  </Label>
                  <Input
                    id="meetingId"
                    value={formData.meetingId}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingId: e.target.value })
                    }
                    placeholder={
                      formData.platform === "ZOOM"
                        ? "123 456 7890"
                        : "abc-defg-hij"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    <Key className="w-4 h-4 inline mr-1" />
                    パスワード（任意）
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="ミーティングパスワード"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingUrl">
                  <LinkIcon className="w-4 h-4 inline mr-1" />
                  参加URL
                </Label>
                <Input
                  id="meetingUrl"
                  value={formData.meetingUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, meetingUrl: e.target.value })
                  }
                  placeholder="https://zoom.us/j/1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostEmail">
                  <Mail className="w-4 h-4 inline mr-1" />
                  ホストメールアドレス
                </Label>
                <Input
                  id="hostEmail"
                  type="email"
                  value={formData.hostEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, hostEmail: e.target.value })
                  }
                  placeholder="host@example.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* 自動化設定 */}
          <Card>
            <CardHeader>
              <CardTitle>自動化設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  <div>
                    <p className="font-medium">自動録画</p>
                    <p className="text-sm text-muted-foreground">
                      ミーティング開始時に自動で録画を開始
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.autoRecordEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, autoRecordEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <div>
                    <p className="font-medium">自動文字起こし</p>
                    <p className="text-sm text-muted-foreground">
                      録画完了後に自動で文字起こしを生成
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.autoTranscribe}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, autoTranscribe: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  <div>
                    <p className="font-medium">録画の自動インポート</p>
                    <p className="text-sm text-muted-foreground">
                      ミーティング終了後に録画を自動インポート
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.importRecordingOnEnd}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, importRecordingOnEnd: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* 手動インポート */}
          {integration && isConnected && (
            <Card>
              <CardHeader>
                <CardTitle>録画のインポート</CardTitle>
                <CardDescription>
                  過去のミーティング録画を手動でインポート
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleImportRecording}
                  disabled={importing}
                  variant="outline"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      インポート中...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      録画をインポート
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            保存中...
          </>
        ) : (
          "設定を保存"
        )}
      </Button>
    </div>
  );
}
