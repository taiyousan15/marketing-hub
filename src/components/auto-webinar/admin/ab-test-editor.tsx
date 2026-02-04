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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
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
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  Trophy,
  Trash2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface Variant {
  id: string;
  name: string;
  isControl: boolean;
  title: string | null;
  offerDescription: string | null;
  buttonText: string | null;
  weight: number;
  impressions: number;
  clicks: number;
  conversions: number;
  clickRate: number | null;
  conversionRate: number | null;
}

interface ABTest {
  id: string;
  offerId: string;
  name: string;
  description: string | null;
  status: "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED";
  algorithm: string;
  confidenceLevel: number;
  autoOptimize: boolean;
  winnerId: string | null;
  variants: Variant[];
  analysis?: {
    isSignificant: boolean;
    pValue: number | null;
    improvement: number | null;
    winner: Variant | null;
  };
}

interface Offer {
  id: string;
  title: string;
  buttonText: string;
  appearAtSeconds: number;
}

interface ABTestEditorProps {
  webinarId: string;
}

const STATUS_CONFIG = {
  DRAFT: { label: "下書き", color: "secondary" as const },
  RUNNING: { label: "実行中", color: "default" as const },
  PAUSED: { label: "一時停止", color: "outline" as const },
  COMPLETED: { label: "完了", color: "default" as const },
};

const ALGORITHM_OPTIONS = [
  { value: "RANDOM", label: "均等ランダム", description: "各バリアントに均等に割り当て" },
  { value: "EPSILON_GREEDY", label: "ε-Greedy", description: "90%最良、10%探索" },
  { value: "THOMPSON_SAMPLING", label: "Thompson Sampling", description: "ベイズ最適化" },
  { value: "UCB1", label: "UCB1", description: "信頼区間ベース" },
];

