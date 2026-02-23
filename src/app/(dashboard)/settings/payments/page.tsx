"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, ExternalLink, CreditCard, TestTube, Copy, Check, Loader2 } from "lucide-react";

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

export default function PaymentsSettingsPage() {
  const [secretKey, setSecretKey] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl = typeof window !== "undefined"
    ? window.location.origin + "/api/webhooks/stripe"
    : "https://your-domain.com/api/webhooks/stripe";

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/payments");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setSecretKey(data.secretKey ?? "");
      setPublishableKey(data.publishableKey ?? "");
      setWebhookSecret(data.webhookSecret ?? "");
      setIsConnected(!!data.secretKey);
    } catch (error) {
      console.error("Failed to load payment settings:", error);
      toast.error("決済設定の読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretKey, publishableKey, webhookSecret }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "保存に失敗しました");
      }
      const result = await res.json();
      if (result.settings) {
        setSecretKey(result.settings.secretKey ?? "");
        setPublishableKey(result.settings.publishableKey ?? "");
        setWebhookSecret(result.settings.webhookSecret ?? "");
        setIsConnected(!!result.settings.secretKey);
      }
      toast.success("設定を保存しました");
    } catch (error) {
      console.error("Failed to save payment settings:", error);
      toast.error(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectionTest = async () => {
    if (!secretKey || secretKey.startsWith("***")) {
      toast.error("新しいSecret Keyを入力してからテストしてください");
      return;
    }
    setIsTesting(true);
    try {
      const res = await fetch("/api/settings/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretKey }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Stripe接続テスト成功");
      } else {
        toast.error(data.error || "接続テストに失敗しました");
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      toast.error("接続テストに失敗しました");
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
        <h1 className="text-2xl font-bold tracking-tight">決済設定</h1>
        <p className="text-muted-foreground">
          Stripeを使用した決済機能を設定します
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>接続状態</CardTitle>
                <CardDescription>Stripeとの接続状態</CardDescription>
              </div>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "接続済み" : "未接続"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <CreditCard className="h-5 w-5" />
              <span>
                {isConnected
                  ? "Stripeに接続されています"
                  : "Stripeアカウントを接続して決済を受け付けましょう"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook URL</CardTitle>
            <CardDescription>
              Stripeダッシュボードの「Webhooks」設定に以下のURLを登録してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopyWebhook}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              受信するイベント: payment_intent.succeeded, customer.subscription.created/updated/deleted, invoice.payment_failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API設定</CardTitle>
            <CardDescription>
              StripeダッシュボードからAPIキーを取得して入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publishableKey">Publishable Key</Label>
              <Input
                id="publishableKey"
                placeholder="pk_live_..."
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                クライアント側で使用する公開キー
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                placeholder="sk_live_..."
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                サーバー側で使用する秘密キー（絶対に公開しないでください）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Webhook Signing Secret</Label>
              <Input
                id="webhookSecret"
                type="password"
                placeholder="whsec_..."
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Webhook登録後に表示される署名シークレット
              </p>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "保存中..." : "保存"}
              </Button>
              <Button
                variant="outline"
                onClick={handleConnectionTest}
                disabled={isTesting || !secretKey}
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
                  href="https://dashboard.stripe.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  Stripeダッシュボード
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
                にログイン
              </li>
              <li>「開発者」→「APIキー」からPublishable KeyとSecret Keyを取得</li>
              <li>「開発者」→「Webhooks」→「エンドポイントを追加」</li>
              <li>上記のWebhook URLを登録</li>
              <li>受信するイベントを選択して保存</li>
              <li>表示されるSigning Secretをコピー</li>
              <li>上記フォームに入力して保存</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
