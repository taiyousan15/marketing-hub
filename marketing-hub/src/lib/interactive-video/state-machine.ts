import { createMachine, assign } from 'xstate';

// Types for video interaction
export interface VideoSegment {
  id: string;
  videoUrl: string;
  startTime?: number;
  duration?: number;
  title: string;
  description?: string;
}

export interface BranchOption {
  id: string;
  label: string;
  description?: string;
  nextState: string;
  icon?: string;
}

export interface Hotspot {
  id: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  label: string;
  action: string;
  triggerTime: number; // seconds
  hideTime?: number; // seconds
}

export interface CTAConfig {
  id: string;
  text: string;
  url?: string;
  action?: string;
  variant?: 'primary' | 'secondary';
  showAt: number; // seconds
  hideAt?: number; // seconds
}

export interface VideoContext {
  currentSegment: VideoSegment | null;
  selectedBranch: string | null;
  viewerProfile: {
    level?: 'beginner' | 'intermediate' | 'advanced';
    interests: string[];
    previousChoices: string[];
  };
  trackingData: {
    startTime: number;
    watchTime: number;
    clicks: Array<{ type: string; timestamp: number; data: unknown }>;
    branches: Array<{ from: string; to: string; timestamp: number }>;
  };
  ctaShown: string[];
  hotspotClicks: string[];
  aiRecommendation?: string;
}

export type VideoEvent =
  | { type: 'START' }
  | { type: 'VIDEO_ENDED' }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'SELECT_BRANCH'; branch: string }
  | { type: 'CLICK_HOTSPOT'; hotspotId: string }
  | { type: 'CLICK_CTA'; ctaId: string }
  | { type: 'AI_RECOMMEND'; recommendation: string }
  | { type: 'SKIP_TO'; state: string }
  | { type: 'TRACK_VIEW_TIME'; seconds: number };

