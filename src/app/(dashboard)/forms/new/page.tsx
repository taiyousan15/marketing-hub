'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createForm } from '@/actions/forms';
import { toast } from 'sonner';

export default function NewFormPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('フォーム名を入力してください');
      return;
    }
    setLoading(true);
    try {
      const form = await createForm({ name: name.trim(), description: description.trim() || undefined });
      toast.success('フォームを作成しました');
      router.push(`/forms/${form.id}`);
    } catch (error) {
      console.error('Failed to create form:', error);
      toast.error('フォームの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/forms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">新規フォーム</h1>
          <p className="text-muted-foreground">フォームの基本情報を設定します</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">フォーム名 *</Label>
              <Input
                id="name"
                placeholder="例: お問い合わせフォーム"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">説明（任意）</Label>
              <Textarea
                id="description"
                placeholder="フォームの説明を入力..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" asChild>
                <Link href="/forms">キャンセル</Link>
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                作成してエディタへ
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
