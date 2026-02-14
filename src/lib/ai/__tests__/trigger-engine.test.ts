import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TriggerEngine } from '../trigger-engine'
import type { Trigger, TriggerEvent } from '../trigger-engine'

describe('TriggerEngine', () => {
  let engine: TriggerEngine

  beforeEach(() => {
    engine = new TriggerEngine()
  })

  describe('Trigger Registration', () => {
    it('should register a new trigger', () => {
      const trigger: Trigger = {
        id: 'trigger_1',
        name: 'Cart Abandonment Trigger',
        type: 'cart_abandoned',
        enabled: true,
        conditions: [
          {
            field: 'cartValue',
            operator: 'gt',
            value: 5000,
          },
        ],
        actions: [
          {
            type: 'send_email',
            template: 'cart_recovery',
            delay: 3600,
          },
        ],
      }

      engine.registerTrigger(trigger)

      const triggers = engine.getTriggers()
      expect(triggers).toHaveLength(1)
      expect(triggers[0].id).toBe('trigger_1')
    })

    it('should disable a trigger', () => {
      const trigger: Trigger = {
        id: 'trigger_2',
        name: 'Test Trigger',
        type: 'cart_abandoned',
        enabled: true,
        conditions: [],
        actions: [],
      }

      engine.registerTrigger(trigger)
      engine.disableTrigger('trigger_2')

      const triggers = engine.getTriggers()
      expect(triggers[0].enabled).toBe(false)
    })

    it('should remove a trigger', () => {
      const trigger: Trigger = {
        id: 'trigger_3',
        name: 'Test Trigger',
        type: 'cart_abandoned',
        enabled: true,
        conditions: [],
        actions: [],
      }

      engine.registerTrigger(trigger)
      engine.removeTrigger('trigger_3')

      const triggers = engine.getTriggers()
      expect(triggers).toHaveLength(0)
    })
  })

  describe('Event Processing', () => {
    it('should process cart abandonment event', async () => {
      const trigger: Trigger = {
        id: 'cart_trigger',
        name: 'Cart Recovery',
        type: 'cart_abandoned',
        enabled: true,
        conditions: [
          {
            field: 'cartValue',
            operator: 'gt',
            value: 5000,
          },
        ],
        actions: [
          {
            type: 'send_email',
            template: 'cart_recovery',
            delay: 3600,
          },
        ],
      }

      engine.registerTrigger(trigger)

      const event: TriggerEvent = {
        type: 'cart_abandoned',
        contactId: 'contact_123',
        data: {
          cartValue: 10000,
          items: ['product_1', 'product_2'],
          abandonedAt: new Date().toISOString(),
        },
      }

      const results = await engine.processEvent(event)

      expect(results).toHaveLength(1)
      expect(results[0].triggered).toBe(true)
      expect(results[0].triggerId).toBe('cart_trigger')
    })

    it('should not trigger when conditions not met', async () => {
      const trigger: Trigger = {
        id: 'high_value_trigger',
        name: 'High Value Cart',
        type: 'cart_abandoned',
        enabled: true,
        conditions: [
          {
            field: 'cartValue',
            operator: 'gt',
            value: 50000,
          },
        ],
        actions: [
          {
            type: 'send_email',
            template: 'vip_recovery',
            delay: 1800,
          },
        ],
      }

      engine.registerTrigger(trigger)

      const event: TriggerEvent = {
        type: 'cart_abandoned',
        contactId: 'contact_456',
        data: {
          cartValue: 10000,
          items: ['product_1'],
          abandonedAt: new Date().toISOString(),
        },
      }

      const results = await engine.processEvent(event)

      expect(results).toHaveLength(1)
      expect(results[0].triggered).toBe(false)
    })

    it('should process multiple matching triggers', async () => {
      const trigger1: Trigger = {
        id: 'trigger_email',
        name: 'Email Trigger',
        type: 'cart_abandoned',
        enabled: true,
        conditions: [
          {
            field: 'cartValue',
            operator: 'gt',
            value: 5000,
          },
        ],
        actions: [
          {
            type: 'send_email',
            template: 'cart_recovery',
            delay: 3600,
          },
        ],
      }

      const trigger2: Trigger = {
        id: 'trigger_line',
        name: 'LINE Trigger',
        type: 'cart_abandoned',
        enabled: true,
        conditions: [
          {
            field: 'cartValue',
            operator: 'gt',
            value: 5000,
          },
        ],
        actions: [
          {
            type: 'send_line',
            template: 'line_cart_recovery',
            delay: 7200,
          },
        ],
      }

      engine.registerTrigger(trigger1)
      engine.registerTrigger(trigger2)

      const event: TriggerEvent = {
        type: 'cart_abandoned',
        contactId: 'contact_789',
        data: {
          cartValue: 10000,
          items: ['product_1'],
          abandonedAt: new Date().toISOString(),
        },
      }

      const results = await engine.processEvent(event)

      const triggered = results.filter(r => r.triggered)
      expect(triggered).toHaveLength(2)
    })
  })

  describe('Condition Evaluation', () => {
    it('should evaluate gt (greater than) condition', () => {
      const condition = {
        field: 'cartValue',
        operator: 'gt' as const,
        value: 5000,
      }

      const data = { cartValue: 10000 }

      const result = engine.evaluateCondition(condition, data)
      expect(result).toBe(true)
    })

    it('should evaluate lt (less than) condition', () => {
      const condition = {
        field: 'cartValue',
        operator: 'lt' as const,
        value: 10000,
      }

      const data = { cartValue: 5000 }

      const result = engine.evaluateCondition(condition, data)
      expect(result).toBe(true)
    })

    it('should evaluate eq (equals) condition', () => {
      const condition = {
        field: 'status',
        operator: 'eq' as const,
        value: 'active',
      }

      const data = { status: 'active' }

      const result = engine.evaluateCondition(condition, data)
      expect(result).toBe(true)
    })

    it('should evaluate contains condition', () => {
      const condition = {
        field: 'tags',
        operator: 'contains' as const,
        value: 'vip',
      }

      const data = { tags: ['vip', 'premium'] }

      const result = engine.evaluateCondition(condition, data)
      expect(result).toBe(true)
    })

    it('should evaluate in condition', () => {
      const condition = {
        field: 'segment',
        operator: 'in' as const,
        value: ['high_value', 'engaged'],
      }

      const data = { segment: 'high_value' }

      const result = engine.evaluateCondition(condition, data)
      expect(result).toBe(true)
    })
  })

  describe('AI-Enhanced Triggers', () => {
    it('should use AI for intent analysis', async () => {
      const trigger: Trigger = {
        id: 'intent_trigger',
        name: 'Purchase Intent Trigger',
        type: 'page_view',
        enabled: true,
        conditions: [],
        actions: [
          {
            type: 'analyze_intent',
          },
        ],
        aiEnhanced: true,
      }

      engine.registerTrigger(trigger)

      const event: TriggerEvent = {
        type: 'page_view',
        contactId: 'contact_ai',
        data: {
          page: '/pricing',
          duration: 120,
          interactions: 5,
        },
      }

      const results = await engine.processEvent(event)

      expect(results[0].aiAnalysis).toBeDefined()
    })

    it('should personalize message content', async () => {
      const trigger: Trigger = {
        id: 'personalized_trigger',
        name: 'Personalized Message',
        type: 'cart_abandoned',
        enabled: true,
        conditions: [],
        actions: [
          {
            type: 'send_email',
            template: 'cart_recovery',
            personalize: true,
          },
        ],
      }

      engine.registerTrigger(trigger)

      const event: TriggerEvent = {
        type: 'cart_abandoned',
        contactId: 'contact_personal',
        data: {
          cartValue: 10000,
          items: ['product_1'],
          abandonedAt: new Date().toISOString(),
          contactData: {
            name: 'John Doe',
            purchaseHistory: ['product_2', 'product_3'],
          },
        },
      }

      const results = await engine.processEvent(event)

      expect(results[0].personalizedContent).toBeDefined()
    })
  })

  describe('Send Time Optimization', () => {
    it('should predict best send time', async () => {
      const trigger: Trigger = {
        id: 'optimized_trigger',
        name: 'Optimized Send Time',
        type: 'cart_abandoned',
        enabled: true,
        conditions: [],
        actions: [
          {
            type: 'send_email',
            template: 'cart_recovery',
            optimizeSendTime: true,
          },
        ],
      }

      engine.registerTrigger(trigger)

      const event: TriggerEvent = {
        type: 'cart_abandoned',
        contactId: 'contact_optimized',
        data: {
          cartValue: 10000,
          items: ['product_1'],
          abandonedAt: new Date().toISOString(),
          contactData: {
            timezone: 'Asia/Tokyo',
            engagementHistory: [
              { time: '14:00', engagement: 'high' },
              { time: '20:00', engagement: 'medium' },
            ],
          },
        },
      }

      const results = await engine.processEvent(event)

      expect(results[0].optimizedSendTime).toBeDefined()
    })
  })

  describe('Event Statistics', () => {
    it('should track trigger execution count', async () => {
      const trigger: Trigger = {
        id: 'stats_trigger',
        name: 'Stats Trigger',
        type: 'cart_abandoned',
        enabled: true,
        conditions: [],
        actions: [
          {
            type: 'send_email',
            template: 'test',
          },
        ],
      }

      engine.registerTrigger(trigger)

      const event: TriggerEvent = {
        type: 'cart_abandoned',
        contactId: 'contact_stats',
        data: {
          cartValue: 5000,
          items: ['product_1'],
          abandonedAt: new Date().toISOString(),
        },
      }

      await engine.processEvent(event)
      await engine.processEvent(event)

      const stats = engine.getStats('stats_trigger')

      expect(stats.executionCount).toBe(2)
    })

    it('should track success rate', async () => {
      const trigger: Trigger = {
        id: 'success_trigger',
        name: 'Success Trigger',
        type: 'cart_abandoned',
        enabled: true,
        conditions: [],
        actions: [
          {
            type: 'send_email',
            template: 'test',
          },
        ],
      }

      engine.registerTrigger(trigger)

      const event: TriggerEvent = {
        type: 'cart_abandoned',
        contactId: 'contact_success',
        data: {
          cartValue: 5000,
          items: ['product_1'],
          abandonedAt: new Date().toISOString(),
        },
      }

      await engine.processEvent(event)

      const stats = engine.getStats('success_trigger')

      expect(stats.successRate).toBeGreaterThanOrEqual(0)
      expect(stats.successRate).toBeLessThanOrEqual(1)
    })
  })
})