export const createInteractiveVideoMachine = (config: {
  segments: Record<string, VideoSegment>;
  branches: Record<string, BranchOption[]>;
  hotspots?: Record<string, Hotspot[]>;
  ctas?: Record<string, CTAConfig[]>;
}) => {
  return createMachine(
    {
      id: 'interactiveVideo',
      initial: 'idle',
      context: {
        currentSegment: null,
        selectedBranch: null,
        viewerProfile: {
          interests: [],
          previousChoices: [],
        },
        trackingData: {
          startTime: Date.now(),
          watchTime: 0,
          clicks: [],
          branches: [],
        },
        ctaShown: [],
        hotspotClicks: [],
      } as VideoContext,
      states: {
        idle: {
          on: {
            START: {
              target: 'intro',
              actions: 'initializeTracking',
            },
          },
        },
        intro: {
          entry: 'loadSegment',
          on: {
            VIDEO_ENDED: 'problem',
            TIMER_EXPIRED: 'problem',
            CLICK_HOTSPOT: {
              actions: 'trackHotspotClick',
            },
            CLICK_CTA: {
              target: 'checkout',
              actions: 'trackCTAClick',
            },
            TRACK_VIEW_TIME: {
              actions: 'updateWatchTime',
            },
          },
        },
        problem: {
          entry: 'loadSegment',
          on: {
            VIDEO_ENDED: 'branchSelection',
            SELECT_BRANCH: {
              target: 'branchSelection',
              actions: 'selectBranch',
            },
            CLICK_HOTSPOT: {
              actions: 'trackHotspotClick',
            },
            TRACK_VIEW_TIME: {
              actions: 'updateWatchTime',
            },
          },
        },
        branchSelection: {
          entry: 'prepareAIRecommendation',
          on: {
            SELECT_BRANCH: [
              {
                target: 'solutionBeginner',
                guard: 'isBeginner',
                actions: 'recordBranchChoice',
              },
              {
                target: 'solutionIntermediate',
                guard: 'isIntermediate',
                actions: 'recordBranchChoice',
              },
              {
                target: 'solutionAdvanced',
                guard: 'isAdvanced',
                actions: 'recordBranchChoice',
              },
            ],
            AI_RECOMMEND: {
              actions: 'applyAIRecommendation',
            },
            TIMER_EXPIRED: {
              target: 'solutionIntermediate',
              actions: 'recordAutoChoice',
            },
          },
        },
        solutionBeginner: {
          entry: 'loadSegment',
          on: {
            VIDEO_ENDED: 'offerBeginner',
            CLICK_CTA: {
              target: 'checkout',
              actions: 'trackCTAClick',
            },
            TRACK_VIEW_TIME: {
              actions: 'updateWatchTime',
            },
          },
        },
        solutionIntermediate: {
          entry: 'loadSegment',
          on: {
            VIDEO_ENDED: 'offerIntermediate',
            CLICK_CTA: {
              target: 'checkout',
              actions: 'trackCTAClick',
            },
            TRACK_VIEW_TIME: {
              actions: 'updateWatchTime',
            },
          },
        },
        solutionAdvanced: {
          entry: 'loadSegment',
          on: {
            VIDEO_ENDED: 'offerAdvanced',
            CLICK_CTA: {
              target: 'checkout',
              actions: 'trackCTAClick',
            },
            TRACK_VIEW_TIME: {
              actions: 'updateWatchTime',
            },
          },
        },
        offerBeginner: {
          entry: 'loadSegment',
          on: {
            CLICK_CTA: {
              target: 'checkout',
              actions: 'trackCTAClick',
            },
            VIDEO_ENDED: 'completed',
            TRACK_VIEW_TIME: {
              actions: 'updateWatchTime',
            },
          },
        },
        offerIntermediate: {
          entry: 'loadSegment',
          on: {
            CLICK_CTA: {
              target: 'checkout',
              actions: 'trackCTAClick',
            },
            VIDEO_ENDED: 'completed',
            TRACK_VIEW_TIME: {
              actions: 'updateWatchTime',
            },
          },
        },
        offerAdvanced: {
          entry: 'loadSegment',
          on: {
            CLICK_CTA: {
              target: 'checkout',
              actions: 'trackCTAClick',
            },
            VIDEO_ENDED: 'completed',
            TRACK_VIEW_TIME: {
              actions: 'updateWatchTime',
            },
          },
        },
        checkout: {
          entry: 'sendToCheckout',
          type: 'final',
        },
        completed: {
          entry: 'trackCompletion',
          type: 'final',
        },
      },
    },
    {
      actions: {
        initializeTracking: assign({
          trackingData: ({ context }) => ({
            ...context.trackingData,
            startTime: Date.now(),
          }),
        }),
        loadSegment: assign({
          currentSegment: ({ context }, params) => {
            const state = params as unknown as { state: { value: string } };
            const stateValue =
              typeof state === 'string' ? state : String(state);
            return config.segments[stateValue] || context.currentSegment;
          },
        }),
        selectBranch: assign({
          selectedBranch: ({ event }) =>
            'branch' in event ? event.branch : null,
        }),
        recordBranchChoice: assign({
          viewerProfile: ({ context, event }) => ({
            ...context.viewerProfile,
            previousChoices: [
              ...context.viewerProfile.previousChoices,
              'branch' in event ? event.branch : 'unknown',
            ],
          }),
          trackingData: ({ context, event }) => ({
            ...context.trackingData,
            branches: [
              ...context.trackingData.branches,
              {
                from: context.currentSegment?.id || 'unknown',
                to: 'branch' in event ? event.branch : 'unknown',
                timestamp: Date.now(),
              },
            ],
          }),
        }),
        recordAutoChoice: assign({
          viewerProfile: ({ context }) => ({
            ...context.viewerProfile,
            previousChoices: [
              ...context.viewerProfile.previousChoices,
              'auto_intermediate',
            ],
          }),
        }),
        trackHotspotClick: assign({
          hotspotClicks: ({ context, event }) => [
            ...context.hotspotClicks,
            'hotspotId' in event ? event.hotspotId : 'unknown',
          ],
          trackingData: ({ context, event }) => ({
            ...context.trackingData,
            clicks: [
              ...context.trackingData.clicks,
              {
                type: 'hotspot',
                timestamp: Date.now(),
                data: { hotspotId: 'hotspotId' in event ? event.hotspotId : 'unknown' },
              },
            ],
          }),
        }),
        trackCTAClick: assign({
          ctaShown: ({ context, event }) => [
            ...context.ctaShown,
            'ctaId' in event ? event.ctaId : 'unknown',
          ],
          trackingData: ({ context, event }) => ({
            ...context.trackingData,
            clicks: [
              ...context.trackingData.clicks,
              {
                type: 'cta',
                timestamp: Date.now(),
                data: { ctaId: 'ctaId' in event ? event.ctaId : 'unknown' },
              },
            ],
          }),
        }),
        updateWatchTime: assign({
          trackingData: ({ context, event }) => ({
            ...context.trackingData,
            watchTime:
              context.trackingData.watchTime +
              ('seconds' in event ? event.seconds : 0),
          }),
        }),
        prepareAIRecommendation: () => {
          // AI recommendation logic hook
          // Can be extended to call AI service
        },
        applyAIRecommendation: assign({
          aiRecommendation: ({ event }) =>
            'recommendation' in event ? event.recommendation : undefined,
        }),
        sendToCheckout: ({ context }) => {
          // Redirect to checkout or trigger checkout modal
          if (typeof window !== 'undefined') {
            const checkoutUrl = `/checkout?segment=${context.currentSegment?.id}&branch=${context.selectedBranch}`;
            window.location.href = checkoutUrl;
          }
        },
        trackCompletion: ({ context }) => {
          // Send completion tracking data to API
          if (typeof window !== 'undefined') {
            fetch('/api/interactive-video/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'completion',
                data: context.trackingData,
              }),
            }).catch((error) => {
              console.error('Failed to track completion:', error);
            });
          }
        },
      },
      guards: {
        isBeginner: ({ context, event }) => {
          const branch = 'branch' in event ? event.branch : null;
          return (
            branch === 'beginner' ||
            context.viewerProfile.level === 'beginner'
          );
        },
        isIntermediate: ({ context, event }) => {
          const branch = 'branch' in event ? event.branch : null;
          return (
            branch === 'intermediate' ||
            context.viewerProfile.level === 'intermediate'
          );
        },
        isAdvanced: ({ context, event }) => {
          const branch = 'branch' in event ? event.branch : null;
          return (
            branch === 'advanced' || context.viewerProfile.level === 'advanced'
          );
        },
      },
    }
  );
};

