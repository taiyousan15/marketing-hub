'use client';

/**
 * Advanced LP Builder Canvas - Not implemented
 */

import { Card } from '@/components/ui/card';

interface CanvasProps {
  [key: string]: any;
}

export function Canvas(props: CanvasProps) {
  return (
    <Card className="w-full h-full bg-white flex items-center justify-center">
      <div className="text-center text-muted-foreground p-8">
        <p>Advanced LP Builder canvas is not implemented</p>
      </div>
    </Card>
  );
}
