'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createDeal } from '@/actions/pipeline';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  order: number;
}

interface DealFormProps {
  open: boolean;
  pipelineId: string;
  stages: Stage[];
  onClose: () => void;
  onCreated: () => void;
}

const schema = z.object({
  title: z.string().min(1, '案件名は必須です'),
  stageId: z.string().min(1, 'ステージを選択してください'),
  amount: z.number().int().min(0).default(0),
});

export function DealForm({ open, pipelineId, stages, onClose, onCreated }: DealFormProps) {
  const [title, setTitle] = useState('');
  const [stageId, setStageId] = useState(stages[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      schema.parse({ title, stageId, amount: parseInt(amount || '0', 10) });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0].message);
        return;
      }
    }

    setLoading(true);
    try {
      await createDeal({
        pipelineId,
        stageId,
        title,
        amount: parseInt(amount || '0', 10),
      });
      toast.success('案件を作成しました');
      setTitle('');
      setAmount('');
      onCreated();
      onClose();
    } catch (error) {
      toast.error('案件の作成に失敗しました');
      console.error('Failed to create deal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新規案件作成</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>案件名 *</Label>
            <Input
              placeholder="例: 株式会社〇〇 マーケティングツール導入"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>ステージ</Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>金額 (円)</Label>
            <Input
              type="number"
              placeholder="0"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            作成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