// Helper function to generate AI-based recommendation
export const generateAIRecommendation = async (
  context: VideoContext
): Promise<string> => {
  // This can be extended to call an AI service
  const { viewerProfile, trackingData } = context;

  // Simple heuristic for now
  const watchTimeRatio =
    trackingData.watchTime / (Date.now() - trackingData.startTime);

  if (watchTimeRatio > 0.8 && trackingData.clicks.length > 5) {
    return 'advanced';
  } else if (watchTimeRatio > 0.5 || trackingData.clicks.length > 2) {
    return 'intermediate';
  } else {
    return 'beginner';
  }
};

// Example configuration
export const defaultVideoConfig = {
  segments: {
    intro: {
      id: 'intro',
      videoUrl: '/videos/intro.mp4',
      duration: 30,
      title: 'Introduction',
      description: 'Welcome to our interactive video experience',
    },
    problem: {
      id: 'problem',
      videoUrl: '/videos/problem.mp4',
      duration: 45,
      title: 'The Problem',
      description: 'Understanding the challenge',
    },
    solutionBeginner: {
      id: 'solutionBeginner',
      videoUrl: '/videos/solution-beginner.mp4',
      duration: 60,
      title: 'Solution for Beginners',
      description: 'Getting started',
    },
    solutionIntermediate: {
      id: 'solutionIntermediate',
      videoUrl: '/videos/solution-intermediate.mp4',
      duration: 60,
      title: 'Solution for Intermediate',
      description: 'Level up your skills',
    },
    solutionAdvanced: {
      id: 'solutionAdvanced',
      videoUrl: '/videos/solution-advanced.mp4',
      duration: 60,
      title: 'Solution for Advanced',
      description: 'Master the technique',
    },
    offerBeginner: {
      id: 'offerBeginner',
      videoUrl: '/videos/offer-beginner.mp4',
      duration: 40,
      title: 'Special Offer - Starter',
      description: 'Perfect for beginners',
    },
    offerIntermediate: {
      id: 'offerIntermediate',
      videoUrl: '/videos/offer-intermediate.mp4',
      duration: 40,
      title: 'Special Offer - Pro',
      description: 'Take your skills further',
    },
    offerAdvanced: {
      id: 'offerAdvanced',
      videoUrl: '/videos/offer-advanced.mp4',
      duration: 40,
      title: 'Special Offer - Expert',
      description: 'Unlock full potential',
    },
  },
  branches: {
    problem: [
      {
        id: 'beginner',
        label: '初心者向け',
        description: 'まずは基礎から',
        nextState: 'solutionBeginner',
      },
      {
        id: 'intermediate',
        label: '中級者向け',
        description: 'スキルアップしたい',
        nextState: 'solutionIntermediate',
      },
      {
        id: 'advanced',
        label: '上級者向け',
        description: 'プロレベルを目指す',
        nextState: 'solutionAdvanced',
      },
    ],
  },
  hotspots: {
    intro: [
      {
        id: 'skip-intro',
        x: 80,
        y: 80,
        width: 15,
        height: 10,
        label: 'スキップ',
        action: 'skip_to_problem',
        triggerTime: 5,
        hideTime: 25,
      },
    ],
  },
  ctas: {
    solutionBeginner: [
      {
        id: 'cta-beginner',
        text: '今すぐ始める',
        action: 'checkout',
        variant: 'primary' as const,
        showAt: 50,
      },
    ],
    solutionIntermediate: [
      {
        id: 'cta-intermediate',
        text: 'アップグレード',
        action: 'checkout',
        variant: 'primary' as const,
        showAt: 50,
      },
    ],
    solutionAdvanced: [
      {
        id: 'cta-advanced',
        text: 'マスタープランに参加',
        action: 'checkout',
        variant: 'primary' as const,
        showAt: 50,
      },
    ],
  },
};
