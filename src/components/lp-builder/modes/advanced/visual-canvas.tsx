'use client';

/**
 * UTAGE形式ビジュアルキャンバス - Not implemented
 */

import { Card } from '@/components/ui/card';
import { ComponentInstance } from '../../types';

interface VisualCanvasProps {
  [key: string]: any;
}

export function VisualCanvas(props: VisualCanvasProps) {
  return (
    <Card className="w-full h-full bg-white flex items-center justify-center">
      <div className="text-center text-muted-foreground p-8">
        <p>Visual canvas is not implemented</p>
      </div>
    </Card>
  );
}
