"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Edit,
  Gift,
  Clock,
  MessageSquare,
  Download,
  Mail,
  Tag,
  Sparkles,
  GripVertical,
} from "lucide-react";
import { formatSeconds } from "@/lib/auto-webinar/rewards";

interface InputField {
  name: string;
  type: "text" | "email" | "tel" | "select";
  label: string;
  required: boolean;
  placeholder?: string;
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  rewardType: string;
  watchTimeSeconds: number | null;
  triggerKeywords: string[] | null;
  appearAtSeconds: number | null;
  inputDeadlineSeconds: number | null;
  inputFields: InputField[] | null;
  deliveryType: string;
  downloadUrl: string | null;
  couponCode: string | null;
  popupTitle: string | null;
  popupDescription: string | null;
  popupButtonText: string;
  popupPosition: string;
  maxClaims: number | null;
  currentClaims: number;
  isActive: boolean;
  order: number;
  _count: { claims: number };
}

interface RewardEditorProps {
  webinarId: string;
  videoDuration: number;
}

const REWARD_TYPES = [
  { value: "WATCH_TIME", label: "視聴時間達成", icon: Clock, description: "指定時間視聴で特典" },
  { value: "KEYWORD", label: "キーワード入力", icon: MessageSquare, description: "特定キーワード入力で特典" },
  { value: "TIMED_INPUT", label: "期間限定入力", icon: Sparkles, description: "制限時間内の入力で特典" },
];

const DELIVERY_TYPES = [
  { value: "DOWNLOAD", label: "ダウンロード", icon: Download },
  { value: "EMAIL", label: "メール送信", icon: Mail },
  { value: "LINE", label: "LINE送信", icon: MessageSquare },
  { value: "COUPON", label: "クーポン", icon: Gift },
  { value: "TAG_ADD", label: "タグ付与", icon: Tag },
];

