/**
 * Intent Analyzer Class Wrapper
 * Object-oriented interface for testing compatibility
 */

import {
  calculateIntentScoreFromMessage,
  calculateIntentScoreFromBehaviors,
  determineIntentLevel,
  decideBranch,
  type IntentAnalysisResult,
  type PurchaseIntentLevel,
  type PurchaseBarrier,
  type CustomerPsychologyPhase,
} from "./intent-analyzer";

/**
 * Intent Signal for class-based API
 */
export interface IntentSignal {
  type: "page_view" | "cart_add" | "checkout_start" | "form_fill" | "download" |
        "search" | "unsubscribe" | "cart_abandoned";
  page?: string;
  duration?: number;
  productId?: string;
  formType?: string;
  resource?: string;
  query?: string;
  timestamp: Date;
  weight: number;
}

/**
 * Purchase Intent result for class-based API
 */
export interface PurchaseIntent {
  level: PurchaseIntentLevel;
  score: number;
  confidence: number;
  barriers: Array<{
    type: PurchaseBarrier;
    severity: number;
  }>;
  recommendedActions: Array<{
    type: string;
    priority: number;
  }>;
  suggestedSegment: string;
}

/**
 * IntentAnalyzer Class - Object-oriented wrapper for functional API
 *
 * This class provides a stateful, object-oriented interface for intent analysis,
 * making it compatible with class-based tests while maintaining the underlying
 * functional implementation.
 */
export class IntentAnalyzer {
  /**
   * Analyze purchase intent from signals
   */
  async analyzePurchaseIntent(
    contactId: string,
    signals: IntentSignal[]
  ): Promise<PurchaseIntent> {
    // Calculate weighted score from signals
    let totalWeight = 0;
    let signalCount = 0;

    const recentDate = new Date();

    for (const signal of signals) {
      // Apply time decay
      const age = recentDate.getTime() - signal.timestamp.getTime();
      const weekInMs = 7 * 24 * 60 * 60 * 1000;
      const timeDecay = Math.max(0, 1 - (age / weekInMs));

      const adjustedWeight = signal.weight * timeDecay;
      totalWeight += adjustedWeight;
      signalCount++;
    }

    // Score = sum of weights normalized by sqrt of signal count, scaled to 0-100
    const normalizedScore = signalCount > 0 ? totalWeight / Math.sqrt(signalCount) : 0;
    const score = Math.min(100, Math.max(0, normalizedScore * 100));
    const level = determineIntentLevel(score);

    // Detect barriers based on signals
    const barriers: Array<{ type: PurchaseBarrier; severity: number }> = [];

    const hasCartAbandonment = signals.some(s => s.type === "cart_abandoned");
    const hasPricingView = signals.some(s => s.page === "/pricing");
    const hasUnsubscribe = signals.some(s => s.type === "unsubscribe");
    const hasFeatureSearch = signals.some(s =>
      s.type === "search" && s.query &&
      (s.query.includes("integration") || s.query.includes("feature"))
    );
    const hasFeaturesPageView = signals.some(s => s.page === "/features");

    if (hasCartAbandonment && hasPricingView) {
      barriers.push({ type: "price", severity: 0.8 });
    }

    if (hasFeatureSearch && hasFeaturesPageView) {
      barriers.push({ type: "feature_gap", severity: 0.7 }); // Feature gap detected
    }

    if (signals.filter(s => s.page === "/reviews" || s.page === "/testimonials").length >= 1) {
      barriers.push({ type: "trust", severity: 0.6 });
    }

    if (signals.filter(s => s.type === "search").length >= 3) {
      barriers.push({ type: "information", severity: 0.5 });
    }

    // Determine recommended actions
    const recommendedActions: Array<{ type: string; priority: number }> = [];

    if (level === "very_high" || level === "high") {
      recommendedActions.push({ type: "immediate_contact", priority: 1 });
      recommendedActions.push({ type: "offer_discount", priority: 2 });
    }

    if (barriers.some(b => b.type === "price")) {
      recommendedActions.push({ type: "offer_discount", priority: 1 });
      recommendedActions.push({ type: "show_value", priority: 2 });
    }

    if (barriers.some(b => b.type === "trust")) {
      recommendedActions.push({ type: "show_social_proof", priority: 1 });
      recommendedActions.push({ type: "offer_guarantee", priority: 2 });
    }

    if (level === "low" || level === "very_low") {
      recommendedActions.push({ type: "provide_education", priority: 1 });
      recommendedActions.push({ type: "nurture_sequence", priority: 2 });
    }

    // Determine suggested segment
    let suggestedSegment = "nurturing";

    // Detect educational content consumption (downloads indicate education phase)
    const hasEducationalContent = signals.some(s =>
      s.type === "download" &&
      (s.resource === "whitepaper" || s.resource === "ebook" || s.resource)
    );

    if (level === "very_high" || (level === "high" && barriers.length === 0)) {
      suggestedSegment = "purchase_ready";
    } else if (level === "high" && barriers.length > 0) {
      if (barriers[0].type === "price") {
        suggestedSegment = "objection_price";
      } else if (barriers[0].type === "trust") {
        suggestedSegment = "objection_trust";
      }
    } else if (level === "very_low" || (level === "low" && hasEducationalContent)) {
      // Very low intent OR low intent with educational content → education segment
      suggestedSegment = "education";
    } else if (hasUnsubscribe) {
      suggestedSegment = "reengagement";
    }

    // Calculate confidence based on signal quality and quantity
    const maxWeight = signals.length > 0 ? Math.max(...signals.map(s => Math.abs(s.weight))) : 0;
    let confidence = Math.min(1, signals.length / 10);  // Base: signal count

    // Boost confidence for strong signals (high weight = strong purchase intent signal)
    if (maxWeight >= 0.7) {
      confidence = Math.max(confidence, 0.85);  // checkout_start, purchase signals
    } else if (maxWeight >= 0.5) {
      confidence = Math.max(confidence, 0.7);   // cart_add signals
    } else if (maxWeight >= 0.3) {
      confidence = Math.max(confidence, 0.5);   // pricing page views
    }

    // Boost for many signals
    if (signals.length >= 15) {
      confidence = Math.max(confidence, 0.8);
    } else if (signals.length >= 10) {
      confidence = Math.max(confidence, 0.7);
    }

    return {
      level,
      score: score / 100, // Convert from 0-100 to 0-1 scale
      confidence,
      barriers,
      recommendedActions,
      suggestedSegment,
    };
  }
}
