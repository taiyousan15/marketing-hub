'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  FileText,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getForms, deleteForm } from '@/actions/forms';
import { toast } from 'sonner';

type Form = Awaited<ReturnType<typeof getForms>>[0];

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  DRAFT: { label: '下書き', class: 'bg-gray-100 text-gray-700' },
  PUBLISHED: { label: '公開中', class: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'クローズ', class: 'bg-red-100 text-red-600' },
};

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getForms();
      setForms(data);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
      toast.error('フォームの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleDelete = async (id: string) => {
    if (!confirm('このフォームを削除しますか？')) return;
    try {
      await deleteForm(id);
      toast.success('フォームを削除しました');
      fetchForms();
    } catch (error) {
      console.error('Failed to delete form:', error);
      toast.error('削除に失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">フォーム</h1>
          <p className="text-muted-foreground">
            リード獲得・アンケートフォームを管理します
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchForms}>
            <RefreshCw className="h-4 w-4 mr-1" />
            更新
          </Button>
          <Button size="sm" asChild>
            <Link href="/forms/new">
              <Plus className="h-4 w-4 mr-1" />
              新規フォーム
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">フォームがありません</p>
          <Button asChild>
            <Link href="/forms/new">
              <Plus className="h-4 w-4 mr-1" />
              最初のフォームを作成
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map(form => {
            const status = STATUS_MAP[form.status] ?? { label: form.status, class: '' };
            return (
              <Card key={form.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{form.name}</CardTitle>
                      {form.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {form.description}
                        </p>
                      )}
                    </div>
                    <Badge className={`shrink-0 text-xs ${status.class}`}>
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>{form._count.fields}フィールド</span>
                    <span>{form._count.submissions}件の回答</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/forms/${form.id}`}>
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        編集
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/forms/${form.id}/responses`}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        回答
                      </Link>
                    </Button>
                    {form.status === 'PUBLISHED' && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/forms/${form.id}/public`} target="_blank">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(form.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
