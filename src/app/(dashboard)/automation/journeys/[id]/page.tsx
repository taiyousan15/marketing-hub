import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { JourneyCanvas } from '@/components/journey/journey-canvas';
import { getJourney } from '@/actions/journey';
import type { JourneyNodeType } from '@prisma/client';

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  DRAFT: { label: '下書き', class: 'bg-gray-100 text-gray-600' },
  ACTIVE: { label: '稼働中', class: 'bg-green-100 text-green-700' },
  PAUSED: { label: '一時停止', class: 'bg-yellow-100 text-yellow-700' },
  ARCHIVED: { label: 'アーカイブ', class: 'bg-gray-100 text-gray-500' },
};

export default async function JourneyEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const journey = await getJourney(id);

  if (!journey) notFound();

  const statusInfo = STATUS_LABELS[journey.status] ?? { label: journey.status, class: '' };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -mx-4 -mt-4">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/automation/journeys">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">{journey.name}</h1>
          <Badge className={statusInfo.class}>{statusInfo.label}</Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {journey.nodes.length}ノード / {journey.edges.length}エッジ
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <JourneyCanvas
          journeyId={journey.id}
          initialNodes={journey.nodes.map(n => ({
            id: n.id,
            type: n.type as JourneyNodeType,
            label: n.label,
            positionX: n.positionX,
            positionY: n.positionY,
            config: n.config as Record<string, unknown>,
          }))}
          initialEdges={journey.edges.map(e => ({
            id: e.id,
            sourceId: e.sourceId,
            targetId: e.targetId,
            label: e.label,
          }))}
        />
      </div>
    </div>
  );
}
