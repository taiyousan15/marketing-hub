'use client';

import { useParams } from 'next/navigation';
import { LPBuilder } from '@/components/lp-builder';

export default function FunnelBuilderPage() {
  const params = useParams();
  const funnelId = params.id as string;

  return (
    <div className="h-[calc(100vh-64px)] -m-6">
      <LPBuilder />
    </div>
  );
}
