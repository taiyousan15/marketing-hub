"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Gift, Download, Mail, Clock, Check, Loader2 } from "lucide-react";

interface InputField {
  name: string;
  type: "text" | "email" | "tel" | "select";
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface RewardDefinition {
  id: string;
  name: string;
  rewardType: "WATCH_TIME" | "KEYWORD" | "TIMED_INPUT" | "POLL_ANSWER" | "QUIZ_CORRECT";
  watchTimeSeconds: number | null;
  inputDeadlineSeconds: number | null;
  inputFields: InputField[] | null;
  deliveryType: string;
  popupTitle: string | null;
  popupDescription: string | null;
  popupButtonText: string;
  popupPosition: string;
}

interface RewardPopupProps {
  reward: RewardDefinition;
  currentSeconds: number;
  watchedSeconds: number;
  sessionToken: string;
  onClaim: (rewardId: string, inputData?: Record<string, string>) => Promise<{ success: boolean; data?: any }>;
  onClose: () => void;
}

export function RewardPopup({
  reward,
  currentSeconds,
  watchedSeconds,
  sessionToken,
  onClaim,
  onClose,
}: RewardPopupProps) {
  const [inputData, setInputData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [deliveryData, setDeliveryData] = useState<any>(null);

  // 期間限定カウントダウン
  useEffect(() => {
    if (reward.rewardType === "TIMED_INPUT" && reward.inputDeadlineSeconds) {
      // appearAtSecondsから経過した時間を計算
      const startSeconds = (reward as any).appearAtSeconds || 0;
      const elapsed = currentSeconds - startSeconds;
      const remaining = reward.inputDeadlineSeconds - elapsed;
      setCountdown(Math.max(0, remaining));
    }
  }, [reward, currentSeconds]);

  // カウントダウン更新
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onClose]);

  const handleInputChange = (name: string, value: string) => {
    setInputData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!reward.inputFields) return true;

    const newErrors: Record<string, string> = {};
    for (const field of reward.inputFields) {
      const value = inputData[field.name]?.trim() || "";

      if (field.required && !value) {
        newErrors[field.name] = `${field.label}は必須です`;
        continue;
      }

      if (value) {
        switch (field.type) {
          case "email":
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              newErrors[field.name] = "有効なメールアドレスを入力してください";
            }
            break;
          case "tel":
            if (!/^[\d\-+() ]+$/.test(value)) {
              newErrors[field.name] = "有効な電話番号を入力してください";
            }
            break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reward.inputFields && !validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await onClaim(reward.id, inputData);
      if (result.success) {
        setClaimed(true);
        setDeliveryData(result.data);
      }
    } catch (error) {
      console.error("Failed to claim reward:", error);
    } finally {
      setLoading(false);
    }
  };

  const positionClasses = {
    center: "fixed inset-0 flex items-center justify-center bg-black/60 z-50",
    "bottom-right": "fixed bottom-4 right-4 z-50",
    "bottom-left": "fixed bottom-4 left-4 z-50",
  };

  const getIcon = () => {
    switch (reward.deliveryType) {
      case "DOWNLOAD":
        return <Download className="w-6 h-6" />;
      case "EMAIL":
        return <Mail className="w-6 h-6" />;
      default:
        return <Gift className="w-6 h-6" />;
    }
  };

  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // 獲得済み表示
  if (claimed) {
    return (
      <div className={positionClasses[reward.popupPosition as keyof typeof positionClasses] || positionClasses.center}>
        <Card className="max-w-md w-full mx-4 shadow-2xl border-2 border-green-500 animate-in fade-in zoom-in duration-300">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle>特典を獲得しました！</CardTitle>
            <CardDescription>{reward.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliveryData?.downloadUrl && (
              <Button asChild className="w-full" size="lg">
                <a href={deliveryData.downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  ダウンロード
                </a>
              </Button>
            )}
            {deliveryData?.couponCode && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">クーポンコード</p>
                <p className="text-2xl font-mono font-bold">{deliveryData.couponCode}</p>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={onClose}>
              閉じる
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={positionClasses[reward.popupPosition as keyof typeof positionClasses] || positionClasses.center}>
      <Card className="max-w-md w-full mx-4 shadow-2xl border-2 border-primary animate-in fade-in zoom-in duration-300">
        <CardHeader className="relative pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              {getIcon()}
            </div>
            <div>
              <div className="text-sm text-primary font-medium">🎁 特典プレゼント</div>
              <CardTitle className="text-lg">
                {reward.popupTitle || reward.name}
              </CardTitle>
            </div>
          </div>

          {countdown !== null && countdown > 0 && (
            <div className="mt-4 p-3 bg-destructive/10 rounded-lg flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-destructive animate-pulse" />
              <span className="text-destructive font-bold text-lg">
                残り {formatCountdown(countdown)}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {reward.popupDescription && (
              <p className="text-sm text-muted-foreground">
                {reward.popupDescription}
              </p>
            )}

            {/* 入力フィールド（TIMED_INPUT用） */}
            {reward.inputFields && reward.inputFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id={field.name}
                  type={field.type === "select" ? "text" : field.type}
                  placeholder={field.placeholder}
                  value={inputData[field.name] || ""}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={errors[field.name] ? "border-destructive" : ""}
                />
                {errors[field.name] && (
                  <p className="text-sm text-destructive">{errors[field.name]}</p>
                )}
              </div>
            ))}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || (countdown !== null && countdown <= 0)}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  {reward.popupButtonText}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * キーワード入力用ポップアップ
 */
interface KeywordRewardPopupProps {
  onSubmit: (keyword: string) => void;
  onClose: () => void;
}

export function KeywordInputPopup({ onSubmit, onClose }: KeywordRewardPopupProps) {
  const [keyword, setKeyword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSubmit(keyword.trim());
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-72 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">キーワード入力</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="キーワードを入力"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm">
              送信
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 視聴時間達成通知
 */
interface WatchTimeMilestoneProps {
  milestone: string;
  rewardName: string;
  onClaim: () => void;
  onDismiss: () => void;
}

export function WatchTimeMilestoneNotification({
  milestone,
  rewardName,
  onClaim,
  onDismiss,
}: WatchTimeMilestoneProps) {
  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-500">
      <Card className="w-80 shadow-lg border-2 border-primary">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{milestone} 視聴達成！</p>
              <p className="text-sm text-muted-foreground">{rewardName}をゲットできます</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={onClaim}>
                  受け取る
                </Button>
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  後で
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
