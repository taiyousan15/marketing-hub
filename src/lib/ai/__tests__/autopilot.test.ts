import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AutopilotSystem } from '../autopilot'
import type { AutopilotConfig } from '../autopilot'

describe('AutopilotSystem', () => {
  let autopilot: AutopilotSystem
  let mockConfig: AutopilotConfig

  beforeEach(() => {
    mockConfig = {
      enabled: true,
      mode: 'balanced',
      automationLevel: 'semi_auto',
      budgetLimits: {
        dailyActions: 100,
        monthlySpend: 50000,
      },
      priorityRules: [
        {
          condition: 'cart_value > 10000',
          priority: 'high',
        },
      ],
      safetyGuards: [
        {
          type: 'budget_limit',
          threshold: 100,
          action: 'pause',
        },
      ],
    }

    autopilot = new AutopilotSystem(mockConfig)
  })

  describe('Configuration', () => {
    it('should initialize with correct config', () => {
      expect(autopilot.getConfig()).toEqual(mockConfig)
    })

    it('should update config', () => {
      const newConfig: Partial<AutopilotConfig> = {
        mode: 'aggressive',
        automationLevel: 'full_auto',
      }

      autopilot.updateConfig(newConfig)
      const updatedConfig = autopilot.getConfig()

      expect(updatedConfig.mode).toBe('aggressive')
      expect(updatedConfig.automationLevel).toBe('full_auto')
    })

    it('should disable autopilot', () => {
      autopilot.updateConfig({ enabled: false })
      expect(autopilot.getConfig().enabled).toBe(false)
    })
  })

  describe('Decision Making', () => {
    it('should make decision for cart abandonment', async () => {
      const event = {
        type: 'cart_abandoned' as const,
        contactId: 'contact_123',
        data: {
          cartValue: 15000,
          items: ['product_1', 'product_2'],
          abandonedAt: new Date().toISOString(),
        },
      }

      const decision = await autopilot.makeDecision(event)

      expect(decision).toHaveProperty('action')
      expect(decision).toHaveProperty('confidence')
      expect(decision).toHaveProperty('reasoning')
      expect(decision.confidence).toBeGreaterThan(0)
      expect(decision.confidence).toBeLessThanOrEqual(1)
    })

    it('should prioritize high-value carts', async () => {
      const highValueEvent = {
        type: 'cart_abandoned' as const,
        contactId: 'contact_456',
        data: {
          cartValue: 50000,
          items: ['product_premium'],
          abandonedAt: new Date().toISOString(),
        },
      }

      const decision = await autopilot.makeDecision(highValueEvent)

      expect(decision.priority).toBe('high')
      expect(decision.confidence).toBeGreaterThan(0.7)
    })

    it('should respect automation level in suggest mode', async () => {
      autopilot.updateConfig({ automationLevel: 'suggest' })

      const event = {
        type: 'cart_abandoned' as const,
        contactId: 'contact_789',
        data: {
          cartValue: 10000,
          items: ['product_1'],
          abandonedAt: new Date().toISOString(),
        },
      }

      const decision = await autopilot.makeDecision(event)

      expect(decision.requiresApproval).toBe(true)
    })

    it('should auto-execute in full_auto mode', async () => {
      autopilot.updateConfig({ automationLevel: 'full_auto' })

      const event = {
        type: 'cart_abandoned' as const,
        contactId: 'contact_101',
        data: {
          cartValue: 10000,
          items: ['product_1'],
          abandonedAt: new Date().toISOString(),
        },
      }

      const decision = await autopilot.makeDecision(event)

      expect(decision.requiresApproval).toBe(false)
    })
  })

  describe('Budget Management', () => {
    it('should track daily action count', async () => {
      const initialStats = autopilot.getStats()
      expect(initialStats.dailyActions).toBe(0)

      const event = {
        type: 'cart_abandoned' as const,
        contactId: 'contact_budget',
        data: {
          cartValue: 5000,
          items: ['product_1'],
          abandonedAt: new Date().toISOString(),
        },
      }

      await autopilot.makeDecision(event)

      const updatedStats = autopilot.getStats()
      expect(updatedStats.dailyActions).toBe(1)
    })

    it('should pause when budget limit reached', async () => {
      // Set low budget limit
      autopilot.updateConfig({
        budgetLimits: {
          dailyActions: 1,
          monthlySpend: 50000,
        },
      })

      // First action should work
      const event1 = {
        type: 'cart_abandoned' as const,
        contactId: 'contact_1',
        data: {
          cartValue: 5000,
          items: ['product_1'],
          abandonedAt: new Date().toISOString(),
        },
      }

      const decision1 = await autopilot.makeDecision(event1)
      expect(decision1).toBeDefined()

      // Second action should be blocked
      const event2 = {
        type: 'cart_abandoned' as const,
        contactId: 'contact_2',
        data: {
          cartValue: 5000,
          items: ['product_2'],
          abandonedAt: new Date().toISOString(),
        },
      }

      const decision2 = await autopilot.makeDecision(event2)
      expect(decision2.action).toBe('pause')
    })
  })

  describe('Safety Guards', () => {
    it('should apply safety guards', async () => {
      const event = {
        type: 'cart_abandoned' as const,
        contactId: 'contact_safety',
        data: {
          cartValue: 5000,
          items: ['product_1'],
          abandonedAt: new Date().toISOString(),
        },
      }

      const decision = await autopilot.makeDecision(event)

      expect(decision.safetyChecks).toBeDefined()
      expect(Array.isArray(decision.safetyChecks)).toBe(true)
    })

    it('should block decisions that fail safety checks', async () => {
      autopilot.updateConfig({
        safetyGuards: [
          {
            type: 'cart_value_limit',
            threshold: 100000,
            action: 'require_approval',
          },
        ],
      })

      const event = {
        type: 'cart_abandoned' as const,
        contactId: 'contact_highvalue',
        data: {
          cartValue: 150000,
          items: ['product_premium'],
          abandonedAt: new Date().toISOString(),
        },
      }

      const decision = await autopilot.makeDecision(event)

      expect(decision.requiresApproval).toBe(true)
    })
  })

  describe('Performance Metrics', () => {
    it('should track success rate', () => {
      const stats = autopilot.getStats()

      expect(stats).toHaveProperty('successRate')
      expect(stats).toHaveProperty('totalDecisions')
      expect(stats).toHaveProperty('dailyActions')
    })

    it('should calculate average confidence', async () => {
      const events = [
        {
          type: 'cart_abandoned' as const,
          contactId: 'contact_1',
          data: {
            cartValue: 5000,
            items: ['product_1'],
            abandonedAt: new Date().toISOString(),
          },
        },
        {
          type: 'cart_abandoned' as const,
          contactId: 'contact_2',
          data: {
            cartValue: 10000,
            items: ['product_2'],
            abandonedAt: new Date().toISOString(),
          },
        },
      ]

      for (const event of events) {
        await autopilot.makeDecision(event)
      }

      const stats = autopilot.getStats()
      expect(stats.averageConfidence).toBeGreaterThan(0)
      expect(stats.averageConfidence).toBeLessThanOrEqual(1)
    })
  })

  describe('Mode-specific Behavior', () => {
    it('should be more conservative in conservative mode', async () => {
      autopilot.updateConfig({ mode: 'conservative' })

      const event = {
        type: 'cart_abandoned' as const,
        contactId: 'contact_conservative',
        data: {
          cartValue: 5000,
          items: ['product_1'],
          abandonedAt: new Date().toISOString(),
        },
      }

      const decision = await autopilot.makeDecision(event)

      expect(decision.confidence).toBeLessThan(0.95)
    })

    it('should be more aggressive in aggressive mode', async () => {
      autopilot.updateConfig({ mode: 'aggressive', automationLevel: 'full_auto' })

      const event = {
        type: 'cart_abandoned' as const,
        contactId: 'contact_aggressive',
        data: {
          cartValue: 5000,
          items: ['product_1'],
          abandonedAt: new Date().toISOString(),
        },
      }

      const decision = await autopilot.makeDecision(event)

      expect(decision.requiresApproval).toBe(false)
      expect(decision.action).not.toBe('notify')
    })
  })
})
