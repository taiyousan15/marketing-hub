import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IntentAnalyzer } from '../intent-analyzer-class'
import type { PurchaseIntent, IntentSignal } from '../intent-analyzer-class'

describe('IntentAnalyzer', () => {
  let analyzer: IntentAnalyzer

  beforeEach(() => {
    analyzer = new IntentAnalyzer()
  })

  describe('Purchase Intent Analysis', () => {
    it('should detect very high intent', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'page_view',
          page: '/pricing',
          timestamp: new Date(),
          weight: 0.3,
        },
        {
          type: 'cart_add',
          productId: 'product_1',
          timestamp: new Date(),
          weight: 0.5,
        },
        {
          type: 'checkout_start',
          timestamp: new Date(),
          weight: 0.7,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_123', signals)

      expect(intent.level).toBe('very_high')
      expect(intent.score).toBeGreaterThan(0.7)
      expect(intent.confidence).toBeGreaterThan(0.8)
    })

    it('should detect high intent', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'page_view',
          page: '/pricing',
          timestamp: new Date(),
          weight: 0.3,
        },
        {
          type: 'cart_add',
          productId: 'product_1',
          timestamp: new Date(),
          weight: 0.5,
        },
        {
          type: 'page_view',
          page: '/product/premium',
          timestamp: new Date(),
          weight: 0.2,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_456', signals)

      expect(intent.level).toBe('high')
      expect(intent.score).toBeGreaterThan(0.5)
      expect(intent.score).toBeLessThanOrEqual(0.7)
    })

    it('should detect low intent', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'page_view',
          page: '/blog',
          timestamp: new Date(),
          weight: 0.1,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_789', signals)

      expect(intent.level).toBe('low')
      expect(intent.score).toBeLessThanOrEqual(0.3)
    })

    it('should identify purchase barriers', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'page_view',
          page: '/pricing',
          timestamp: new Date(),
          weight: 0.3,
        },
        {
          type: 'cart_add',
          productId: 'product_1',
          timestamp: new Date(),
          weight: 0.5,
        },
        {
          type: 'cart_abandoned',
          timestamp: new Date(),
          weight: -0.3,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_barrier', signals)

      expect(intent.barriers).toBeDefined()
      expect(intent.barriers.length).toBeGreaterThan(0)
    })

    it('should suggest next actions', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'page_view',
          page: '/pricing',
          timestamp: new Date(),
          weight: 0.3,
        },
        {
          type: 'cart_add',
          productId: 'product_1',
          timestamp: new Date(),
          weight: 0.5,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_action', signals)

      expect(intent.recommendedActions).toBeDefined()
      expect(intent.recommendedActions.length).toBeGreaterThan(0)
    })
  })

  describe('Signal Processing', () => {
    it('should weight recent signals higher', async () => {
      const recentSignal: IntentSignal = {
        type: 'cart_add',
        productId: 'product_1',
        timestamp: new Date(),
        weight: 0.5,
      }

      const oldSignal: IntentSignal = {
        type: 'cart_add',
        productId: 'product_2',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        weight: 0.5,
      }

      const recentIntent = await analyzer.analyzePurchaseIntent('contact_recent', [recentSignal])
      const oldIntent = await analyzer.analyzePurchaseIntent('contact_old', [oldSignal])

      expect(recentIntent.score).toBeGreaterThan(oldIntent.score)
    })

    it('should aggregate multiple signals', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'page_view',
          page: '/pricing',
          timestamp: new Date(),
          weight: 0.2,
        },
        {
          type: 'page_view',
          page: '/features',
          timestamp: new Date(),
          weight: 0.2,
        },
        {
          type: 'page_view',
          page: '/testimonials',
          timestamp: new Date(),
          weight: 0.2,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_aggregate', signals)

      expect(intent.score).toBeGreaterThan(0.3)
    })

    it('should handle negative signals', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'cart_add',
          productId: 'product_1',
          timestamp: new Date(),
          weight: 0.5,
        },
        {
          type: 'unsubscribe',
          timestamp: new Date(),
          weight: -0.8,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_negative', signals)

      expect(intent.score).toBeLessThan(0.5)
    })
  })

  describe('Barrier Detection', () => {
    it('should detect price objection', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'page_view',
          page: '/pricing',
          duration: 300,
          timestamp: new Date(),
          weight: 0.3,
        },
        {
          type: 'cart_abandoned',
          timestamp: new Date(),
          weight: -0.3,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_price', signals)

      const hasPriceBarrier = intent.barriers.some(b => b.type === 'price')
      expect(hasPriceBarrier).toBe(true)
    })

    it('should detect trust barrier', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'page_view',
          page: '/reviews',
          duration: 180,
          timestamp: new Date(),
          weight: 0.2,
        },
        {
          type: 'page_view',
          page: '/testimonials',
          duration: 200,
          timestamp: new Date(),
          weight: 0.2,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_trust', signals)

      const hasTrustBarrier = intent.barriers.some(b => b.type === 'trust')
      expect(hasTrustBarrier).toBe(true)
    })

    it('should detect feature gap', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'page_view',
          page: '/features',
          duration: 400,
          timestamp: new Date(),
          weight: 0.2,
        },
        {
          type: 'search',
          query: 'integration with salesforce',
          timestamp: new Date(),
          weight: 0.1,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_feature', signals)

      const hasFeatureBarrier = intent.barriers.some(b => b.type === 'feature_gap')
      expect(hasFeatureBarrier).toBe(true)
    })
  })

  describe('Action Recommendations', () => {
    it('should recommend discount for price-sensitive contacts', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'page_view',
          page: '/pricing',
          duration: 300,
          timestamp: new Date(),
          weight: 0.3,
        },
        {
          type: 'cart_abandoned',
          timestamp: new Date(),
          weight: -0.3,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_discount', signals)

      const hasDiscountAction = intent.recommendedActions.some(
        a => a.type === 'offer_discount'
      )
      expect(hasDiscountAction).toBe(true)
    })

    it('should recommend social proof for trust barriers', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'page_view',
          page: '/reviews',
          duration: 200,
          timestamp: new Date(),
          weight: 0.2,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_social', signals)

      const hasSocialProofAction = intent.recommendedActions.some(
        a => a.type === 'show_social_proof'
      )
      expect(hasSocialProofAction).toBe(true)
    })

    it('should recommend immediate contact for very high intent', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'checkout_start',
          timestamp: new Date(),
          weight: 0.7,
        },
        {
          type: 'form_fill',
          formType: 'contact',
          timestamp: new Date(),
          weight: 0.4,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_immediate', signals)

      const hasImmediateContactAction = intent.recommendedActions.some(
        a => a.type === 'immediate_contact'
      )
      expect(hasImmediateContactAction).toBe(true)
    })
  })

  describe('Segment Assignment', () => {
    it('should assign to purchase_ready segment', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'checkout_start',
          timestamp: new Date(),
          weight: 0.7,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_ready', signals)

      expect(intent.suggestedSegment).toBe('purchase_ready')
    })

    it('should assign to nurturing segment', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'page_view',
          page: '/blog',
          timestamp: new Date(),
          weight: 0.1,
        },
        {
          type: 'page_view',
          page: '/features',
          timestamp: new Date(),
          weight: 0.2,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_nurture', signals)

      expect(intent.suggestedSegment).toBe('nurturing')
    })

    it('should assign to education segment', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'page_view',
          page: '/blog',
          duration: 200,
          timestamp: new Date(),
          weight: 0.1,
        },
        {
          type: 'download',
          resource: 'whitepaper',
          timestamp: new Date(),
          weight: 0.2,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_educate', signals)

      expect(intent.suggestedSegment).toBe('education')
    })
  })

  describe('Confidence Calculation', () => {
    it('should have high confidence with many signals', async () => {
      const signals: IntentSignal[] = Array(20)
        .fill(null)
        .map((_, i) => ({
          type: 'page_view' as const,
          page: `/page-${i}`,
          timestamp: new Date(),
          weight: 0.1,
        }))

      const intent = await analyzer.analyzePurchaseIntent('contact_many_signals', signals)

      expect(intent.confidence).toBeGreaterThan(0.7)
    })

    it('should have low confidence with few signals', async () => {
      const signals: IntentSignal[] = [
        {
          type: 'page_view',
          page: '/blog',
          timestamp: new Date(),
          weight: 0.1,
        },
      ]

      const intent = await analyzer.analyzePurchaseIntent('contact_few_signals', signals)

      expect(intent.confidence).toBeLessThan(0.5)
    })
  })
})
