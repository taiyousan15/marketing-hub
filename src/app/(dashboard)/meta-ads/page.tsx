"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, TrendingUp, MousePointerClick, Eye, Users, DollarSign } from "lucide-react"

const TENANT_ID = "demo-tenant"

interface CampaignReport {
  campaignId: string
  campaignName: string
  impressions: number
  clicks: number
  spend: number
  reach: number
  utmContacts: number
  cpc: number
  ctr: number
  cpl: number
  roas: number
}

interface Summary {
  totalSpend: number
  totalClicks: number
  totalImpressions: number
  totalLeads: number
  totalRevenue: number
  avgCpl: number
  avgRoas: number
}

interface Account {
  id: string
  name: string
  adAccountId: string
  lastSyncedAt: string | null
}

export default function MetaAdsPage() {
  const [campaigns, setCampaigns] = useState<CampaignReport[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ tenantId: TENANT_ID })
      if (selectedAccount !== "all") params.set("accountId", selectedAccount)
      const res = await fetch(`/api/meta-ads/report?${params}`)
      const data = await res.json()
      setCampaigns(data.campaigns ?? [])
      setSummary(data.summary ?? null)
      setAccounts(data.accounts ?? [])
    } finally {
      setLoading(false)
    }
  }

  const handleSyncAll = async () => {
    setSyncing(true)
    for (const acc of accounts) {
      await fetch("/api/meta-ads/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: acc.id,
          tenantId: TENANT_ID,
          datePreset: "last_30d",
          level: "campaign",
        }),
      })
    }
    setSyncing(false)
    fetchReport()
  }

  useEffect(() => {
    fetchReport()
  }, [selectedAccount])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(val)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meta広告レポート</h1>
          <p className="text-muted-foreground text-sm mt-1">
            広告費・クリック・流入コンタクト数の一覧
          </p>
        </div>
        <div className="flex items-center gap-2">
          {accounts.length > 1 && (
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="アカウント選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのアカウント</SelectItem>
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={syncing || accounts.length === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "同期中..." : "データ同期"}
          </Button>
        </div>
      </div>

      {accounts.length === 0 && !loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              Meta広告アカウントが連携されていません。
              <a href="/settings/meta-ads" className="underline ml-1">
                設定から連携してください。
              </a>
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* サマリーカード */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">広告費</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(summary.totalSpend)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">クリック数</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {summary.totalClicks.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">獲得リード</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {summary.totalLeads.toLocaleString()}
                  </div>
                  {summary.avgCpl > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      CPL: {formatCurrency(summary.avgCpl)}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">ROAS</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {summary.avgRoas > 0 ? `${summary.avgRoas}x` : "–"}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* キャンペーン一覧テーブル */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">キャンペーン別パフォーマンス</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">読み込み中...</p>
              ) : campaigns.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  データがありません。「データ同期」を実行してください。
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">キャンペーン名</th>
                        <th className="text-right py-2 font-medium">
                          <div className="flex items-center justify-end gap-1">
                            <Eye className="h-3 w-3" />
                            IMP
                          </div>
                        </th>
                        <th className="text-right py-2 font-medium">
                          <div className="flex items-center justify-end gap-1">
                            <MousePointerClick className="h-3 w-3" />
                            Click
                          </div>
                        </th>
                        <th className="text-right py-2 font-medium">CTR</th>
                        <th className="text-right py-2 font-medium">費用</th>
                        <th className="text-right py-2 font-medium">CPC</th>
                        <th className="text-right py-2 font-medium">
                          <div className="flex items-center justify-end gap-1">
                            <Users className="h-3 w-3" />
                            リード
                          </div>
                        </th>
                        <th className="text-right py-2 font-medium">CPL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map(c => (
                        <tr key={c.campaignId} className="border-b last:border-0">
                          <td className="py-2 pr-4 max-w-[200px] truncate">
                            {c.campaignName}
                          </td>
                          <td className="text-right py-2">
                            {c.impressions.toLocaleString()}
                          </td>
                          <td className="text-right py-2">
                            {c.clicks.toLocaleString()}
                          </td>
                          <td className="text-right py-2">{c.ctr}%</td>
                          <td className="text-right py-2">
                            {formatCurrency(c.spend)}
                          </td>
                          <td className="text-right py-2">
                            {c.cpc > 0 ? formatCurrency(c.cpc) : "–"}
                          </td>
                          <td className="text-right py-2">
                            {c.utmContacts > 0 ? (
                              <Badge variant="secondary">{c.utmContacts}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                          <td className="text-right py-2">
                            {c.cpl > 0 ? formatCurrency(c.cpl) : "–"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