export function ABTestEditor({ webinarId }: ABTestEditorProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<ABTest | null>(null);

  // フォーム状態
  const [formData, setFormData] = useState({
    offerId: "",
    name: "",
    description: "",
    algorithm: "RANDOM",
    confidenceLevel: 0.95,
    minSampleSize: 100,
    autoOptimize: false,
    variantTitle: "",
    variantButtonText: "",
  });

  useEffect(() => {
    fetchData();
  }, [webinarId]);

  const fetchData = async () => {
    try {
      const [testsRes, offersRes] = await Promise.all([
        fetch(`/api/auto-webinars/${webinarId}/ab-tests`),
        fetch(`/api/auto-webinars/${webinarId}/offers`),
      ]);

      const testsData = await testsRes.json();
      const offersData = await offersRes.json();

      setTests(testsData.tests || []);
      setOffers(offersData.offers || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      offerId: "",
      name: "",
      description: "",
      algorithm: "RANDOM",
      confidenceLevel: 0.95,
      minSampleSize: 100,
      autoOptimize: false,
      variantTitle: "",
      variantButtonText: "",
    });
    setEditingTest(null);
  };

  const handleCreate = async () => {
    try {
      const res = await fetch(`/api/auto-webinars/${webinarId}/ab-tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: formData.offerId,
          name: formData.name,
          description: formData.description,
          algorithm: formData.algorithm,
          confidenceLevel: formData.confidenceLevel,
          minSampleSize: formData.minSampleSize,
          autoOptimize: formData.autoOptimize,
          variants: formData.variantTitle
            ? [
                {
                  name: "B",
                  title: formData.variantTitle,
                  buttonText: formData.variantButtonText,
                },
              ]
            : [],
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "作成に失敗しました");
        return;
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Failed to create test:", error);
    }
  };

  const handleAction = async (testId: string, action: "start" | "pause" | "complete", winnerId?: string) => {
    try {
      await fetch(`/api/auto-webinars/${webinarId}/ab-tests`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId, action, winnerId }),
      });
      fetchData();
    } catch (error) {
      console.error("Failed to update test:", error);
    }
  };

  const handleDelete = async (testId: string) => {
    if (!confirm("このA/Bテストを削除しますか？")) return;

    try {
      await fetch(`/api/auto-webinars/${webinarId}/ab-tests?testId=${testId}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to delete test:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getOfferTitle = (offerId: string) => {
    const offer = offers.find((o) => o.id === offerId);
    return offer ? `${offer.title} (${formatTime(offer.appearAtSeconds)})` : offerId;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FlaskConical className="w-5 h-5" />
            A/Bテスト
          </h3>
          <p className="text-sm text-muted-foreground">
            オファーの複数パターンをテストして最適化
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新規テスト
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>A/Bテストを作成</DialogTitle>
              <DialogDescription>
                オファーの異なるバージョンをテストします
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>対象オファー</Label>
                <Select
                  value={formData.offerId}
                  onValueChange={(v) => setFormData({ ...formData, offerId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="オファーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {offers.map((offer) => (
                      <SelectItem key={offer.id} value={offer.id}>
                        {offer.title} ({formatTime(offer.appearAtSeconds)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>テスト名</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例: ボタンテキスト比較"
                />
              </div>

              <div className="space-y-2">
                <Label>アルゴリズム</Label>
                <Select
                  value={formData.algorithm}
                  onValueChange={(v) => setFormData({ ...formData, algorithm: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALGORITHM_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div>
                          <div>{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4 space-y-4">
                <Label className="text-base font-medium">バリアントB（変更版）</Label>
                <div className="space-y-2">
                  <Label>タイトル</Label>
                  <Input
                    value={formData.variantTitle}
                    onChange={(e) => setFormData({ ...formData, variantTitle: e.target.value })}
                    placeholder="新しいタイトル（空欄で元のまま）"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ボタンテキスト</Label>
                  <Input
                    value={formData.variantButtonText}
                    onChange={(e) => setFormData({ ...formData, variantButtonText: e.target.value })}
                    placeholder="新しいボタンテキスト（空欄で元のまま）"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>自動最適化</Label>
                  <p className="text-xs text-muted-foreground">
                    統計的有意性が出たら自動で勝者を適用
                  </p>
                </div>
                <Switch
                  checked={formData.autoOptimize}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoOptimize: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreate} disabled={!formData.offerId || !formData.name}>
                作成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>A/Bテストがありません</p>
            <p className="text-sm">「新規テスト」からオファーのテストを開始</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {test.name}
                      <Badge variant={STATUS_CONFIG[test.status].color}>
                        {STATUS_CONFIG[test.status].label}
                      </Badge>
                      {test.analysis?.isSignificant && (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          有意差あり
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{getOfferTitle(test.offerId)}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {test.status === "DRAFT" && (
                      <Button size="sm" onClick={() => handleAction(test.id, "start")}>
                        <Play className="w-4 h-4 mr-1" />
                        開始
                      </Button>
                    )}
                    {test.status === "RUNNING" && (
                      <Button size="sm" variant="outline" onClick={() => handleAction(test.id, "pause")}>
                        <Pause className="w-4 h-4 mr-1" />
                        停止
                      </Button>
                    )}
                    {test.status === "PAUSED" && (
                      <Button size="sm" onClick={() => handleAction(test.id, "start")}>
                        <Play className="w-4 h-4 mr-1" />
                        再開
                      </Button>
                    )}
                    {(test.status === "DRAFT" || test.status === "PAUSED") && (
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(test.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>バリアント</TableHead>
                      <TableHead className="text-right">表示</TableHead>
                      <TableHead className="text-right">クリック</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">CV</TableHead>
                      <TableHead className="text-right">CVR</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {test.variants.map((variant) => {
                      const isWinner = test.winnerId === variant.id;
                      const isBest =
                        test.analysis?.winner?.id === variant.id && !test.winnerId;

                      return (
                        <TableRow key={variant.id} className={isWinner ? "bg-green-50" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{variant.name}</span>
                              {variant.isControl && (
                                <Badge variant="outline" className="text-xs">コントロール</Badge>
                              )}
                              {isWinner && (
                                <Badge className="bg-green-600">
                                  <Trophy className="w-3 h-3 mr-1" />
                                  勝者
                                </Badge>
                              )}
                              {isBest && !isWinner && (
                                <Badge variant="secondary">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  リード
                                </Badge>
                              )}
                            </div>
                            {variant.title && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {variant.title}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {variant.impressions.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {variant.clicks.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {variant.clickRate !== null
                              ? `${(variant.clickRate * 100).toFixed(1)}%`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {variant.conversions.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {variant.conversionRate !== null
                              ? `${(variant.conversionRate * 100).toFixed(2)}%`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {test.status === "RUNNING" && !test.winnerId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAction(test.id, "complete", variant.id)}
                              >
                                <Trophy className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {test.analysis && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-muted-foreground">p値: </span>
                        <span className="font-mono">
                          {test.analysis.pValue !== null
                            ? test.analysis.pValue.toFixed(4)
                            : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">信頼水準: </span>
                        <span className="font-mono">{(test.confidenceLevel * 100).toFixed(0)}%</span>
                      </div>
                      {test.analysis.improvement !== null && test.analysis.improvement > 0 && (
                        <div className="flex items-center text-green-600">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          <span>+{test.analysis.improvement.toFixed(1)}% 改善</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
