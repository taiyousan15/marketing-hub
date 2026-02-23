"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, ExternalLink, Mail, Send, Loader2 } from "lucide-react";

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
import { toast } from "sonner";

export default function EmailSettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/email");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setApiKey(data.apiKey ?? "");
      setFromEmail(data.fromEmail ?? "");
      setFromName(data.fromName ?? "");
      setReplyTo(data.replyTo ?? "");
      setIsConnected(!!data.apiKey);
    } catch (error) {
      console.error("Failed to load email settings:", error);
      toast.error("メール設定の読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "resend",
          apiKey,
          fromEmail,
          fromName,
          replyTo,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "保存に失敗しました");
      }
      const result = await res.json();
      setApiKey(result.settings?.apiKey ?? apiKey);
      setIsConnected(!!result.settings?.apiKey);
      toast.success("設定を保存しました");
    } catch (error) {
      console.error("Failed to save email settings:", error);
      toast.error(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    setIsTesting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.info("テストメール機能は準備中です");
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">メール設定</h1>
        <p className="text-muted-foreground">
          Resendを使用したメール配信を設定します
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>接続状態</CardTitle>
                <CardDescription>Resendとの接続状態</CardDescription>
              </div>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "接続済み" : "未接続"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Mail className="h-5 w-5" />
              <span>
                {isConnected
                  ? "Resendに接続されています"
                  : "Resendを接続してメール配信を開始しましょう"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API設定</CardTitle>
            <CardDescription>
              ResendダッシュボードからAPIキーを取得して入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="re_xxxxxxxx..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Resend APIキーを使用してください
              </p>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button onClick={handleSave} disabled={isSaving || !apiKey}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "保存中..." : "保存"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>送信元設定</CardTitle>
            <CardDescription>
              メール送信時に表示される送信者情報を設定します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromEmail">送信元メールアドレス</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@example.com"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromName">送信者名</Label>
                <Input
                  id="fromName"
                  placeholder="MarketingHub"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="replyTo">返信先メールアドレス（任意）</Label>
              <Input
                id="replyTo"
                type="email"
                placeholder="support@example.com"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                空欄の場合、送信元メールアドレスが使用されます
              </p>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
              <Button
                variant="outline"
                onClick={handleSendTest}
                disabled={isTesting || !apiKey || !fromEmail}
              >
                <Send className="mr-2 h-4 w-4" />
                {isTesting ? "送信中..." : "テストメール送信"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ドメイン認証</CardTitle>
            <CardDescription>
              メールの到達率を向上させるため、ドメイン認証を設定してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-2">推奨設定</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>SPFレコードの設定</li>
                <li>DKIMの設定</li>
                <li>DMARCポリシーの設定</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              詳細は
              <a
                href="https://resend.com/docs/dashboard/domains/introduction"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center mx-1"
              >
                Resendのドキュメント
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
              を参照してください。
            </p>
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
                  href="https://resend.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  Resendダッシュボード
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
                にログイン（アカウントがない場合は作成）
              </li>
              <li>「API Keys」→「Create API Key」をクリック</li>
              <li>名前を入力し、必要な権限を付与</li>
              <li>作成されたAPIキーをコピー（一度しか表示されません）</li>
              <li>上記フォームにAPIキーを入力して保存</li>
              <li>送信元メールアドレスを設定</li>
              <li>（推奨）ドメインを追加してDNS認証を設定</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
