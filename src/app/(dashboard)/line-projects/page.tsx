"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  BarChart3,
  Wifi,
  WifiOff,
} from "lucide-react"

const TENANT_ID = "demo-tenant"

interface ProjectStats {
  id: string
  name: string
  description: string | null
  color: string
  isActive: boolean
  totalAccounts: number
  activeAccounts: number
  totalFriends: number
  totalContacts: number
  distributionEnabled: boolean
  distributionType: string
  accounts: Array<{
    id: string
    botDisplayName: string | null
    currentFriends: number | null
    isActive: boolean
    isConnected: boolean
  }>
  utmBreakdown: Array<{ source: string; count: number }>
}

interface Summary {
  totalProjects: number
  totalFriends: number
  totalContacts: number
  totalAccounts: number
}

export default function LineProjectsPage() {
  const [projects, setProjects] = useState<ProjectStats[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/line/stats?tenantId=${TENANT_ID}`)
      const data = await res.json()
      setProjects(data.projects ?? [])
      setSummary(data.summary ?? null)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">LINEプロジェクト管理</h1>
          <p className="text-muted-foreground text-sm mt-1">
            プロジェクト別の友達数・流入元・配信状況
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          更新
        </Button>
      </div>

      {/* サマリーカード */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{summary.totalProjects}</div>
              <p className="text-muted-foreground text-sm">プロジェクト数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{summary.totalAccounts}</div>
              <p className="text-muted-foreground text-sm">LINEアカウント数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {summary.totalFriends.toLocaleString()}
              </div>
              <p className="text-muted-foreground text-sm">総友達数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {summary.totalContacts.toLocaleString()}
              </div>
              <p className="text-muted-foreground text-sm">登録コンタクト数</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* プロジェクト一覧 */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              LINEプロジェクトがありません。
              <a href="/settings/line-accounts" className="underline ml-1">
                設定から追加してください。
              </a>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map(project => (
            <Card key={project.id} className="overflow-hidden">
              <div
                className="h-1 w-full"
                style={{ backgroundColor: project.color }}
              />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge variant={project.isActive ? "default" : "secondary"}>
                      {project.isActive ? "有効" : "無効"}
                    </Badge>
                    {project.distributionEnabled && (
                      <Badge variant="outline" className="text-xs">
                        {project.distributionType === "ROUND_ROBIN"
                          ? "ラウンドロビン"
                          : "振り分け中"}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-xs"
                  >
                    <a href="/settings/line-accounts">設定</a>
                  </Button>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">
                        {project.totalAccounts}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        アカウント ({project.activeAccounts}有効)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">
                        {project.totalFriends.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">友達数</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">
                        {project.totalContacts.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">登録者数</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">
                        {project.utmBreakdown.length > 0
                          ? project.utmBreakdown[0].source
                          : "–"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        主要流入元
                      </div>
                    </div>
                  </div>
                </div>

                {/* アカウント一覧 */}
                {project.accounts.length > 0 && (
                  <div className="border rounded-md p-3 mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      アカウント詳細
                    </p>
                    <div className="space-y-1">
                      {project.accounts.map(acc => (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {acc.isConnected ? (
                              <Wifi className="h-3 w-3 text-green-500" />
                            ) : (
                              <WifiOff className="h-3 w-3 text-red-400" />
                            )}
                            <span>{acc.botDisplayName ?? "未設定"}</span>
                          </div>
                          <span className="text-muted-foreground">
                            友達: {(acc.currentFriends ?? 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* UTM流入内訳 */}
                {project.utmBreakdown.length > 0 && (
                  <div className="border rounded-md p-3 mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      流入元内訳（UTM）
                    </p>
                    <div className="space-y-1">
                      {project.utmBreakdown.slice(0, 5).map((utm, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">{utm.source}</span>
                          <span className="font-medium">{utm.count}人</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
