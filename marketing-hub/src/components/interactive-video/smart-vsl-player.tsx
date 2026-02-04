'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import {
  createInteractiveVideoMachine,
  type VideoSegment,
  type BranchOption,
  type Hotspot,
  type CTAConfig,
} from '@/lib/interactive-video/state-machine';
import { BranchingOverlay } from './branching-overlay';
import { HotspotComponent } from './hotspot';
import { CTAOverlay } from './cta-overlay';
import { DecisionTimer } from './decision-timer';

interface SmartVSLPlayerProps {
  config: {
    segments: Record<string, VideoSegment>;
    branches: Record<string, BranchOption[]>;
    hotspots?: Record<string, Hotspot[]>;
    ctas?: Record<string, CTAConfig[]>;
  };
  autoPlay?: boolean;
  onStateChange?: (state: string) => void;
  onTrackingEvent?: (event: {
    type: string;
    timestamp: number;
    data: unknown;
  }) => void;
}

export function SmartVSLPlayer({
  config,
  autoPlay = false,
  onStateChange,
  onTrackingEvent,
}: SmartVSLPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showBranching, setShowBranching] = useState(false);
  const [activeHotspots, setActiveHotspots] = useState<Hotspot[]>([]);
  const [activeCTAs, setActiveCTAs] = useState<CTAConfig[]>([]);

  // Memoize machine to prevent infinite re-renders
  const machine = useMemo(() => createInteractiveVideoMachine(config), [config]);
  const [state, send] = useMachine(machine);

  const currentSegment = state.context.currentSegment;
  const currentStateValue = String(state.value);

  // Handle state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(currentStateValue);
    }
  }, [currentStateValue, onStateChange]);

  // Load video segment
  useEffect(() => {
    if (currentSegment && videoRef.current) {
      const video = videoRef.current;
      video.src = currentSegment.videoUrl;

      if (autoPlay || currentStateValue !== 'idle') {
        video.play().catch((error) => {
          console.error('Failed to autoplay video:', error);
        });
      }
    }
  }, [currentSegment, autoPlay, currentStateValue]);

  // Track watch time
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        send({ type: 'TRACK_VIEW_TIME', seconds: 1 });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [send]);

  // Update active hotspots and CTAs
  useEffect(() => {
    const stateHotspots = config.hotspots?.[currentStateValue] || [];
    const stateCTAs = config.ctas?.[currentStateValue] || [];

    const active = stateHotspots.filter((hotspot) => {
      return (
        currentTime >= hotspot.triggerTime &&
        (!hotspot.hideTime || currentTime < hotspot.hideTime)
      );
    });

    const activeCTAsList = stateCTAs.filter((cta) => {
      return currentTime >= cta.showAt && (!cta.hideAt || currentTime < cta.hideAt);
    });

    setActiveHotspots(active);
    setActiveCTAs(activeCTAsList);
  }, [currentTime, currentStateValue, config.hotspots, config.ctas]);

  // Handle video events
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoEnded = () => {
    const branches = config.branches[currentStateValue];

    if (branches && branches.length > 0) {
      setShowBranching(true);
    } else {
      send({ type: 'VIDEO_ENDED' });
    }
  };

  const handleBranchSelect = (branchId: string) => {
    setShowBranching(false);
    send({ type: 'SELECT_BRANCH', branch: branchId });

    if (onTrackingEvent) {
      onTrackingEvent({
        type: 'branch_selected',
        timestamp: Date.now(),
        data: { branchId, from: currentStateValue },
      });
    }
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    send({ type: 'CLICK_HOTSPOT', hotspotId: hotspot.id });

    if (onTrackingEvent) {
      onTrackingEvent({
        type: 'hotspot_clicked',
        timestamp: Date.now(),
        data: { hotspotId: hotspot.id, action: hotspot.action },
      });
    }

    // Handle hotspot action
    if (hotspot.action === 'skip_to_problem') {
      send({ type: 'SKIP_TO', state: 'problem' });
    }
  };

  const handleCTAClick = (cta: CTAConfig) => {
    send({ type: 'CLICK_CTA', ctaId: cta.id });

    if (onTrackingEvent) {
      onTrackingEvent({
        type: 'cta_clicked',
        timestamp: Date.now(),
        data: { ctaId: cta.id, text: cta.text },
      });
    }

    if (cta.url) {
      window.location.href = cta.url;
    }
  };

  const handleStart = () => {
    send({ type: 'START' });
  };

  const branches = config.branches[currentStateValue] || [];
  const hasTimer = showBranching && branches.length > 1;

  return (
    <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-lg bg-black">
      {/* Video Player */}
      <div className="relative aspect-video">
        {currentStateValue === 'idle' ? (
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-900 to-gray-800">
            <button
              onClick={handleStart}
              className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              動画を開始
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              playsInline
              controls
            >
              <track kind="captions" />
            </video>

            {/* Hotspots */}
            {activeHotspots.map((hotspot) => (
              <HotspotComponent
                key={hotspot.id}
                hotspot={hotspot}
                onClick={() => handleHotspotClick(hotspot)}
              />
            ))}

            {/* CTAs */}
            {activeCTAs.map((cta) => (
              <CTAOverlay
                key={cta.id}
                cta={cta}
                onClick={() => handleCTAClick(cta)}
              />
            ))}

            {/* Branching Overlay */}
            {showBranching && branches.length > 0 && (
              <BranchingOverlay
                branches={branches}
                onSelect={handleBranchSelect}
                aiRecommendation={state.context.aiRecommendation}
              />
            )}

            {/* Decision Timer */}
            {hasTimer && (
              <DecisionTimer
                duration={15}
                onExpire={() => {
                  send({ type: 'TIMER_EXPIRED' });
                  setShowBranching(false);
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Video Info */}
      {currentSegment && (
        <div className="p-4 bg-gray-900 text-white">
          <h3 className="text-xl font-semibold mb-1">{currentSegment.title}</h3>
          {currentSegment.description && (
            <p className="text-sm text-gray-400">{currentSegment.description}</p>
          )}
        </div>
      )}

      {/* Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 text-xs text-gray-500 bg-gray-950 border-t border-gray-800">
          <div>State: {currentStateValue}</div>
          <div>Time: {currentTime.toFixed(1)}s</div>
          <div>Watch Time: {state.context.trackingData.watchTime}s</div>
          <div>Clicks: {state.context.trackingData.clicks.length}</div>
        </div>
      )}
    </div>
  );
}
