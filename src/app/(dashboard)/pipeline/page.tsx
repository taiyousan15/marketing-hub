'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DealKanban } from '@/components/pipeline/deal-kanban';
import { DealForm } from '@/components/pipeline/deal-form';
import { getPipelines, createPipeline, getDeals } from '@/actions/pipeline';
import { toast } from 'sonner';

type Pipeline = Awaited<ReturnType<typeof getPipelines>>[0];
type Deal = Awaited<ReturnType<typeof getDeals>>[0];

export default function PipelinePage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [isDealFormOpen, setIsDealFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDeals = useCallback(async (pipelineId: string) => {
    try {
      const dealData = await getDeals(pipelineId);
      setDeals(dealData as Deal[]);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    }
  }, []);

  const fetchPipelines = useCallback(async (initialPipelineId?: string) => {
    setLoading(true);
    try {
      const data = await getPipelines();
      setPipelines(data);
      const targetId = initialPipelineId ?? selectedPipelineId ?? data[0]?.id;
      if (targetId) {
        setSelectedPipelineId(targetId);
        await fetchDeals(targetId);
      }
    } catch (error) {
      console.error('Failed to fetch pipelines:', error);
      toast.error('パイプラインの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [selectedPipelineId, fetchDeals]);

  useEffect(() => {
    fetchPipelines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectPipeline = async (id: string) => {
    setSelectedPipelineId(id);
    setLoading(true);
    try {
      await fetchDeals(id);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDefaultPipeline = async () => {
    try {
      const pipeline = await createPipeline({ name: 'セールスパイプライン' });
      await fetchPipelines(pipeline.id);
      toast.success('パイプラインを作成しました');
    } catch (error) {
      console.error('Failed to create pipeline:', error);
      toast.error('パイプラインの作成に失敗しました');
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!selectedPipelineId) return;
    await fetchDeals(selectedPipelineId);
  }, [selectedPipelineId, fetchDeals]);

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM パイプライン</h1>
          <p className="text-muted-foreground">案件をステージで管理します</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            更新
          </Button>
          {selectedPipelineId && (
            <Button size="sm" onClick={() => setIsDealFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              案件追加
            </Button>
          )}
        </div>
      </div>

      {pipelines.length > 1 && (
        <div className="flex gap-2">
          {pipelines.map(p => (
            <Button
              key={p.id}
              variant={selectedPipelineId === p.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSelectPipeline(p.id)}
            >
              {p.name}
            </Button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center flex-1 py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : pipelines.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-24 text-center">
          <p className="text-muted-foreground mb-4">パイプラインがありません</p>
          <Button onClick={handleCreateDefaultPipeline}>
            <Plus className="h-4 w-4 mr-1" />
            パイプラインを作成
          </Button>
        </div>
      ) : selectedPipeline ? (
        <div className="flex-1 overflow-auto">
          <DealKanban
            pipelineId={selectedPipeline.id}
            stages={selectedPipeline.stages}
            deals={deals}
            onAddDeal={() => setIsDealFormOpen(true)}
            onRefresh={handleRefresh}
          />
        </div>
      ) : null}

      {selectedPipeline && (
        <DealForm
          open={isDealFormOpen}
          pipelineId={selectedPipeline.id}
          stages={selectedPipeline.stages}
          onClose={() => setIsDealFormOpen(false)}
          onCreated={handleRefresh}
        />
      )}
    </div>
  );
}
