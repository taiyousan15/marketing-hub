"use client";

import { useState } from "react";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

const COMMISSION_TIERS = [
  { rank: "STANDARD", rate: "10%", description: "スタンダードパートナー" },
  { rank: "SILVER", rate: "12%", description: "シルバーパートナー" },
  { rank: "GOLD", rate: "15%", description: "ゴールドパートナー" },
  { rank: "VIP", rate: "20%", description: "VIPパートナー（招待制）" },
];

const formSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  channelType: z.string().min(1, "チャンネル種別を選択してください"),
});

type FormData = z.infer<typeof formSchema>;

const DEFAULT_FORM: FormData = { name: "", email: "", channelType: "" };

export default function AffiliateJoinPage() {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const errors: Partial<Record<keyof FormData, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof FormData;
        errors[key] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      const tenantId = new URLSearchParams(window.location.search).get("tenantId") ?? "";
      const res = await fetch(`/api/affiliate/join?tenantId=${encodeURIComponent(tenantId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "登録に失敗しました");
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("Join form submit error:", err);
      toast.error("登録に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">申請を受け付けました</h2>
            <p className="text-muted-foreground">
              ご登録ありがとうございます。審査完了後、メールにてご連絡いたします。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-12">
        {/* ヒーロー */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            パートナーとして収益化しませんか？
          </h1>
          <p className="text-xl text-gray-600">
            あなたのネットワークを活かして、紹介報酬を獲得しましょう
          </p>
        </div>

        {/* コミッション率テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>報酬プログラム</CardTitle>
            <CardDescription>成果に応じてランクアップし、より高い報酬を獲得できます</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {COMMISSION_TIERS.map((tier) => (
                <div
                  key={tier.rank}
                  className="flex items-center justify-between p-4 rounded-lg border bg-white"
                >
                  <div>
                    <div className="font-semibold">{tier.description}</div>
                    <div className="text-sm text-muted-foreground">{tier.rank}</div>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">{tier.rate}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              ※ ランクは成約実績に応じて自動昇格します。VIPは招待制です。
            </p>
          </CardContent>
        </Card>

        {/* 登録フォーム */}
        <Card>
          <CardHeader>
            <CardTitle>パートナー登録申請</CardTitle>
            <CardDescription>
              下記フォームにご記入ください。審査後、メールにてご連絡いたします。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">お名前</Label>
                <Input
                  id="name"
                  placeholder="山田太郎"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {fieldErrors.name && (
                  <p className="text-sm text-destructive">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {fieldErrors.email && (
                  <p className="text-sm text-destructive">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="channelType">主な集客チャンネル</Label>
                <Select
                  value={form.channelType}
                  onValueChange={(v) => setForm({ ...form, channelType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SNS">SNS（Twitter/Instagram等）</SelectItem>
                    <SelectItem value="BLOG">ブログ・Webサイト</SelectItem>
                    <SelectItem value="YOUTUBE">YouTube</SelectItem>
                    <SelectItem value="LINE">LINE</SelectItem>
                    <SelectItem value="EMAIL">メールマーケティング</SelectItem>
                    <SelectItem value="OTHER">その他</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.channelType && (
                  <p className="text-sm text-destructive">{fieldErrors.channelType}</p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "送信中..." : "今すぐパートナー登録を申請する"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
