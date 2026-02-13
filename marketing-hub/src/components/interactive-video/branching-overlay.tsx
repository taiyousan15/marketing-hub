'use client';

// Stub component - interactive video functionality not yet implemented
interface BranchingOverlayProps {
  branches: Array<{
    id: string;
    label: string;
    description?: string;
    nextState: string;
    icon?: string;
  }>;
  onSelect: (branchId: string) => void;
  aiRecommendation?: string;
}

export function BranchingOverlay({
  branches,
  onSelect,
  aiRecommendation,
}: BranchingOverlayProps) {
  return null;
}
