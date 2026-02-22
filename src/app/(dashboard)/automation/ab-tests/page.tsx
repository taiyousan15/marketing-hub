"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getABTests, createABTest, startABTest, endABTest, deleteABTest } from "@/actions/ab-test";
import { ABTestResults } from "@/components/ab-test/ab-test-results";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  FlaskConical,
  Plus,
  Play,
  Pause,
  Trophy,
  BarChart3,
  TrendingUp,
  Users,
  Percent,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Target
} from "lucide-react";

type TestStatus = "draft" | "running" | "paused" | "completed" | "winner_found";
type Algorithm = "epsilon_greedy" | "ucb1" | "thompson_sampling";

interface ABTest {
  id: string;
  name: string;
  status: TestStatus;
  algorithm: Algorithm;
  variants: {
    id: string;
    name: string;
    content: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
    isWinner?: boolean;
    isControl?: boolean;
  }[];
  startDate: Date;
  endDate?: Date;
  targetMetric: string;
  statisticalSignificance?: number;
  minSampleSize: number;
  currentSampleSize: number;
}

function formatDateJP(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

const ALGORITHM_LABEL_MAP: Record<string, Algorithm> = {
  EPSILON_GREEDY: 'epsilon_greedy',
  UCB1: 'ucb1',
  THOMPSON_SAMPLING: 'thompson_sampling',
  EQUAL_WEIGHT: 'thompson_sampling',
  RANDOM: 'epsilon_greedy',
};

const STATUS_MAP: Record<string, TestStatus> = {
  DRAFT: 'draft',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

export default function ABTestsPage() {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [newTestName, setNewTestName] = useState('');
  const [newTestAlgorithm, setNewTestAlgorithm] = useState<Algorithm>('thompson_sampling');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [tests, setTests] = useState<ABTest[]>([]);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getABTests();
      setTests(data.map((t) => ({
        id: t.id,
        name: t.name,
        status: (STATUS_MAP[t.status] ?? 'draft') as TestStatus,
        algorithm: (ALGORITHM_LABEL_MAP[t.algorithm] ?? 'thompson_sampling') as Algorithm,
        variants: t.variants.map((v) => ({
          id: v.id,
          name: v.name,
          content: v.name,
          impressions: 0,
          conversions: 0,
          conversionRate: 0,
        })),
        startDate: t.startedAt ?? t.createdAt,
        targetMetric: '開封率',
        minSampleSize: 1000,
        currentSampleSize: 0,
      })));
    } catch (error) {
      console.error('Failed to fetch AB tests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleCreateTest = async () => {
    if (!newTestName.trim()) {
      toast.error('テスト名を入力してください');
      return;
    }
    setCreating(true);
    try {
      await createABTest({
        name: newTestName,
        algorithm: newTestAlgorithm.toUpperCase().replace('-', '_') as import('@prisma/client').ABTestAlgorithm,
        variants: [
          { name: 'バリアントA（コントロール）', weight: 50 },
          { name: 'バリアントB', weight: 50 },
        ],
      });
      toast.success('A/Bテストを作成しました');
      setNewTestName('');
      await fetchTests();
    } catch (error) {
      console.error('Failed to create test:', error);
      toast.error('作成に失敗しました');
    } finally {
      setCreating(false);
    }
  };

  const handleStartTest = async (id: string) => {
    try {
      await startABTest(id);
      toast.success('テストを開始しました');
      await fetchTests();
    } catch (error) {
      console.error('Failed to start test:', error);
      toast.error('開始に失敗しました');
    }
  };

  const handleEndTest = async (id: string) => {
    try {
      await endABTest(id);
      toast.success('テストを終了しました');
      await fetchTests();
    } catch (error) {
      console.error('Failed to end test:', error);
      toast.error('終了に失敗しました');
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm('このテストを削除しますか？')) return;
    try {
      await deleteABTest(id);
      toast.success('テストを削除しました');
      await fetchTests();
    } catch (error) {
      console.error('Failed to delete test:', error);
      toast.error('削除に失敗しました');
    }
  };

  const selectedTest = selectedTestId ? tests.find(t => t.id === selectedTestId) : null;


  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const getStatusBadge = (status: TestStatus) => {
    const config: Record<TestStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      draft: { label: "下書き", variant: "outline", icon: <AlertCircle className="h-3 w-3" /> },
      running: { label: "実行中", variant: "default", icon: <Play className="h-3 w-3" /> },
      paused: { label: "一時停止", variant: "secondary", icon: <Pause className="h-3 w-3" /> },
      completed: { label: "完了", variant: "secondary", icon: <CheckCircle2 className="h-3 w-3" /> },
      winner_found: { label: "勝者決定", variant: "default", icon: <Trophy className="h-3 w-3" /> }
    };
    const { label, variant, icon } = config[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {label}
      </Badge>
    );
  };

  const getAlgorithmLabel = (algorithm: Algorithm) => {
    const labels: Record<Algorithm, string> = {
      epsilon_greedy: "ε-Greedy",
      ucb1: "UCB1",
      thompson_sampling: "Thompson Sampling"
    };
    return labels[algorithm];
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-8 w-8 text-emerald-500" />
            A/Bテスト最適化
          </h1>
          <p className="text-muted-foreground mt-1">
            Multi-Armed Banditアルゴリズムでコンバージョンを最大化
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新規テスト作成
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>新規A/Bテスト作成</DialogTitle>
              <DialogDescription>
                テストの詳細を設定してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>テスト名</Label>
                <Input
                  placeholder="例: ウェルカムメール件名テスト"
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>最適化アルゴリズム</Label>
                  <Select
                    value={newTestAlgorithm}
                    onValueChange={(v) => setNewTestAlgorithm(v as Algorithm)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="epsilon_greedy">ε-Greedy（探索重視）</SelectItem>
                      <SelectItem value="ucb1">UCB1（バランス型）</SelectItem>
                      <SelectItem value="thompson_sampling">Thompson Sampling（推奨）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>目標指標</Label>
                  <Select defaultValue="open_rate">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open_rate">開封率</SelectItem>
                      <SelectItem value="click_rate">クリック率</SelectItem>
                      <SelectItem value="conversion_rate">コンバージョン率</SelectItem>
                      <SelectItem value="revenue">売上</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>バリアントA（コントロール）</Label>
                <Textarea placeholder="コントロールグループのコンテンツ" />
              </div>
              <div className="space-y-2">
                <Label>バリアントB</Label>
                <Textarea placeholder="テストするコンテンツ" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>最小サンプルサイズ</Label>
                  <Input type="number" defaultValue={1000} />
                </div>
                <div className="space-y-2">
                  <Label>有意水準</Label>
                  <Select defaultValue="95">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90%</SelectItem>
                      <SelectItem value="95">95%</SelectItem>
                      <SelectItem value="99">99%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                キャンセル
              </Button>
              <Button
                onClick={async () => {
                  await handleCreateTest();
                  setIsCreateDialogOpen(false);
                }}
                disabled={creating}
              >
                {creating ? '作成中...' : 'テストを作成'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 統計サマリー */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アクティブテスト</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tests.filter(t => t.status === "running").length}
            </div>
            <p className="text-xs text-muted-foreground">実行中のテスト</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均改善率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+24.8%</div>
            <p className="text-xs text-muted-foreground">勝者バリアント vs コントロール</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総インプレッション</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5K</div>
            <p className="text-xs text-muted-foreground">今月のテスト配信数</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">勝者決定率</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">統計的有意差あり</p>
          </CardContent>
        </Card>
      </div>

      {/* 詳細パネル */}
      {selectedTest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {selectedTest.name} — 詳細結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ABTestResults
              testName={selectedTest.name}
              status={selectedTest.status.toUpperCase()}
              variantStats={selectedTest.variants.map((v) => ({
                id: v.id,
                name: v.name,
                weight: Math.round(100 / selectedTest.variants.length),
                totalImpressions: v.impressions,
                totalConversions: v.conversions,
                conversionRate: v.conversionRate,
              }))}
              winner={
                selectedTest.variants.find((v) => v.isWinner)
                  ? {
                      id: selectedTest.variants.find((v) => v.isWinner)!.id,
                      name: selectedTest.variants.find((v) => v.isWinner)!.name,
                      weight: Math.round(100 / selectedTest.variants.length),
                      totalImpressions: selectedTest.variants.find((v) => v.isWinner)!.impressions,
                      totalConversions: selectedTest.variants.find((v) => v.isWinner)!.conversions,
                      conversionRate: selectedTest.variants.find((v) => v.isWinner)!.conversionRate,
                    }
                  : null
              }
            />
          </CardContent>
        </Card>
      )}

      {/* テスト一覧 */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">アクティブ</TabsTrigger>
          <TabsTrigger value="completed">完了</TabsTrigger>
          <TabsTrigger value="draft">下書き</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {tests
            .filter(t => t.status === "running" || t.status === "paused")
            .map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {test.name}
                        {getStatusBadge(test.status)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {getAlgorithmLabel(test.algorithm)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {test.targetMetric}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          開始: {isClient ? formatDateJP(test.startDate) : "--/--/--"}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {test.status === "running" ? (
                        <Button variant="outline" size="sm" onClick={() => handleEndTest(test.id)}>
                          <Pause className="h-4 w-4 mr-2" />
                          一時停止
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleStartTest(test.id)}>
                          <Play className="h-4 w-4 mr-2" />
                          再開
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={selectedTestId === test.id ? "secondary" : "default"}
                        onClick={() => setSelectedTestId(prev => prev === test.id ? null : test.id)}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        詳細
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 進捗バー */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">サンプルサイズ進捗</span>
                      <span className="font-medium">
                        {test.currentSampleSize.toLocaleString()} / {test.minSampleSize.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={(test.currentSampleSize / test.minSampleSize) * 100}
                    />
                  </div>

                  {/* バリアント比較 */}
                  <div className="space-y-3">
                    {test.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`p-4 rounded-lg border ${
                          variant.isWinner ? 'border-green-500 bg-green-50' :
                          variant.isControl ? 'border-blue-500 bg-blue-50' :
                          'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{variant.name}</span>
                            {variant.isWinner && (
                              <Badge className="bg-green-500">
                                <Trophy className="h-3 w-3 mr-1" />
                                リーダー
                              </Badge>
                            )}
                            {variant.isControl && (
                              <Badge variant="outline">コントロール</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold">
                              {variant.conversionRate.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          「{variant.content}」
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">インプレッション</span>
                            <p className="font-medium">{variant.impressions.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">コンバージョン</span>
                            <p className="font-medium">{variant.conversions.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">トラフィック配分</span>
                            <Progress
                              value={(variant.impressions / test.currentSampleSize) * 100 * test.variants.length}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 統計的有意性 */}
                  {test.statisticalSignificance && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">統計的有意性</span>
                        <span className={`font-bold ${
                          test.statisticalSignificance >= 95 ? 'text-green-500' :
                          test.statisticalSignificance >= 90 ? 'text-yellow-500' :
                          'text-muted-foreground'
                        }`}>
                          {test.statisticalSignificance.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={test.statisticalSignificance}
                        className="mt-2"
                      />
                      {test.statisticalSignificance >= 95 && (
                        <p className="text-xs text-green-600 mt-2">
                          ✓ 統計的に有意な差が検出されました。勝者を適用することを推奨します。
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {tests
            .filter(t => t.status === "completed" || t.status === "winner_found")
            .map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {test.name}
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          完了
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {isClient ? formatDateJP(test.startDate) : "--/--/--"} - {isClient && test.endDate ? formatDateJP(test.endDate) : "--/--/--"}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      レポート表示
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <Trophy className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">
                        勝者: {test.variants.find(v => v.isWinner)?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        コントロール比 +{(
                          ((test.variants.find(v => v.isWinner)?.conversionRate || 0) /
                           (test.variants.find(v => v.isControl)?.conversionRate || 1) - 1) * 100
                        ).toFixed(1)}% 改善
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-2xl font-bold text-green-500">
                        {test.variants.find(v => v.isWinner)?.conversionRate.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        有意水準: {test.statisticalSignificance?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">下書きのテストはありません</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新規テスト作成
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
