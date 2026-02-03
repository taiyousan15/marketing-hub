"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneInput, toE164 } from "@/components/ui/phone-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Play, User, Mail, Phone, MessageSquare } from "lucide-react";

interface ScheduleOption {
  value: string;
  label: string;
}

interface RegistrationFormProps {
  webinar: {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    videoDuration: number;
    scheduleType: string;
  };
  availableTimes: string[];
  isJustInTime: boolean;
  isOnDemand: boolean;
  contactId?: string;  // 既にログインしている場合
}

export function RegistrationForm({
  webinar,
  availableTimes,
  isJustInTime,
  isOnDemand,
  contactId,
}: RegistrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "sms">("email");
  const [selectedTime, setSelectedTime] = useState<string>(
    availableTimes[0] || ""
  );
  const [phoneError, setPhoneError] = useState<string>("");

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}時間${m}分`;
    return `${m}分`;
  };

  const formatScheduleOption = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `今から${diffMins}分後`;
    }

    return date.toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const validatePhone = (phoneValue: string): boolean => {
    const digits = phoneValue.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) {
      setPhoneError("有効な電話番号を入力してください");
      return false;
    }
    if (!["070", "080", "090"].some(prefix => digits.startsWith(prefix))) {
      setPhoneError("携帯電話番号（070/080/090）を入力してください");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // SMS選択時は電話番号バリデーション
    if (!contactId && contactMethod === "sms" && !validatePhone(phone)) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/auto-webinars/${webinar.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          email: contactId ? undefined : (contactMethod === "email" ? email : undefined),
          phone: contactId ? undefined : (contactMethod === "sms" ? toE164(phone) : undefined),
          name: contactId ? undefined : name,
          contactMethod: contactId ? undefined : contactMethod,
          selectedTime: isJustInTime || isOnDemand ? undefined : selectedTime,
        }),
      });

      if (!res.ok) {
        throw new Error("Registration failed");
      }

      const data = await res.json();

      // 登録成功後、視聴ページへリダイレクト
      router.push(`/webinar/${webinar.id}/watch?registrationId=${data.registration.id}`);
    } catch (error) {
      console.error("Registration failed:", error);
      alert("登録に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        {webinar.thumbnail && (
          <div className="relative w-full h-48 bg-slate-200 rounded-t-lg overflow-hidden">
            <img
              src={webinar.thumbnail}
              alt={webinar.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <div className="flex items-center gap-2 text-white text-sm">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(webinar.videoDuration)}</span>
              </div>
            </div>
          </div>
        )}

        <CardHeader>
          <CardTitle>{webinar.title}</CardTitle>
          {webinar.description && (
            <CardDescription>{webinar.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!contactId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">お名前</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="山田 太郎"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>連絡先</Label>
                  <Tabs
                    value={contactMethod}
                    onValueChange={(v) => setContactMethod(v as "email" | "sms")}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="email" className="gap-2">
                        <Mail className="w-4 h-4" />
                        メール
                      </TabsTrigger>
                      <TabsTrigger value="sms" className="gap-2">
                        <MessageSquare className="w-4 h-4" />
                        SMS
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="email" className="mt-3">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="example@email.com"
                          className="pl-10"
                          required={contactMethod === "email"}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="sms" className="mt-3">
                      <PhoneInput
                        value={phone}
                        onChange={(v) => {
                          setPhone(v);
                          setPhoneError("");
                        }}
                        error={phoneError}
                        required={contactMethod === "sms"}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        SMSでリマインダーをお届けします
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}

            {!isJustInTime && !isOnDemand && availableTimes.length > 0 && (
              <div className="space-y-2">
                <Label>参加日時を選択</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="日時を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {formatScheduleOption(time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isJustInTime && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm">
                  <strong>Just-In-Time配信</strong><br />
                  登録後すぐにウェビナーが開始されます。
                </p>
              </div>
            )}

            {isOnDemand && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm">
                  <strong>オンデマンド視聴</strong><br />
                  いつでもお好きな時間に視聴できます。
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              <Play className="w-4 h-4 mr-2" />
              {loading ? "登録中..." : isOnDemand ? "今すぐ視聴する" : "ウェビナーに登録する"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              登録することで、利用規約とプライバシーポリシーに同意したものとみなされます。
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