export function RewardEditor({ webinarId, videoDuration }: RewardEditorProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // フォーム状態
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    rewardType: string;
    watchTimeSeconds: number;
    triggerKeywords: string;
    appearAtSeconds: number;
    inputDeadlineSeconds: number;
    inputFields: InputField[];
    deliveryType: string;
    downloadUrl: string;
    couponCode: string;
    popupTitle: string;
    popupDescription: string;
    popupButtonText: string;
    popupPosition: string;
    maxClaims: number | null;
    isActive: boolean;
  }>({
    name: "",
    description: "",
    rewardType: "WATCH_TIME",
    watchTimeSeconds: Math.floor(videoDuration * 0.5),
    triggerKeywords: "",
    appearAtSeconds: Math.floor(videoDuration * 0.6),
    inputDeadlineSeconds: 180,
    inputFields: [{ name: "email", type: "email", label: "メールアドレス", required: true, placeholder: "" }],
    deliveryType: "DOWNLOAD",
    downloadUrl: "",
    couponCode: "",
    popupTitle: "",
    popupDescription: "",
    popupButtonText: "特典を受け取る",
    popupPosition: "center",
    maxClaims: null,
    isActive: true,
  });

  useEffect(() => {
    fetchRewards();
  }, [webinarId]);

  const fetchRewards = async () => {
    try {
      const res = await fetch(`/api/auto-webinars/${webinarId}/rewards`);
      const data = await res.json();
      setRewards(data.rewards || []);
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      rewardType: "WATCH_TIME",
      watchTimeSeconds: Math.floor(videoDuration * 0.5),
      triggerKeywords: "",
      appearAtSeconds: Math.floor(videoDuration * 0.6),
      inputDeadlineSeconds: 180,
      inputFields: [{ name: "email", type: "email", label: "メールアドレス", required: true, placeholder: "" }],
      deliveryType: "DOWNLOAD",
      downloadUrl: "",
      couponCode: "",
      popupTitle: "",
      popupDescription: "",
      popupButtonText: "特典を受け取る",
      popupPosition: "center",
      maxClaims: null,
      isActive: true,
    });
    setEditingReward(null);
  };

  const openEditDialog = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description || "",
      rewardType: reward.rewardType,
      watchTimeSeconds: reward.watchTimeSeconds || Math.floor(videoDuration * 0.5),
      triggerKeywords: (reward.triggerKeywords || []).join(", "),
      appearAtSeconds: reward.appearAtSeconds || Math.floor(videoDuration * 0.6),
      inputDeadlineSeconds: reward.inputDeadlineSeconds || 180,
      inputFields: reward.inputFields || [{ name: "email", type: "email", label: "メールアドレス", required: true, placeholder: "" }],
      deliveryType: reward.deliveryType,
      downloadUrl: reward.downloadUrl || "",
      couponCode: reward.couponCode || "",
      popupTitle: reward.popupTitle || "",
      popupDescription: reward.popupDescription || "",
      popupButtonText: reward.popupButtonText,
      popupPosition: reward.popupPosition,
      maxClaims: reward.maxClaims,
      isActive: reward.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        triggerKeywords: formData.triggerKeywords
          ? formData.triggerKeywords.split(",").map(k => k.trim()).filter(Boolean)
          : null,
        watchTimeSeconds: formData.rewardType === "WATCH_TIME" ? formData.watchTimeSeconds : null,
        appearAtSeconds: formData.rewardType === "TIMED_INPUT" ? formData.appearAtSeconds : null,
        inputDeadlineSeconds: formData.rewardType === "TIMED_INPUT" ? formData.inputDeadlineSeconds : null,
        inputFields: formData.rewardType === "TIMED_INPUT" ? formData.inputFields : null,
      };

      if (editingReward) {
        // 更新
        await fetch(`/api/auto-webinars/${webinarId}/rewards`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rewardId: editingReward.id, ...payload }),
        });
      } else {
        // 新規作成
        await fetch(`/api/auto-webinars/${webinarId}/rewards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchRewards();
    } catch (error) {
      console.error("Failed to save reward:", error);
    }
  };

  const handleDelete = async (rewardId: string) => {
    if (!confirm("この特典を削除しますか？")) return;

    try {
      await fetch(`/api/auto-webinars/${webinarId}/rewards?rewardId=${rewardId}`, {
        method: "DELETE",
      });
      fetchRewards();
    } catch (error) {
      console.error("Failed to delete reward:", error);
    }
  };

  const toggleActive = async (reward: Reward) => {
    try {
      await fetch(`/api/auto-webinars/${webinarId}/rewards`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id, isActive: !reward.isActive }),
      });
      fetchRewards();
    } catch (error) {
      console.error("Failed to toggle reward:", error);
    }
  };

  const getRewardTypeIcon = (type: string) => {
    const config = REWARD_TYPES.find(t => t.value === type);
    return config ? <config.icon className="w-4 h-4" /> : <Gift className="w-4 h-4" />;
  };

  const getRewardTypeLabel = (type: string) => {
    const config = REWARD_TYPES.find(t => t.value === type);
    return config?.label || type;
  };

  const getDeliveryTypeLabel = (type: string) => {
    const config = DELIVERY_TYPES.find(t => t.value === type);
    return config?.label || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">特典設定</h3>
          <p className="text-sm text-muted-foreground">
            視聴者に提供する特典を設定します
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              特典を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReward ? "特典を編集" : "新しい特典を追加"}
              </DialogTitle>
              <DialogDescription>
                視聴者に提供する特典の条件と内容を設定します
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* 基本情報 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>特典名</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例: 50%視聴達成特典"
                  />
                </div>

                <div className="space-y-2">
                  <Label>説明（任意）</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="特典の説明"
                  />
                </div>
              </div>

              {/* トリガー条件 */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">トリガー条件</Label>

                <div className="grid grid-cols-3 gap-4">
                  {REWARD_TYPES.map((type) => (
                    <Card
                      key={type.value}
                      className={`cursor-pointer transition-all ${
                        formData.rewardType === type.value
                          ? "border-primary ring-2 ring-primary/20"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, rewardType: type.value }))}
                    >
                      <CardContent className="p-4 text-center">
                        <type.icon className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-medium text-sm">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 視聴時間設定 */}
                {formData.rewardType === "WATCH_TIME" && (
                  <div className="space-y-2">
                    <Label>達成時間（秒）</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        value={formData.watchTimeSeconds}
                        onChange={(e) => setFormData(prev => ({ ...prev, watchTimeSeconds: parseInt(e.target.value) || 0 }))}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">
                        = {formatSeconds(formData.watchTimeSeconds)} （動画の{Math.round((formData.watchTimeSeconds / videoDuration) * 100)}%）
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[0.25, 0.5, 0.75, 1.0].map((percent) => (
                        <Button
                          key={percent}
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, watchTimeSeconds: Math.floor(videoDuration * percent) }))}
                        >
                          {Math.round(percent * 100)}%
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* キーワード設定 */}
                {formData.rewardType === "KEYWORD" && (
                  <div className="space-y-2">
                    <Label>トリガーキーワード（カンマ区切り）</Label>
                    <Input
                      value={formData.triggerKeywords}
                      onChange={(e) => setFormData(prev => ({ ...prev, triggerKeywords: e.target.value }))}
                      placeholder="例: 特典, プレゼント, ABC"
                    />
                    <p className="text-xs text-muted-foreground">
                      チャットでこれらのキーワードが入力されると特典が付与されます
                    </p>
                  </div>
                )}

                {/* 期間限定入力設定 */}
                {formData.rewardType === "TIMED_INPUT" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>表示開始（秒）</Label>
                        <Input
                          type="number"
                          value={formData.appearAtSeconds}
                          onChange={(e) => setFormData(prev => ({ ...prev, appearAtSeconds: parseInt(e.target.value) || 0 }))}
                        />
                        <span className="text-xs text-muted-foreground">
                          = {formatSeconds(formData.appearAtSeconds)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Label>制限時間（秒）</Label>
                        <Input
                          type="number"
                          value={formData.inputDeadlineSeconds}
                          onChange={(e) => setFormData(prev => ({ ...prev, inputDeadlineSeconds: parseInt(e.target.value) || 60 }))}
                        />
                        <span className="text-xs text-muted-foreground">
                          = {formatSeconds(formData.inputDeadlineSeconds)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>入力フィールド</Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.inputFields[0]?.type || "email"}
                          onValueChange={(value) =>
                            setFormData(prev => ({
                              ...prev,
                              inputFields: [{ ...prev.inputFields[0], type: value as "email" | "text" | "tel" }]
                            }))
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">メールアドレス</SelectItem>
                            <SelectItem value="text">テキスト</SelectItem>
                            <SelectItem value="tel">電話番号</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={formData.inputFields[0]?.label || ""}
                          onChange={(e) =>
                            setFormData(prev => ({
                              ...prev,
                              inputFields: [{ ...prev.inputFields[0], label: e.target.value }]
                            }))
                          }
                          placeholder="ラベル"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 配布方法 */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">配布方法</Label>

                <Select
                  value={formData.deliveryType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, deliveryType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {formData.deliveryType === "DOWNLOAD" && (
                  <div className="space-y-2">
                    <Label>ダウンロードURL</Label>
                    <Input
                      value={formData.downloadUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, downloadUrl: e.target.value }))}
                      placeholder="https://example.com/file.pdf"
                    />
                  </div>
                )}

                {formData.deliveryType === "COUPON" && (
                  <div className="space-y-2">
                    <Label>クーポンコード</Label>
                    <Input
                      value={formData.couponCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value }))}
                      placeholder="WEBINAR2026"
                    />
                  </div>
                )}
              </div>

              {/* ポップアップ設定 */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">ポップアップ表示</Label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>タイトル</Label>
                    <Input
                      value={formData.popupTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, popupTitle: e.target.value }))}
                      placeholder="おめでとうございます！"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ボタンテキスト</Label>
                    <Input
                      value={formData.popupButtonText}
                      onChange={(e) => setFormData(prev => ({ ...prev, popupButtonText: e.target.value }))}
                      placeholder="特典を受け取る"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>説明文</Label>
                  <Textarea
                    value={formData.popupDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, popupDescription: e.target.value }))}
                    placeholder="特典の説明やダウンロードURLなど"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>表示位置</Label>
                    <Select
                      value={formData.popupPosition}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, popupPosition: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">中央（モーダル）</SelectItem>
                        <SelectItem value="bottom-right">右下</SelectItem>
                        <SelectItem value="bottom-left">左下</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>最大獲得数（空欄=無制限）</Label>
                    <Input
                      type="number"
                      value={formData.maxClaims || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxClaims: e.target.value ? parseInt(e.target.value) : null }))}
                      placeholder="無制限"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>有効にする</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSave} disabled={!formData.name}>
                {editingReward ? "更新" : "作成"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 特典一覧 */}
      {rewards.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>特典がまだ設定されていません</p>
            <p className="text-sm">「特典を追加」ボタンから追加してください</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>特典名</TableHead>
                <TableHead>タイプ</TableHead>
                <TableHead>条件</TableHead>
                <TableHead>配布方法</TableHead>
                <TableHead className="text-center">獲得数</TableHead>
                <TableHead className="text-center">状態</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewards.map((reward) => (
                <TableRow key={reward.id}>
                  <TableCell>
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  </TableCell>
                  <TableCell className="font-medium">{reward.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRewardTypeIcon(reward.rewardType)}
                      <span className="text-sm">{getRewardTypeLabel(reward.rewardType)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {reward.rewardType === "WATCH_TIME" && reward.watchTimeSeconds && (
                      <span>{formatSeconds(reward.watchTimeSeconds)} 視聴</span>
                    )}
                    {reward.rewardType === "KEYWORD" && reward.triggerKeywords && (
                      <span>「{(reward.triggerKeywords as string[]).join("」「")}」</span>
                    )}
                    {reward.rewardType === "TIMED_INPUT" && reward.inputDeadlineSeconds && (
                      <span>{formatSeconds(reward.inputDeadlineSeconds)} 以内</span>
                    )}
                  </TableCell>
                  <TableCell>{getDeliveryTypeLabel(reward.deliveryType)}</TableCell>
                  <TableCell className="text-center">
                    {reward._count.claims}
                    {reward.maxClaims && <span className="text-muted-foreground">/{reward.maxClaims}</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={reward.isActive}
                      onCheckedChange={() => toggleActive(reward)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(reward)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(reward.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
