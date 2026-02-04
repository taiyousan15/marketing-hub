"use client";

import { useState } from "react";
import {
  Users,
  Link2,
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// サンプルデータ
const samplePartners = [
  {
    id: "p1",
    name: "山田太郎",
    email: "yamada@example.com",
    code: "YAMADA001",
    status: "ACTIVE" as const,
    rank: "GOLD" as const,
    totalClicks: 1250,
    totalConversions: 89,
    totalEarnings: 178000,
    unpaidEarnings: 45000,
    conversionRate: 7.12,
    createdAt: "2024-10-15",
  },
  {
    id: "p2",
    name: "鈴木花子",
    email: "suzuki@example.com",
    code: "SUZUKI002",
    status: "ACTIVE" as const,
    rank: "SILVER" as const,
    totalClicks: 820,
    totalConversions: 45,
    totalEarnings: 90000,
    unpaidEarnings: 22500,
    conversionRate: 5.49,
    createdAt: "2024-11-20",
  },
  {
    id: "p3",
    name: "佐藤健一",
    email: "sato@example.com",
    code: "SATO003",
    status: "PENDING" as const,
    rank: "BRONZE" as const,
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    unpaidEarnings: 0,
    conversionRate: 0,
    createdAt: "2025-01-28",
  },
];

const sampleLinks = [
  {
    id: "l1",
    code: "YAMADA001-LP1",
    partnerId: "p1",
    partnerName: "山田太郎",
    targetUrl: "/lp/free-offer",
    clicks: 580,
    conversions: 42,
    conversionRate: 7.24,
    createdAt: "2024-10-20",
  },
  {
    id: "l2",
    code: "YAMADA001-LP2",
    partnerId: "p1",
    partnerName: "山田太郎",
    targetUrl: "/lp/seminar",
    clicks: 670,
    conversions: 47,
    conversionRate: 7.01,
    createdAt: "2024-11-05",
  },
  {
    id: "l3",
    code: "SUZUKI002-LP1",
    partnerId: "p2",
    partnerName: "鈴木花子",
    targetUrl: "/lp/free-offer",
    clicks: 820,
    conversions: 45,
    conversionRate: 5.49,
    createdAt: "2024-11-25",
  },
];

const samplePayouts = [
  {
    id: "pay1",
    partnerId: "p1",
    partnerName: "山田太郎",
    amount: 133000,
    status: "COMPLETED" as const,
    method: "BANK_TRANSFER" as const,
    periodStart: "2024-12-01",
    periodEnd: "2024-12-31",
    paidAt: "2025-01-15",
  },
  {
    id: "pay2",
    partnerId: "p2",
    partnerName: "鈴木花子",
    amount: 67500,
    status: "COMPLETED" as const,
    method: "BANK_TRANSFER" as const,
    periodStart: "2024-12-01",
    periodEnd: "2024-12-31",
    paidAt: "2025-01-15",
  },
  {
    id: "pay3",
    partnerId: "p1",
    partnerName: "山田太郎",
    amount: 45000,
    status: "PENDING" as const,
    method: "BANK_TRANSFER" as const,
    periodStart: "2025-01-01",
    periodEnd: "2025-01-31",
    paidAt: null,
  },
];

export default function AffiliatePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      ACTIVE: { label: "有効", variant: "default" },
      PENDING: { label: "審査中", variant: "secondary" },
      SUSPENDED: { label: "停止", variant: "destructive" },
      REJECTED: { label: "却下", variant: "outline" },
    };
    const { label, variant } = config[status] || { label: status, variant: "outline" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getRankBadge = (rank: string) => {
    const config: Record<string, { label: string; color: string }> = {
      BRONZE: { label: "ブロンズ", color: "bg-orange-100 text-orange-700" },
      SILVER: { label: "シルバー", color: "bg-gray-100 text-gray-700" },
      GOLD: { label: "ゴールド", color: "bg-yellow-100 text-yellow-700" },
      PLATINUM: { label: "プラチナ", color: "bg-blue-100 text-blue-700" },
    };
    const { label, color } = config[rank] || { label: rank, color: "" };
    return <Badge className={color}>{label}</Badge>;
  };

  const getPayoutStatusBadge = (status: string) => {
    const config: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" }> = {
      PENDING: { label: "未払い", icon: <Clock className="h-3 w-3 mr-1" />, variant: "secondary" },
      COMPLETED: { label: "支払済", icon: <CheckCircle className="h-3 w-3 mr-1" />, variant: "default" },
    };
    const { label, icon, variant } = config[status] || { label: status, icon: null, variant: "outline" as const };
    return (
      <Badge variant={variant} className="flex items-center">
        {icon}
        {label}
      </Badge>
    );
  };

  const filteredPartners = samplePartners.filter(
    (partner) =>
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">アフィリエイト管理</h1>
          <p className="text-muted-foreground">
            パートナー、リンク、報酬の管理
          </p>
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
                <Input placeholder="パートナー名" />
              </div>
              <div className="space-y-2">
                <Label>メールアドレス</Label>
                <Input type="email" placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label>パートナーコード</Label>
                <Input placeholder="自動生成されます" disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>フロント報酬率</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue={30} />
                    <span>%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>バックエンド報酬率</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue={20} />
                    <span>%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>ランク</Label>
                <Select defaultValue="BRONZE">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRONZE">ブロンズ</SelectItem>
                    <SelectItem value="SILVER">シルバー</SelectItem>
                    <SelectItem value="GOLD">ゴールド</SelectItem>
                    <SelectItem value="PLATINUM">プラチナ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddPartnerOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={() => setIsAddPartnerOpen(false)}>
                登録
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アクティブパートナー</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {samplePartners.filter((p) => p.status === "ACTIVE").length}
            </div>
            <p className="text-xs text-muted-foreground">
              審査中: {samplePartners.filter((p) => p.status === "PENDING").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総クリック数</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {samplePartners.reduce((sum, p) => sum + p.totalClicks, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">今月</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総報酬額</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{samplePartners.reduce((sum, p) => sum + p.totalEarnings, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              未払い: ¥{samplePartners.reduce((sum, p) => sum + p.unpaidEarnings, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均CVR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                samplePartners
                  .filter((p) => p.totalClicks > 0)
                  .reduce((sum, p) => sum + p.conversionRate, 0) /
                samplePartners.filter((p) => p.totalClicks > 0).length || 0
              ).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">全パートナー平均</p>
          </CardContent>
        </Card>
      </div>

      {/* タブ */}
      <Tabs defaultValue="partners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="partners">パートナー</TabsTrigger>
          <TabsTrigger value="links">アフィリエイトリンク</TabsTrigger>
          <TabsTrigger value="payouts">報酬・支払い</TabsTrigger>
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
                    <TableHead>ランク</TableHead>
                    <TableHead className="text-right">クリック</TableHead>
                    <TableHead className="text-right">CV</TableHead>
                    <TableHead className="text-right">CVR</TableHead>
                    <TableHead className="text-right">報酬</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.map((partner) => (
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
                      <TableCell>{getRankBadge(partner.rank)}</TableCell>
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              詳細
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              編集
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link2 className="mr-2 h-4 w-4" />
                              リンク管理
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Ban className="mr-2 h-4 w-4" />
                              停止
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
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
              <CardDescription>
                パートナーのアフィリエイトリンク一覧
              </CardDescription>
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
                    <TableHead className="text-right">CVR</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <code className="text-sm bg-muted px-1 py-0.5 rounded">
                          {link.code}
                        </code>
                      </TableCell>
                      <TableCell>{link.partnerName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm truncate max-w-[200px]">
                            {link.targetUrl}
                          </span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {link.clicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {link.conversions.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {link.conversionRate}%
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                  <CardDescription>
                    パートナーへの報酬支払い管理
                  </CardDescription>
                </div>
                <Button>
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
                    <TableHead>期間</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>支払方法</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>支払日</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {samplePayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">
                        {payout.partnerName}
                      </TableCell>
                      <TableCell>
                        {payout.periodStart} 〜 {payout.periodEnd}
                      </TableCell>
                      <TableCell className="font-medium">
                        ¥{payout.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {payout.method === "BANK_TRANSFER" ? "銀行振込" : "PayPal"}
                      </TableCell>
                      <TableCell>{getPayoutStatusBadge(payout.status)}</TableCell>
                      <TableCell>{payout.paidAt || "-"}</TableCell>
                      <TableCell>
                        {payout.status === "PENDING" && (
                          <Button size="sm" variant="outline">
                            支払処理
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
