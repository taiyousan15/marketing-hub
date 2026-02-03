"use client";

import { useState } from "react";
import { Save, TestTube, ExternalLink, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LineSettingsPage() {
  const [channelId, setChannelId] = useState("");
  const [channelSecret, setChannelSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl = typeof window !== "undefined" 
    ? window.location.origin + "/api/webhooks/line"
    : "https://your-domain.com/api/webhooks/line";

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Save settings
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handleTest = async () => {
    setIsTesting(true);
    // TODO: Test connection
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsTesting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">LINE設定</h1>
        <p className="text-muted-foreground">
          LINE公式アカウントとの連携を設定します
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>接続状態</CardTitle>
                <CardDescription>LINE Messaging APIとの接続状態</CardDescription>
              </div>
              <Badge variant="secondary">未接続</Badge>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook URL</CardTitle>
            <CardDescription>
              LINE DevelopersコンソールのWebhook設定に以下のURLを登録してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopyWebhook}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API設定</CardTitle>
            <CardDescription>
              LINE Developersコンソールから取得した認証情報を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channelId">Channel ID</Label>
              <Input
                id="channelId"
                placeholder="1234567890"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channelSecret">Channel Secret</Label>
              <Input
                id="channelSecret"
                type="password"
                placeholder="••••••••••••••••"
                value={channelSecret}
                onChange={(e) => setChannelSecret(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Channel Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="••••••••••••••••"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                長期のチャネルアクセストークンを使用してください
              </p>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "保存中..." : "保存"}
              </Button>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={isTesting || !channelId || !channelSecret || !accessToken}
              >
                <TestTube className="mr-2 h-4 w-4" />
                {isTesting ? "テスト中..." : "接続テスト"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>設定手順</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                <a
                  href="https://developers.line.biz/console/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  LINE Developersコンソール
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
                にログイン
              </li>
              <li>プロバイダーを作成（または既存のものを選択）</li>
              <li>Messaging APIチャネルを作成</li>
              <li>「Messaging API設定」タブからChannel ID、Channel Secretを取得</li>
              <li>「チャネルアクセストークン（長期）」を発行</li>
              <li>Webhook URLに上記のURLを設定</li>
              <li>「Webhookの利用」をオンに設定</li>
              <li>上記フォームに認証情報を入力して保存</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
