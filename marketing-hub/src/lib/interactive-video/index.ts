// Re-export all types and utilities
export {
  createInteractiveVideoMachine,
  generateAIRecommendation,
  defaultVideoConfig,
  type VideoSegment,
  type BranchOption,
  type Hotspot,
  type CTAConfig,
  type VideoContext,
  type VideoEvent,
} from './state-machine';

// Component exports
export { SmartVSLPlayer } from '@/components/interactive-video/smart-vsl-player';
export { BranchingOverlay } from '@/components/interactive-video/branching-overlay';
export { HotspotComponent } from '@/components/interactive-video/hotspot';
export { CTAOverlay } from '@/components/interactive-video/cta-overlay';
export { DecisionTimer } from '@/components/interactive-video/decision-timer';
