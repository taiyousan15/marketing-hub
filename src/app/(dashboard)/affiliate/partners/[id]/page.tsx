import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, TrendingUp, DollarSign, MousePointerClick } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getConversionStatusBadge(status: string) {
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
}

function getPayoutStatusBadge(status: string) {
  const config: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    PENDING: { label: "未払い", variant: "secondary" },
    APPROVED: { label: "承認済", variant: "default" },
    PROCESSING: { label: "処理中", variant: "secondary" },
    COMPLETED: { label: "支払済", variant: "default" },
    FAILED: { label: "失敗", variant: "destructive" },
  };
  const { label, variant } = config[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={variant}>{label}</Badge>;
}

function getRankBadge(rank: string) {
  const config: Record<string, string> = {
    STANDARD: "bg-gray-100 text-gray-800",
    SILVER: "bg-gray-200 text-gray-900",
    GOLD: "bg-yellow-100 text-yellow-800",
    PLATINUM: "bg-blue-100 text-blue-800",
    VIP: "bg-purple-100 text-purple-800",
  };
  const className = config[rank] ?? "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {rank}
    </span>
  );
}

export default async function PartnerDetailPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const partner = await prisma.partner.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      affiliateConversions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      payouts: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      affiliateLinks: {
        include: {
          _count: { select: { AffiliateClick: true } },
        },
      },
    },
  });

  if (!partner) notFound();

  // KPI計算
  const totalClicks = partner.affiliateLinks.reduce(
    (sum, link) => sum + link._count.AffiliateClick,
    0
  );
  const totalConversions = partner.affiliateConversions.length;
  const conversionRate =
    totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : "0.0";
  const totalEarnings = partner.affiliateConversions
    .filter((c) => c.status !== "REJECTED")
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link
          href="/affiliate"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          アフィリエイト管理
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{partner.name}</h1>
            {getRankBadge("STANDARD")}
            <Badge variant={partner.status === "ACTIVE" ? "default" : "secondary"}>
              {partner.status === "ACTIVE" ? "有効" : partner.status === "PENDING" ? "審査中" : "停止"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{partner.email}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>
              コード:{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">{partner.code}</code>
            </span>
            <span>報酬率: {partner.commissionRate}%</span>
            <span>冷却期間: {partner.coolingPeriodDays}日</span>
          </div>
        </div>
      </div>

      {/* KPIカード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総クリック</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {partner.affiliateLinks.length}リンク
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総成約数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">累計</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成約率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">クリック対比</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累計報酬</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">却下除く</p>
          </CardContent>
        </Card>
      </div>

      {/* コンバージョン一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>コンバージョン履歴</CardTitle>
          <CardDescription>直近50件</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>成約日</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead>支払可能日</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partner.affiliateConversions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    コンバージョンがありません
                  </TableCell>
                </TableRow>
              ) : (
                partner.affiliateConversions.map((conversion) => (
                  <TableRow key={conversion.id}>
                    <TableCell>
                      {new Date(conversion.createdAt).toLocaleDateString("ja-JP")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ¥{conversion.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {conversion.payableAt
                        ? new Date(conversion.payableAt).toLocaleDateString("ja-JP")
                        : "-"}
                    </TableCell>
                    <TableCell>{getConversionStatusBadge(conversion.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 支払い履歴 */}
      <Card>
        <CardHeader>
          <CardTitle>支払い履歴</CardTitle>
          <CardDescription>直近20件</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申請日</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead>支払方法</TableHead>
                <TableHead>支払日</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partner.payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    支払い履歴がありません
                  </TableCell>
                </TableRow>
              ) : (
                partner.payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      {new Date(payout.createdAt).toLocaleDateString("ja-JP")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ¥{payout.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {payout.paymentMethod === "BANK_TRANSFER"
                        ? "銀行振込"
                        : payout.paymentMethod ?? "-"}
                    </TableCell>
                    <TableCell>
                      {payout.paidAt
                        ? new Date(payout.paidAt).toLocaleDateString("ja-JP")
                        : "-"}
                    </TableCell>
                    <TableCell>{getPayoutStatusBadge(payout.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
