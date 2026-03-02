"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Link2,
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  Ban,
  CheckCircle,
  Clock,
  ExternalLink,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  getAffiliatePartners,
  getAffiliateLinks,
  getAffiliatePayouts,
  getAffiliateStats,
  addAffiliatePartner,
  updatePartnerStatus,
  processPayoutById,
  processBulkPayouts,
  getAffiliateConversions,
  approveConversion,
  rejectConversion,
  refundConversion,
} from "@/actions/affiliate";

type Partner = {
  id: string;
  name: string;
  email: string;
  code: string;
  status: string;
  commissionRate: number;
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  pendingEarnings: number;
  conversionRate: number;
  createdAt: string;
};

type AffiliateLink = {
  id: string;
  linkCode: string;
  url: string;
  affiliateUrl: string;
  partnerName: string;
  partnerId: string;
  clicks: number;
  conversions: number;
  createdAt: string;
};

type Payout = {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  status: string;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  hasBankAccount: boolean;
};

type Conversion = {
  id: string;
  partnerId: string;
  amount: number;
  status: string;
  approvedAt: string | Date | null;
  payableAt: string | Date | null;
  createdAt: string | Date;
  partner: { id: string; name: string; code: string };
};

type Stats = {
  activePartners: number;
  pendingPartners: number;
  totalClicks: number;
  totalEarnings: number;
  pendingPayout: number;
};

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

const DEFAULT_NEW_PARTNER = { name: "", email: "", commissionRate: 30 };

