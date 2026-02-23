'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Mail, Phone, Calendar, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { updateDeal, deleteDeal, addDealActivity } from '@/actions/pipeline';
import type { DealStatus } from '@prisma/client';

interface DealActivity {
  id: string;
  type: string;
  body: string;
  createdAt: string;
}

interface Deal {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: DealStatus;
  closedAt: string | null;
  createdAt: string;
  stage: { id: string; name: string; color: string; probability: number };
  contact: { id: string; name: string; email: string } | null;
  pipeline: { id: string; name: string; stages: { id: string; name: string; color: string }[] };
  activities: DealActivity[];
}

const ACTIVITY_TYPES = [
  { value: 'NOTE', label: 'メモ', icon: '📝' },
  { value: 'CALL', label: '電話', icon: '📞' },
  { value: 'EMAIL', label: 'メール', icon: '✉️' },
  { value: 'MEETING', label: 'ミーティング', icon: '🤝' },
];

const STATUS_LABELS: Record<DealStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  OPEN: { label: '商談中', variant: 'default' },
  WON: { label: '成約', variant: 'default' },
  LOST: { label: '失注', variant: 'destructive' },
};

const JPY_FMT = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' });

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activityType, setActivityType] = useState('NOTE');
  const [activityBody, setActivityBody] = useState('');
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editStatus, setEditStatus] = useState<DealStatus>('OPEN');
  const [editStageId, setEditStageId] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    fetchDeal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDeal = async () => {
    try {
      const res = await fetch(`/api/pipeline/${id}`);
      if (!res.ok) throw new Error('Deal not found');
      const data = await res.json();
      setDeal(data.deal);
      setEditTitle(data.deal.title);
      setEditAmount(String(data.deal.amount));
      setEditStatus(data.deal.status);
      setEditStageId(data.deal.stage.id);
    } catch {
      toast.error('案件の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!deal) return;
    setIsSaving(true);
    try {
      await updateDeal(deal.id, {
        title: editTitle,
        amount: Number(editAmount) || 0,
        status: editStatus,
        stageId: editStageId,
      });
      toast.success('更新しました');
      setEditOpen(false);
      fetchDeal();
    } catch {
      toast.error('更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deal) return;
    if (!confirm(`"${deal.title}" を削除しますか？`)) return;
    try {
      await deleteDeal(deal.id);
      toast.success('案件を削除しました');
      router.push('/pipeline');
    } catch {
      toast.error('削除に失敗しました');
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal || !activityBody.trim()) return;
    setIsAddingActivity(true);
    try {
      await addDealActivity(deal.id, activityType, activityBody.trim());
      setActivityBody('');
      toast.success('アクティビティを追加しました');
      fetchDeal();
    } catch {
      toast.error('追加に失敗しました');
    } finally {
      setIsAddingActivity(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">案件が見つかりません</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/pipeline">← パイプラインに戻る</Link>
        </Button>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[deal.status];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pipeline">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{deal.title}</h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <Badge
                style={{ backgroundColor: deal.stage.color + '20', color: deal.stage.color }}
                className="border-0"
              >
                {deal.stage.name}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {deal.pipeline.name} · {new Date(deal.createdAt).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">編集</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>案件を編集</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>タイトル</Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="案件タイトル"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>金額 (JPY)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>ステージ</Label>
                  <Select value={editStageId} onValueChange={setEditStageId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {deal.pipeline.stages.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>ステータス</Label>
                  <Select value={editStatus} onValueChange={(v) => setEditStatus(v as DealStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">商談中</SelectItem>
                      <SelectItem value="WON">成約</SelectItem>
                      <SelectItem value="LOST">失注</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  保存
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左カラム: 基本情報 */}
        <div className="md:col-span-1 space-y-4">
          {/* 金額カード */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">案件金額</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{JPY_FMT.format(deal.amount)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                成約確率 {deal.stage.probability}%
              </p>
            </CardContent>
          </Card>

          {/* コンタクト */}
          {deal.contact && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">コンタクト</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href={`/contacts/${deal.contact.id}`}
                  className="font-medium hover:underline flex items-center gap-1.5"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {deal.contact.name}
                </Link>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {deal.contact.email}
                </p>
              </CardContent>
            </Card>
          )}

          {/* タイムライン情報 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">タイムライン</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>作成: {new Date(deal.createdAt).toLocaleDateString('ja-JP')}</span>
              </div>
              {deal.closedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>クローズ: {new Date(deal.closedAt).toLocaleDateString('ja-JP')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右カラム: アクティビティ */}
        <div className="md:col-span-2 space-y-4">
          {/* アクティビティ追加フォーム */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">アクティビティを追加</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddActivity} className="space-y-3">
                <div className="flex gap-2">
                  {ACTIVITY_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setActivityType(type.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                        activityType === type.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <span>{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={activityBody}
                  onChange={(e) => setActivityBody(e.target.value)}
                  placeholder="内容を入力..."
                  rows={3}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!activityBody.trim() || isAddingActivity}
                >
                  {isAddingActivity && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  追加
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* アクティビティタイムライン */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                アクティビティ履歴 ({deal.activities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deal.activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  まだアクティビティがありません
                </p>
              ) : (
                <div className="space-y-4">
                  {deal.activities.map((activity) => {
                    const typeInfo = ACTIVITY_TYPES.find((t) => t.value === activity.type);
                    return (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                          {typeInfo?.icon ?? '📌'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              {typeInfo?.label ?? activity.type}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(activity.createdAt).toLocaleString('ja-JP', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-sm mt-0.5 whitespace-pre-wrap">{activity.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
