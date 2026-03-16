"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"

const TENANT_ID = "demo-tenant"

interface MetaAdsAccount {
  id: string
  name: string
  adAccountId: string
  pixelId: string | null
  businessId: string | null
  isActive: boolean
  lastSyncedAt: string | null
}

interface FormState {
  name: string
  adAccountId: string
  accessToken: string
  pixelId: string
  businessId: string
}

const emptyForm: FormState = {
  name: "",
  adAccountId: "",
  accessToken: "",
  pixelId: "",
  businessId: "",
}

export default function MetaAdsSettingsPage() {
  const [accounts, setAccounts] = useState<MetaAdsAccount[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/meta-ads/accounts?tenantId=${TENANT_ID}`)
      const data = await res.json()
      setAccounts(data.accounts ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/meta-ads/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tenantId: TENANT_ID }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "保存に失敗しました")
        return
      }
      setSuccess("アカウントを追加しました")
      setForm(emptyForm)
      fetchAccounts()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("このアカウントを削除しますか？")) return
    await fetch(`/api/meta-ads/accounts?id=${id}&tenantId=${TENANT_ID}`, {
      method: "DELETE",
    })
    fetchAccounts()
  }

  const handleSync = async (accountId: string) => {
    setSyncingId(accountId)
    try {
      const res = await fetch("/api/meta-ads/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          tenantId: TENANT_ID,
          datePreset: "last_30d",
          level: "campaign",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "同期に失敗しました")
      } else {
        setSuccess(data.message)
        fetchAccounts()
      }
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Meta広告設定</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Meta Business ManagerのAPIアクセストークンと広告アカウントIDを設定します
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* 既存アカウント一覧 */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">接続済みアカウント</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">読み込み中...</p>
            ) : (
              accounts.map(acc => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{acc.name}</span>
                      <Badge variant={acc.isActive ? "default" : "secondary"}>
                        {acc.isActive ? "有効" : "無効"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      アカウントID: {acc.adAccountId}
                      {acc.pixelId && ` / Pixel: ${acc.pixelId}`}
                    </p>
                    {acc.lastSyncedAt && (
                      <p className="text-xs text-muted-foreground">
                        最終同期:{" "}
                        {new Date(acc.lastSyncedAt).toLocaleString("ja-JP")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(acc.id)}
                      disabled={syncingId === acc.id}
                    >
                      <RefreshCw
                        className={`h-3 w-3 mr-1 ${syncingId === acc.id ? "animate-spin" : ""}`}
                      />
                      同期
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(acc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* 新規追加フォーム */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">アカウントを追加</CardTitle>
          <CardDescription>
            Meta Business Manager のアクセストークンを取得して入力してください。
            広告アカウントIDは「広告マネージャー」のURL内の数字です。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>表示名</Label>
            <Input
              placeholder="例: 商品A広告アカウント"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>広告アカウントID</Label>
            <Input
              placeholder="例: act_123456789 または 123456789"
              value={form.adAccountId}
              onChange={e => setForm({ ...form, adAccountId: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Meta Business Manager → 広告アカウント → アカウントID
            </p>
          </div>
          <div className="grid gap-2">
            <Label>アクセストークン</Label>
            <Input
              type="password"
              placeholder="Meta User Access Token"
              value={form.accessToken}
              onChange={e => setForm({ ...form, accessToken: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Graph API Explorer または System User のアクセストークン
              （ads_read権限が必要）
            </p>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>PixelID（任意）</Label>
              <Input
                placeholder="例: 123456789"
                value={form.pixelId}
                onChange={e => setForm({ ...form, pixelId: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Business Manager ID（任意）</Label>
              <Input
                placeholder="例: 987654321"
                value={form.businessId}
                onChange={e =>
                  setForm({ ...form, businessId: e.target.value })
                }
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={
              saving ||
              !form.name ||
              !form.adAccountId ||
              !form.accessToken
            }
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {saving ? "接続テスト中..." : "アカウントを追加"}
          </Button>
        </CardContent>
      </Card>

      {/* UTMトラッキング説明 */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">UTMパラメータ設定について</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Meta広告のリンク先URLに以下のUTMパラメータを付与すると、
            どの広告から流入したか自動追跡されます。
          </p>
          <div className="bg-background p-3 rounded-md font-mono text-xs border">
            ?utm_source=meta&utm_medium=paid&utm_campaign={"{{campaign.name}}"}&utm_content={"{{ad.id}}"}
          </div>
          <p>
            Meta広告マネージャーの「URLパラメータ」欄に貼り付けて使用してください。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
