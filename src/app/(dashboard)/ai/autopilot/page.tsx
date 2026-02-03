"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
import {
  Bot,
  Play,
  Pause,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Brain,
  TrendingUp,
  Users,
  Mail,
  MessageSquare,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Bell,
  Shield,
  Gauge
} from "lucide-react";

type AutopilotStatus = "running" | "paused" | "error";
type AutomationMode = "conservative" | "balanced" | "aggressive";
type AutomationLevel = "suggest" | "semi_auto" | "full_auto";

interface Decision {
  id: string;
  timestamp: Date;
  trigger: string;
  action: {
    type: string;
    description: string;
  };
  confidence: number;
  status: "pending" | "approved" | "executed" | "rejected" | "failed";
  customer?: {
    name: string;
    email: string;
  };
  reasoning: string;
}

interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: Date;
}

export default function AutopilotPage() {
  const [status, setStatus] = useState<AutopilotStatus>("running");
  const [mode, setMode] = useState<AutomationMode>("balanced");
  const [level, setLevel] = useState<AutomationLevel>("semi_auto");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const stats = {
    actionsToday: 127,
    successRate: 94.5,
    pendingApprovals: 8,
    avgConfidence: 87.3
  };

  const decisions: Decision[] = [
    {
      id: "dec-001",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      trigger: "customer_action:cart_abandon",
      action: {
        type: "send_email",
        description: "カート放棄リマインドメール送信"
      },
      confidence: 0.92,
      status: "executed",
      customer: { name: "田中太郎", email: "tanaka@example.com" },
      reasoning: "カート放棄から1時間経過、過去の購入履歴から高いコンバージョン確率を予測"
    },
    {
      id: "dec-002",
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      trigger: "threshold_breach:churn_risk",
      action: {
        type: "escalate",
        description: "カスタマーサクセスにエスカレート"
      },
      confidence: 0.88,
      status: "pending",
      customer: { name: "山田花子", email: "yamada@example.com" },
      reasoning: "チャーンリスクスコアが80%を超過、感情分析で不満を検出"
    },
    {
      id: "dec-003",
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      trigger: "customer_action:page_view",
      action: {
        type: "send_line",
        description: "LINEでパーソナライズドオファー送信"
      },
      confidence: 0.85,
      status: "executed",
      customer: { name: "佐藤健一", email: "sato@example.com" },
      reasoning: "購入意向「very_high」を検出、即座のフォローアップで成約率向上を見込む"
    },
    {
      id: "dec-004",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      trigger: "scheduled:daily_optimization",
      action: {
        type: "adjust_ab_test",
        description: "A/Bテストのトラフィック配分調整"
      },
      confidence: 0.91,
      status: "executed",
      reasoning: "バリアントBが統計的有意差で優位、トラフィック配分を70:30に変更"
    },
    {
      id: "dec-005",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      trigger: "customer_action:support_ticket",
      action: {
        type: "update_segment",
        description: "「要フォロー」セグメントに追加"
      },
      confidence: 0.78,
      status: "pending",
      customer: { name: "鈴木美咲", email: "suzuki@example.com" },
      reasoning: "サポートチケットの感情分析で強い不満を検出、優先対応が必要"
    }
  ];

  const alerts: Alert[] = [
    {
      id: "alert-001",
      severity: "warning",
      message: "チャーンリスク顧客が10名を超えました。確認してください。",
      timestamp: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: "alert-002",
      severity: "info",
      message: "A/Bテスト「ウェルカムメール件名」で勝者が決定しました。",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: "alert-003",
      severity: "critical",
      message: "メール配信エラー率が5%を超えています。",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    }
  ];

  const getStatusBadge = (s: AutopilotStatus) => {
    const config = {
      running: { label: "稼働中", variant: "default" as const, color: "bg-green-500" },
      paused: { label: "一時停止", variant: "secondary" as const, color: "bg-yellow-500" },
      error: { label: "エラー", variant: "destructive" as const, color: "bg-red-500" }
    };
    return (
      <Badge className={`${config[s].color} text-white`}>
        {config[s].label}
      </Badge>
    );
  };

  const getDecisionStatusBadge = (status: Decision["status"]) => {
    const config: Record<Decision["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "承認待ち", variant: "outline" },
      approved: { label: "承認済み", variant: "default" },
      executed: { label: "実行完了", variant: "default" },
      rejected: { label: "却下", variant: "destructive" },
      failed: { label: "失敗", variant: "destructive" }
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  const getAlertIcon = (severity: Alert["severity"]) => {
    switch (severity) {
      case "info":
        return <Bell className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "send_email":
        return <Mail className="h-4 w-4" />;
      case "send_line":
        return <MessageSquare className="h-4 w-4" />;
      case "escalate":
        return <AlertTriangle className="h-4 w-4" />;
      case "adjust_ab_test":
        return <Gauge className="h-4 w-4" />;
      case "update_segment":
        return <Users className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const toggleAutopilot = () => {
    setStatus(status === "running" ? "paused" : "running");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-cyan-500" />
            Autopilot Control Center
          </h1>
          <p className="text-muted-foreground mt-1">
            AIによる完全自動マーケティングオペレーション
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">ステータス:</span>
            {getStatusBadge(status)}
          </div>
          <Button
            variant={status === "running" ? "destructive" : "default"}
            onClick={toggleAutopilot}
          >
            {status === "running" ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                停止
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                開始
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            設定
          </Button>
        </div>
      </div>

      {/* ステータスカード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日のアクション</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.actionsToday}</div>
            <p className="text-xs text-muted-foreground">自動実行されたアクション</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.successRate}%</div>
            <Progress value={stats.successRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">確認が必要なアクション</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均信頼度</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgConfidence}%</div>
            <Progress value={stats.avgConfidence} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* モード設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            オペレーションモード
          </CardTitle>
          <CardDescription>
            自動化の積極性と承認プロセスを設定
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm font-medium">自動化モード</label>
              <Select value={mode} onValueChange={(v) => setMode(v as AutomationMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span>保守的</span>
                      <span className="text-xs text-muted-foreground">- 高信頼度のみ実行</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="balanced">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-green-500" />
                      <span>バランス</span>
                      <span className="text-xs text-muted-foreground">- 推奨設定</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="aggressive">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <span>積極的</span>
                      <span className="text-xs text-muted-foreground">- 迅速なアクション</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">承認レベル</label>
              <Select value={level} onValueChange={(v) => setLevel(v as AutomationLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggest">提案のみ（すべて手動承認）</SelectItem>
                  <SelectItem value="semi_auto">セミオート（高額・重要アクションは承認必要）</SelectItem>
                  <SelectItem value="full_auto">完全自動（すべて自動実行）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* タブ */}
      <Tabs defaultValue="decisions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="decisions" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            意思決定ログ
            {stats.pendingApprovals > 0 && (
              <Badge variant="destructive" className="ml-1">{stats.pendingApprovals}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            アラート
            {alerts.filter(a => a.severity === "critical").length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {alerts.filter(a => a.severity === "critical").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            パフォーマンス
          </TabsTrigger>
        </TabsList>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>最近の意思決定</CardTitle>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  更新
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {decisions.map((decision) => (
                <Card
                  key={decision.id}
                  className={`border-l-4 ${
                    decision.status === "pending" ? "border-l-amber-500 bg-amber-50/50" :
                    decision.status === "executed" ? "border-l-green-500" :
                    decision.status === "failed" ? "border-l-red-500" :
                    "border-l-gray-300"
                  }`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getActionIcon(decision.action.type)}
                          <span className="font-medium">{decision.action.description}</span>
                          {getDecisionStatusBadge(decision.status)}
                        </div>
                        {decision.customer && (
                          <p className="text-sm text-muted-foreground">
                            対象: {decision.customer.name} ({decision.customer.email})
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>トリガー: {decision.trigger}</span>
                          <span>信頼度: {(decision.confidence * 100).toFixed(0)}%</span>
                          <span>{decision.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm bg-muted p-2 rounded">
                          <span className="font-medium">理由:</span> {decision.reasoning}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {decision.status === "pending" && (
                          <>
                            <Button variant="default" size="sm" className="bg-green-500 hover:bg-green-600">
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm">
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>システムアラート</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    alert.severity === "critical" ? "bg-red-50 border border-red-200" :
                    alert.severity === "warning" ? "bg-yellow-50 border border-yellow-200" :
                    "bg-blue-50 border border-blue-200"
                  }`}
                >
                  {getAlertIcon(alert.severity)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    確認
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>アクションタイプ別実行数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: "メール送信", count: 45, icon: Mail },
                    { type: "LINE送信", count: 32, icon: MessageSquare },
                    { type: "セグメント更新", count: 28, icon: Users },
                    { type: "A/Bテスト調整", count: 12, icon: Gauge },
                    { type: "エスカレーション", count: 10, icon: AlertTriangle }
                  ].map((item) => (
                    <div key={item.type} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1">{item.type}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                      <Progress value={item.count / 0.45} className="w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>時間帯別アクティビティ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">グラフエリア</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI推奨事項</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  "チャーンリスク顧客への対応を強化することで、月間解約率を2%削減できる可能性があります",
                  "メール送信時間を10:00から11:00に変更することで、開封率が15%向上する見込みです",
                  "A/Bテスト「件名テスト」の結果に基づき、絵文字を含む件名を標準採用することを推奨します"
                ].map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 設定ダイアログ */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Autopilot設定</DialogTitle>
            <DialogDescription>
              自動化の動作を細かく設定します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="font-medium">セーフティガード</h3>
              <div className="space-y-3">
                {[
                  { name: "レート制限", desc: "1時間あたり100アクションまで", enabled: true },
                  { name: "予算上限", desc: "1日1000アクションまで", enabled: true },
                  { name: "高額アクション承認", desc: "10,000円以上は手動承認", enabled: true },
                  { name: "営業時間制限", desc: "9:00-18:00のみ実行", enabled: false }
                ].map((guard) => (
                  <div key={guard.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{guard.name}</p>
                      <p className="text-xs text-muted-foreground">{guard.desc}</p>
                    </div>
                    <Switch checked={guard.enabled} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">通知設定</h3>
              <div className="space-y-3">
                {[
                  { name: "重大アラート", desc: "Slack/メールで即座に通知", enabled: true },
                  { name: "日次サマリー", desc: "毎日9:00にレポート送信", enabled: true },
                  { name: "承認リマインダー", desc: "保留アクションを1時間ごとに通知", enabled: false }
                ].map((notif) => (
                  <div key={notif.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{notif.name}</p>
                      <p className="text-xs text-muted-foreground">{notif.desc}</p>
                    </div>
                    <Switch checked={notif.enabled} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={() => setIsSettingsOpen(false)}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
