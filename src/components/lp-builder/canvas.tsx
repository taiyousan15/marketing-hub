'use client';

/**
 * LP Builder キャンバスコンポーネント - Not implemented
 */

import { Card } from '@/components/ui/card';
import { ComponentInstance } from './types';

interface CanvasProps {
  components: ComponentInstance[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (components: ComponentInstance[]) => void;
  onDelete: (id: string) => void;
}

export function Canvas({
  components,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
}: CanvasProps) {
  return (
    <Card className="w-full h-full bg-white flex items-center justify-center">
      <div className="text-center text-muted-foreground p-8">
        <p>LP Builder canvas is not implemented</p>
      </div>
    </Card>
  );
}