export default function AffiliatePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPartner, setNewPartner] = useState(DEFAULT_NEW_PARTNER);

  const [stats, setStats] = useState<Stats | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [conversionStatusFilter, setConversionStatusFilter] = useState<string>("ALL");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, partnersData, linksData, payoutsData, conversionsData] =
        await Promise.all([
          getAffiliateStats(),
          getAffiliatePartners(),
          getAffiliateLinks(),
          getAffiliatePayouts(),
          getAffiliateConversions(),
        ]);
      setStats(statsData);
      setPartners(partnersData.partners);
      setLinks(linksData.links);
      setPayouts(payoutsData.payouts);
      setConversions(conversionsData.conversions);
    } catch (err) {
      console.error("Failed to load affiliate data:", err);
      setError("データの取得に失敗しました。ページを再読み込みしてください。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      ACTIVE: { label: "有効", variant: "default" },
      PENDING: { label: "審査中", variant: "secondary" },
      SUSPENDED: { label: "停止", variant: "destructive" },
      REJECTED: { label: "却下", variant: "outline" },
    };
    const { label, variant } = config[status] ?? {
      label: status,
      variant: "outline" as const,
    };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getPayoutStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        label: string;
        icon: React.ReactNode;
        variant: "default" | "secondary" | "outline";
      }
    > = {
      PENDING: {
        label: "未払い",
        icon: <Clock className="h-3 w-3 mr-1" />,
        variant: "secondary",
      },
      APPROVED: {
        label: "承認済",
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        variant: "default",
      },
      COMPLETED: {
        label: "支払済",
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        variant: "default",
      },
    };
    const { label, icon, variant } = config[status] ?? {
      label: status,
      icon: null,
      variant: "outline" as const,
    };
    return (
      <Badge variant={variant} className="flex items-center">
        {icon}
        {label}
      </Badge>
    );
  };

  const handleAddPartner = async () => {
    if (!newPartner.name.trim() || !newPartner.email.trim()) {
      toast.error("名前とメールアドレスを入力してください");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await addAffiliatePartner(newPartner);
      if (result.success) {
        toast.success("パートナーを追加しました");
        setIsAddPartnerOpen(false);
        setNewPartner(DEFAULT_NEW_PARTNER);
        loadData();
      } else {
        toast.error(result.error ?? "追加に失敗しました");
      }
    } catch (err) {
      console.error("Add partner error:", err);
      toast.error("追加に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (
    partnerId: string,
    action: "approve" | "suspend"
  ) => {
    try {
      const result = await updatePartnerStatus(partnerId, action);
      if (result.success) {
        toast.success(action === "suspend" ? "停止しました" : "承認しました");
        loadData();
      } else {
        toast.error(result.error ?? "操作に失敗しました");
      }
    } catch (err) {
      console.error("Status change error:", err);
      toast.error("操作に失敗しました");
    }
  };

  const handlePayout = async (payoutId: string) => {
    try {
      const result = await processPayoutById(payoutId);
      if (result.success) {
        toast.success("支払いを処理しました");
        loadData();
      } else {
        toast.error(result.error ?? "支払い処理に失敗しました");
      }
    } catch (err) {
      console.error("Payout error:", err);
      toast.error("支払い処理に失敗しました");
    }
  };

  const handleBulkPayout = async () => {
    try {
      const result = await processBulkPayouts();
      if (result.success) {
        toast.success(
          `一括支払いを実行しました（${result.created}件作成、${result.skipped}件スキップ）`
        );
        loadData();
      } else {
        toast.error(result.error ?? "一括支払いに失敗しました");
      }
    } catch (err) {
      console.error("Bulk payout error:", err);
      toast.error("一括支払いに失敗しました");
    }
  };

  const handleApproveConversion = async (conversionId: string) => {
    try {
      const result = await approveConversion(conversionId);
      if (result.success) {
        toast.success("コンバージョンを承認しました");
        loadData();
      } else {
        toast.error(result.error ?? "承認に失敗しました");
      }
    } catch (err) {
      console.error("Approve conversion error:", err);
      toast.error("承認に失敗しました");
    }
  };

  const handleRejectConversion = async (conversionId: string) => {
    try {
      const result = await rejectConversion(conversionId);
      if (result.success) {
        toast.success("コンバージョンを却下しました");
        loadData();
      } else {
        toast.error(result.error ?? "却下に失敗しました");
      }
    } catch (err) {
      console.error("Reject conversion error:", err);
      toast.error("却下に失敗しました");
    }
  };

  const handleRefundConversion = async (conversionId: string) => {
    try {
      const result = await refundConversion(conversionId);
      if (result.success) {
        toast.success("返金処理を完了しました");
        loadData();
      } else {
        toast.error(result.error ?? "返金処理に失敗しました");
      }
    } catch (err) {
      console.error("Refund conversion error:", err);
      toast.error("返金処理に失敗しました");
    }
  };

  const getConversionStatusBadge = (status: string) => {
    const config: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      PENDING: { label: "審査中", variant: "secondary" },
      APPROVED: { label: "承認済", variant: "default" },
      REJECTED: { label: "却下", variant: "destructive" },
      PAID: { label: "支払済", variant: "outline" },
    };
    const { label, variant } = config[status] ?? { label: status, variant: "outline" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredConversions = conversions.filter(
    (c) => conversionStatusFilter === "ALL" || c.status === conversionStatusFilter
  );

  const handleCopyLink = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("コピーしました"))
      .catch(() => toast.error("コピーに失敗しました"));
  };

  const filteredPartners = partners.filter(
    (p) =>
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">アフィリエイト管理</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData}>再読み込み</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">アフィリエイト管理</h1>
          <p className="text-muted-foreground">パートナー、リンク、報酬の管理</p>
        </div>
        <Dialog open={isAddPartnerOpen} onOpenChange={setIsAddPartnerOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              パートナー追加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規パートナー追加</DialogTitle>
              <DialogDescription>
                アフィリエイトパートナーを登録します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>名前</Label>
                <Input
                  placeholder="パートナー名"
                  value={newPartner.name}
                  onChange={(e) =>
                    setNewPartner({ ...newPartner, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>メールアドレス</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newPartner.email}
                  onChange={(e) =>
                    setNewPartner({ ...newPartner, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>パートナーコード</Label>
                <Input placeholder="自動生成されます" disabled />
              </div>
              <div className="space-y-2">
                <Label>報酬率</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={newPartner.commissionRate}
                    onChange={(e) =>
                      setNewPartner({
                        ...newPartner,
                        commissionRate: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <span>%</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddPartnerOpen(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button onClick={handleAddPartner} disabled={isSubmitting}>
                {isSubmitting ? "登録中..." : "登録"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              アクティブパートナー
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activePartners ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  審査中: {stats?.pendingPartners ?? 0}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総クリック数</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(stats?.totalClicks ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">累計</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総報酬額</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ¥{(stats?.totalEarnings ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  未払い: ¥{(stats?.pendingPayout ?? 0).toLocaleString()}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均CVR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {partners.length > 0 && partners.some((p) => p.totalClicks > 0)
                    ? (
                        partners
                          .filter((p) => p.totalClicks > 0)
                          .reduce((sum, p) => sum + p.conversionRate, 0) /
                        partners.filter((p) => p.totalClicks > 0).length
                      ).toFixed(2)
                    : "0.00"}%
                </div>
                <p className="text-xs text-muted-foreground">全パートナー平均</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* タブ */}
      <Tabs defaultValue="partners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="partners">パートナー</TabsTrigger>
          <TabsTrigger value="links">アフィリエイトリンク</TabsTrigger>
          <TabsTrigger value="payouts">報酬・支払い</TabsTrigger>
          <TabsTrigger value="conversions">コンバージョン</TabsTrigger>
        </TabsList>

        {/* パートナー一覧 */}
        <TabsContent value="partners">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="名前、メール、コードで検索..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  エクスポート
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>パートナー</TableHead>
                    <TableHead>コード</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-right">クリック</TableHead>
                    <TableHead className="text-right">CV</TableHead>
                    <TableHead className="text-right">CVR</TableHead>
                    <TableHead className="text-right">報酬</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonRow key={i} cols={8} />
                    ))
                  ) : filteredPartners.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground py-8"
                      >
                        {searchQuery
                          ? "検索結果がありません"
                          : "パートナーがいません"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPartners.map((partner) => (
                      <TableRow key={partner.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{partner.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {partner.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-1 py-0.5 rounded">
                            {partner.code}
                          </code>
                        </TableCell>
                        <TableCell>{getStatusBadge(partner.status)}</TableCell>
                        <TableCell className="text-right">
                          {partner.totalClicks.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {partner.totalConversions.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {partner.conversionRate}%
                        </TableCell>
                        <TableCell className="text-right">
                          ¥{partner.totalEarnings.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {partner.status === "PENDING" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(partner.id, "approve")
                                  }
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  承認
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {partner.status !== "SUSPENDED" ? (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() =>
                                    handleStatusChange(partner.id, "suspend")
                                  }
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  停止
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(partner.id, "approve")
                                  }
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  再有効化
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* リンク一覧 */}
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>アフィリエイトリンク</CardTitle>
              <CardDescription>パートナーのアフィリエイトリンク一覧</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>リンクコード</TableHead>
                    <TableHead>パートナー</TableHead>
                    <TableHead>対象URL</TableHead>
                    <TableHead className="text-right">クリック</TableHead>
                    <TableHead className="text-right">CV</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonRow key={i} cols={6} />
                    ))
                  ) : links.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        リンクがありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <code className="text-sm bg-muted px-1 py-0.5 rounded">
                            {link.linkCode}
                          </code>
                        </TableCell>
                        <TableCell>{link.partnerName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-sm truncate max-w-[200px]">
                              {link.url}
                            </span>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {link.clicks.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {link.conversions.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyLink(link.affiliateUrl)}
                            title="アフィリエイトURLをコピー"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 報酬・支払い */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>報酬・支払い履歴</CardTitle>
                  <CardDescription>パートナーへの報酬支払い管理</CardDescription>
                </div>
                <Button onClick={handleBulkPayout}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  一括支払い処理
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>パートナー</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>支払方法</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>支払日</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonRow key={i} cols={6} />
                    ))
                  ) : payouts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        支払い履歴がありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">
                          {payout.partnerName}
                        </TableCell>
                        <TableCell className="font-medium">
                          ¥{payout.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {payout.paymentMethod === "BANK_TRANSFER"
                            ? "銀行振込"
                            : payout.paymentMethod ?? "-"}
                        </TableCell>
                        <TableCell>
                          {getPayoutStatusBadge(payout.status)}
                        </TableCell>
                        <TableCell>
                          {payout.paidAt
                            ? new Date(payout.paidAt).toLocaleDateString("ja-JP")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {payout.status === "PENDING" &&
                            (payout.hasBankAccount ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePayout(payout.id)}
                              >
                                支払処理
                              </Button>
                            ) : (
                              <span className="text-xs text-destructive">
                                口座未登録
                              </span>
                            ))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        {/* コンバージョン一覧 */}
        <TabsContent value="conversions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>コンバージョン管理</CardTitle>
                  <CardDescription>成約の承認・却下・返金処理</CardDescription>
                </div>
                <div className="flex gap-2">
                  {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={conversionStatusFilter === s ? "default" : "outline"}
                      onClick={() => setConversionStatusFilter(s)}
                    >
                      {s === "ALL" ? "全て" : s === "PENDING" ? "審査中" : s === "APPROVED" ? "承認済" : "却下"}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>パートナー</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead>成約日</TableHead>
                    <TableHead>支払可能日</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonRow key={i} cols={6} />
                    ))
                  ) : filteredConversions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        コンバージョンがありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredConversions.map((conversion) => (
                      <TableRow key={conversion.id}>
                        <TableCell>
                          <div className="font-medium">{conversion.partner.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {conversion.partner.code}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ¥{conversion.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(conversion.createdAt).toLocaleDateString("ja-JP")}
                        </TableCell>
                        <TableCell>
                          {conversion.payableAt
                            ? new Date(conversion.payableAt).toLocaleDateString("ja-JP")
                            : "-"}
                        </TableCell>
                        <TableCell>{getConversionStatusBadge(conversion.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {conversion.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveConversion(conversion.id)}
                                >
                                  承認
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectConversion(conversion.id)}
                                >
                                  却下
                                </Button>
                              </>
                            )}
                            {conversion.status === "APPROVED" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRefundConversion(conversion.id)}
                              >
                                返金
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
