"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Gift,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TimedOffer {
  id: string;
  title: string;
  description: string | null;
  buttonText: string;
  buttonUrl: string | null;
  actionType: string;
  appearAtSeconds: number;
  hideAtSeconds: number | null;
  popupPosition: string;
  countdownEnabled: boolean;
  countdownSeconds: number | null;
  limitedSeats: number | null;
  liffId: string | null;
  surveyUrl: string | null;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  EXTERNAL_LINK: "外部リンク",
  LINE_FRIEND: "LINE友達追加",
  SURVEY: "アンケート",
  ANNOUNCEMENT: "お知らせ",
  EMAIL_FORM: "メール登録",
  STRIPE_CHECKOUT: "決済",
  DOWNLOAD: "ダウンロード",
  CUSTOM: "カスタム",
};

const POSITION_LABELS: Record<string, string> = {
  BOTTOM_RIGHT: "右下",
  BOTTOM_LEFT: "左下",
  CENTER: "中央",
};

function createEmptyOffer(): TimedOffer {
  return {
    id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    description: null,
    buttonText: "今すぐ申し込む",
    buttonUrl: null,
    actionType: "EXTERNAL_LINK",
    appearAtSeconds: 0,
    hideAtSeconds: null,
    popupPosition: "BOTTOM_RIGHT",
    countdownEnabled: false,
    countdownSeconds: null,
    limitedSeats: null,
    liffId: null,
    surveyUrl: null,
  };
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s > 0 ? `${s}秒` : ""}`;
}

interface LivestreamOfferPanelProps {
  livestreamId: string;
  eventId: string | null;
}

export function LivestreamOfferPanel({
  livestreamId,
  eventId,
}: LivestreamOfferPanelProps) {
  const [offers, setOffers] = useState<TimedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const routeId = eventId ?? livestreamId;

  const fetchOffers = useCallback(async () => {
    try {
      const res = await fetch(`/api/livestream/${routeId}/offers`);
      if (!res.ok) return;
      const data = await res.json();
      setOffers(Array.isArray(data.offers) ? data.offers : []);
    } catch (error) {
      console.error("Failed to fetch offers:", error);
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/livestream/${routeId}/offers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offers }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "保存失敗");
      }

      toast.success("オファーを保存しました");
      setEditingIndex(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const addOffer = () => {
    const newOffer = createEmptyOffer();
    setOffers((prev) => [...prev, newOffer]);
    setEditingIndex(offers.length);
  };

  const removeOffer = (index: number) => {
    setOffers((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const updateOffer = (index: number, updates: Partial<TimedOffer>) => {
    setOffers((prev) =>
      prev.map((offer, i) => (i === index ? { ...offer, ...updates } : offer))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            タイムドオファー ({offers.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addOffer}>
            <Plus className="h-3 w-3 mr-1" />
            追加
          </Button>
          {offers.length > 0 && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              保存
            </Button>
          )}
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          オファーがありません。配信中にポップアップを表示するにはオファーを追加してください。
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer, index) => (
            <div
              key={offer.id}
              className="border rounded-lg p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatSeconds(offer.appearAtSeconds)}
                    {offer.hideAtSeconds
                      ? ` 〜 ${formatSeconds(offer.hideAtSeconds)}`
                      : ""}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {ACTION_TYPE_LABELS[offer.actionType] ?? offer.actionType}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {POSITION_LABELS[offer.popupPosition] ?? offer.popupPosition}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEditingIndex(editingIndex === index ? null : index)
                    }
                  >
                    {editingIndex === index ? "閉じる" : "編集"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => removeOffer(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="text-sm font-medium">
                {offer.title || "(タイトル未設定)"}
              </div>

              {editingIndex === index && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">タイトル *</Label>
                      <Input
                        value={offer.title}
                        onChange={(e) =>
                          updateOffer(index, { title: e.target.value })
                        }
                        placeholder="特別オファー！"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ボタンテキスト</Label>
                      <Input
                        value={offer.buttonText}
                        onChange={(e) =>
                          updateOffer(index, { buttonText: e.target.value })
                        }
                        placeholder="今すぐ申し込む"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">説明</Label>
                    <Textarea
                      value={offer.description ?? ""}
                      onChange={(e) =>
                        updateOffer(index, {
                          description: e.target.value || null,
                        })
                      }
                      rows={2}
                      placeholder="オファーの説明文..."
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">アクションタイプ</Label>
                      <select
                        value={offer.actionType}
                        onChange={(e) =>
                          updateOffer(index, { actionType: e.target.value })
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      >
                        {Object.entries(ACTION_TYPE_LABELS).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ポジション</Label>
                      <select
                        value={offer.popupPosition}
                        onChange={(e) =>
                          updateOffer(index, { popupPosition: e.target.value })
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      >
                        {Object.entries(POSITION_LABELS).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ボタンURL</Label>
                      <Input
                        value={offer.buttonUrl ?? ""}
                        onChange={(e) =>
                          updateOffer(index, {
                            buttonUrl: e.target.value || null,
                          })
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">表示開始（秒）*</Label>
                      <Input
                        type="number"
                        min={0}
                        value={offer.appearAtSeconds}
                        onChange={(e) =>
                          updateOffer(index, {
                            appearAtSeconds: parseInt(e.target.value, 10) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">非表示（秒）</Label>
                      <Input
                        type="number"
                        min={0}
                        value={offer.hideAtSeconds ?? ""}
                        onChange={(e) =>
                          updateOffer(index, {
                            hideAtSeconds: e.target.value
                              ? parseInt(e.target.value, 10)
                              : null,
                          })
                        }
                        placeholder="なし（常時表示）"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">残り席数</Label>
                      <Input
                        type="number"
                        min={0}
                        value={offer.limitedSeats ?? ""}
                        onChange={(e) =>
                          updateOffer(index, {
                            limitedSeats: e.target.value
                              ? parseInt(e.target.value, 10)
                              : null,
                          })
                        }
                        placeholder="なし"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={offer.countdownEnabled}
                          onChange={(e) =>
                            updateOffer(index, {
                              countdownEnabled: e.target.checked,
                            })
                          }
                          className="h-4 w-4"
                        />
                        <span className="text-xs">カウントダウン</span>
                      </label>
                      {offer.countdownEnabled && (
                        <Input
                          type="number"
                          min={0}
                          value={offer.countdownSeconds ?? ""}
                          onChange={(e) =>
                            updateOffer(index, {
                              countdownSeconds: e.target.value
                                ? parseInt(e.target.value, 10)
                                : null,
                            })
                          }
                          placeholder="秒数"
                          className="w-24 h-7 text-xs"
                        />
                      )}
                    </div>
                  </div>

                  {offer.actionType === "LINE_FRIEND" && (
                    <div className="space-y-1">
                      <Label className="text-xs">LIFF ID</Label>
                      <Input
                        value={offer.liffId ?? ""}
                        onChange={(e) =>
                          updateOffer(index, {
                            liffId: e.target.value || null,
                          })
                        }
                        placeholder="1234567890-AbCdEfGh"
                      />
                    </div>
                  )}

                  {offer.actionType === "SURVEY" && (
                    <div className="space-y-1">
                      <Label className="text-xs">アンケートURL</Label>
                      <Input
                        value={offer.surveyUrl ?? ""}
                        onChange={(e) =>
                          updateOffer(index, {
                            surveyUrl: e.target.value || null,
                          })
                        }
                        placeholder="https://forms.google.com/..."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
