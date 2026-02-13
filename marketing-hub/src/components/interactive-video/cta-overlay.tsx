'use client';

// Stub component - interactive video functionality not yet implemented
interface CTAOverlayProps {
  cta: {
    id: string;
    text: string;
    url?: string;
    action?: string;
    variant?: 'primary' | 'secondary';
    showAt: number;
    hideAt?: number;
  };
  onClick: () => void;
}

export function CTAOverlay({ cta, onClick }: CTAOverlayProps) {
  return null;
}
