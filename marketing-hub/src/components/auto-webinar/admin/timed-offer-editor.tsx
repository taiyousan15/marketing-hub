"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Gift, Clock, ExternalLink, Edit } from "lucide-react";

interface TimedOffer {
  id: string;
  appearAtSeconds: number;
  hideAtSeconds: number | null;
  title: string;
  description: string | null;
  buttonText: string;
  buttonUrl: string;
  countdownEnabled: boolean;
  countdownSeconds: number | null;
  limitedSeats: number | null;
  clickCount: number;
  conversionCount: number;
}

interface TimedOfferEditorProps {
  webinarId: string;
  videoDuration: number;
}

export function TimedOfferEditor({
  webinarId,
  videoDuration,
}: TimedOfferEditorProps) {
  const [offers, setOffers] = useState<TimedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<TimedOffer | null>(null);
  const [formData, setFormData] = useState({
    appearAtSeconds: 0,
    hideAtSeconds: null as number | null,
    title: "",
    description: "",
    buttonText: "今すぐ申し込む",
    buttonUrl: "",
    countdownEnabled: false,
    countdownSeconds: null as number | null,
    limitedSeats: null as number | null,
  });

  useEffect(() => {
    fetchOffers();
  }, [webinarId]);

  const fetchOffers = async () => {
    try {
      const res = await fetch(`/api/auto-webinars/${webinarId}/offers`);
      const data = await res.json();
      setOffers(data.offers || []);
    } catch (error) {
      console.error("Failed to fetch offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      appearAtSeconds: 0,
      hideAtSeconds: null,
      title: "",
      description: "",
      buttonText: "今すぐ申し込む",
      buttonUrl: "",
      countdownEnabled: false,
      countdownSeconds: null,
      limitedSeats: null,
    });
    setEditingOffer(null);
  };

  const handleSave = async () => {
    try {
      if (editingOffer) {
        await fetch(`/api/auto-webinars/${webinarId}/offers`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offerId: editingOffer.id, ...formData }),
        });
      } else {
        await fetch(`/api/auto-webinars/${webinarId}/offers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setShowAddDialog(false);
      resetForm();
      fetchOffers();
    } catch (error) {
      console.error("Failed to save offer:", error);
    }
  };

  const handleEdit = (offer: TimedOffer) => {
    setFormData({
      appearAtSeconds: offer.appearAtSeconds,
      hideAtSeconds: offer.hideAtSeconds,
      title: offer.title,
      description: offer.description || "",
      buttonText: offer.buttonText,
      buttonUrl: offer.buttonUrl,
      countdownEnabled: offer.countdownEnabled,
      countdownSeconds: offer.countdownSeconds,
      limitedSeats: offer.limitedSeats,
    });
    setEditingOffer(offer);
    setShowAddDialog(true);
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm("このオファーを削除しますか？")) return;
    try {
      await fetch(`/api/auto-webinars/${webinarId}/offers?offerId=${offerId}`, {
        method: "DELETE",
      });
      fetchOffers();
    } catch (error) {
      console.error("Failed to delete offer:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const parseTime = (str: string): number => {
    const parts = str.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parseInt(str) || 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              タイムドオファー
            </CardTitle>
            <CardDescription>
              動画の特定のタイミングで表示されるオファー/CTAを設定します
            </CardDescription>
          </div>
          <Dialog
            open={showAddDialog}
            onOpenChange={(open) => {
              setShowAddDialog(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                オファーを追加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingOffer ? "オファーを編集" : "オファーを追加"}
                </DialogTitle>
                <DialogDescription>
                  視聴者に表示するオファーを設定します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>表示開始時間</Label>
                    <Input
                      value={formatTime(formData.appearAtSeconds)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          appearAtSeconds: parseTime(e.target.value),
                        })
                      }
                      placeholder="30:00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>表示終了時間（任意）</Label>
                    <Input
                      value={formData.hideAtSeconds ? formatTime(formData.hideAtSeconds) : ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hideAtSeconds: e.target.value ? parseTime(e.target.value) : null,
                        })
                      }
                      placeholder="最後まで表示"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>オファータイトル</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="今だけの特別オファー"
                  />
                </div>

                <div className="space-y-2">
                  <Label>説明文（任意）</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="オファーの詳細を入力"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ボタンテキスト</Label>
                    <Input
                      value={formData.buttonText}
                      onChange={(e) =>
                        setFormData({ ...formData, buttonText: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ボタンURL</Label>
                    <Input
                      value={formData.buttonUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, buttonUrl: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-medium">緊急性の演出</h4>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>カウントダウン</Label>
                      <p className="text-sm text-muted-foreground">
                        オファーの残り時間を表示
                      </p>
                    </div>
                    <Switch
                      checked={formData.countdownEnabled}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, countdownEnabled: checked })
                      }
                    />
                  </div>

                  {formData.countdownEnabled && (
                    <div className="space-y-2 pl-4 border-l-2">
                      <Label>カウントダウン時間（秒）</Label>
                      <Input
                        type="number"
                        value={formData.countdownSeconds || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            countdownSeconds: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                        placeholder="300（5分）"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>残り席数（任意）</Label>
                    <Input
                      type="number"
                      value={formData.limitedSeats || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          limitedSeats: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                      placeholder="限定表示しない場合は空欄"
                    />
                    <p className="text-xs text-muted-foreground">
                      「残り〇席」と表示されます
                    </p>
                  </div>
                </div>

                <Button onClick={handleSave} className="w-full">
                  {editingOffer ? "更新" : "追加"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {offers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>タイムドオファーがありません</p>
            <p className="text-sm mt-1">
              動画の特定タイミングでオファーを表示して成約率を高めましょう
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(offer.appearAtSeconds)}
                      {offer.hideAtSeconds && ` - ${formatTime(offer.hideAtSeconds)}`}
                    </span>
                    {offer.countdownEnabled && (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                        カウントダウン
                      </span>
                    )}
                    {offer.limitedSeats && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        残り{offer.limitedSeats}席
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium">{offer.title}</h4>
                  {offer.description && (
                    <p className="text-sm text-muted-foreground">
                      {offer.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <a
                      href={offer.buttonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      {offer.buttonText}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-muted-foreground">
                      クリック: {offer.clickCount} | 成約: {offer.conversionCount}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(offer)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(offer.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 text-sm text-muted-foreground">
          動画の長さ: {formatTime(videoDuration)}
        </div>
      </CardContent>
    </Card>
  );
}
