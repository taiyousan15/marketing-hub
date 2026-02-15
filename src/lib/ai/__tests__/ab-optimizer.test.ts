import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ABOptimizer } from '../ab-optimizer'

describe('ABOptimizer', () => {
  let optimizer: ABOptimizer

  beforeEach(() => {
    optimizer = new ABOptimizer()
  })

  describe('Test Setup', () => {
    it('should create a new A/B test', () => {
      const test: any = {
        id: 'test_1',
        name: 'Email Subject Line Test',
        type: 'email',
        algorithm: 'epsilon_greedy',
        variants: [
          {
            id: 'variant_a',
            name: 'Control',
            config: { subject: 'Original Subject' },
            impressions: 0,
            conversions: 0,
          },
          {
            id: 'variant_b',
            name: 'Treatment',
            config: { subject: 'New Subject' },
            impressions: 0,
            conversions: 0,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)

      const tests = optimizer.getTests()
      expect(tests).toHaveLength(1)
      expect(tests[0].id).toBe('test_1')
    })

    it('should pause a test', () => {
      const test: any = {
        id: 'test_2',
        name: 'Test 2',
        type: 'email',
        algorithm: 'epsilon_greedy',
        variants: [],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)
      optimizer.pauseTest('test_2')

      const tests = optimizer.getTests()
      expect(tests[0].status).toBe('paused')
    })

    it('should archive a test', () => {
      const test: any = {
        id: 'test_3',
        name: 'Test 3',
        type: 'email',
        algorithm: 'epsilon_greedy',
        variants: [],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)
      optimizer.archiveTest('test_3')

      const tests = optimizer.getTests()
      expect(tests[0].status).toBe('archived')
    })
  })

  describe('Epsilon Greedy Algorithm', () => {
    it('should select variant using epsilon greedy', () => {
      const test: any = {
        id: 'test_epsilon',
        name: 'Epsilon Test',
        type: 'email',
        algorithm: 'epsilon_greedy',
        epsilon: 0.1,
        variants: [
          {
            id: 'variant_a',
            name: 'Control',
            config: {},
            impressions: 100,
            conversions: 10,
          },
          {
            id: 'variant_b',
            name: 'Treatment',
            config: {},
            impressions: 100,
            conversions: 20,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)

      const selectedVariant = optimizer.selectVariant('test_epsilon')

      expect(selectedVariant).toBeDefined()
      expect(['variant_a', 'variant_b']).toContain(selectedVariant.id)
    })

    it('should explore less frequently with low epsilon', () => {
      const test: any = {
        id: 'test_low_epsilon',
        name: 'Low Epsilon Test',
        type: 'email',
        algorithm: 'epsilon_greedy',
        epsilon: 0.01,
        variants: [
          {
            id: 'variant_winner',
            name: 'Winner',
            config: {},
            impressions: 1000,
            conversions: 300,
          },
          {
            id: 'variant_loser',
            name: 'Loser',
            config: {},
            impressions: 1000,
            conversions: 50,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)

      const selections = Array(100)
        .fill(null)
        .map(() => optimizer.selectVariant('test_low_epsilon'))

      const winnerCount = selections.filter(v => v.id === 'variant_winner').length

      expect(winnerCount).toBeGreaterThan(90)
    })
  })

  describe('UCB1 Algorithm', () => {
    it('should select variant using UCB1', () => {
      const test: any = {
        id: 'test_ucb1',
        name: 'UCB1 Test',
        type: 'email',
        algorithm: 'ucb1',
        variants: [
          {
            id: 'variant_a',
            name: 'Control',
            config: {},
            impressions: 100,
            conversions: 15,
          },
          {
            id: 'variant_b',
            name: 'Treatment',
            config: {},
            impressions: 50,
            conversions: 10,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)

      const selectedVariant = optimizer.selectVariant('test_ucb1')

      expect(selectedVariant).toBeDefined()
      expect(['variant_a', 'variant_b']).toContain(selectedVariant.id)
    })

    it('should explore undersampled variants with UCB1', () => {
      const test: any = {
        id: 'test_ucb1_explore',
        name: 'UCB1 Exploration Test',
        type: 'email',
        algorithm: 'ucb1',
        variants: [
          {
            id: 'variant_sampled',
            name: 'Well Sampled',
            config: {},
            impressions: 1000,
            conversions: 200,
          },
          {
            id: 'variant_undersampled',
            name: 'Undersampled',
            config: {},
            impressions: 10,
            conversions: 3,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)

      const selections = Array(100)
        .fill(null)
        .map(() => optimizer.selectVariant('test_ucb1_explore'))

      const undersampledCount = selections.filter(v => v.id === 'variant_undersampled').length

      expect(undersampledCount).toBeGreaterThan(10)
    })
  })

  describe('Thompson Sampling Algorithm', () => {
    it('should select variant using Thompson Sampling', () => {
      const test: any = {
        id: 'test_thompson',
        name: 'Thompson Test',
        type: 'email',
        algorithm: 'thompson_sampling',
        variants: [
          {
            id: 'variant_a',
            name: 'Control',
            config: {},
            impressions: 100,
            conversions: 20,
          },
          {
            id: 'variant_b',
            name: 'Treatment',
            config: {},
            impressions: 100,
            conversions: 25,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)

      const selectedVariant = optimizer.selectVariant('test_thompson')

      expect(selectedVariant).toBeDefined()
      expect(['variant_a', 'variant_b']).toContain(selectedVariant.id)
    })

    it('should favor better performing variants over time', () => {
      const test: any = {
        id: 'test_thompson_favor',
        name: 'Thompson Favor Test',
        type: 'email',
        algorithm: 'thompson_sampling',
        variants: [
          {
            id: 'variant_winner',
            name: 'Winner',
            config: {},
            impressions: 1000,
            conversions: 400,
          },
          {
            id: 'variant_loser',
            name: 'Loser',
            config: {},
            impressions: 1000,
            conversions: 100,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)

      const selections = Array(1000)
        .fill(null)
        .map(() => optimizer.selectVariant('test_thompson_favor'))

      const winnerCount = selections.filter(v => v.id === 'variant_winner').length

      expect(winnerCount).toBeGreaterThan(600)
    })
  })

  describe('Recording Results', () => {
    it('should record impression', () => {
      const test: any = {
        id: 'test_impression',
        name: 'Impression Test',
        type: 'email',
        algorithm: 'epsilon_greedy',
        variants: [
          {
            id: 'variant_a',
            name: 'Control',
            config: {},
            impressions: 0,
            conversions: 0,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)
      optimizer.recordImpression('test_impression', 'variant_a')

      const updatedTest = optimizer.getTest('test_impression')
      const variant = updatedTest.variants.find((v: any) => v.id === 'variant_a')

      expect(variant.impressions).toBe(1)
    })

    it('should record conversion', () => {
      const test: any = {
        id: 'test_conversion',
        name: 'Conversion Test',
        type: 'email',
        algorithm: 'epsilon_greedy',
        variants: [
          {
            id: 'variant_a',
            name: 'Control',
            config: {},
            impressions: 10,
            conversions: 0,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)
      optimizer.recordConversion('test_conversion', 'variant_a')

      const updatedTest = optimizer.getTest('test_conversion')
      const variant = updatedTest.variants.find((v: any) => v.id === 'variant_a')

      expect(variant.conversions).toBe(1)
    })

    it('should calculate conversion rate', () => {
      const test: any = {
        id: 'test_rate',
        name: 'Rate Test',
        type: 'email',
        algorithm: 'epsilon_greedy',
        variants: [
          {
            id: 'variant_a',
            name: 'Control',
            config: {},
            impressions: 100,
            conversions: 20,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)

      const stats = optimizer.getTestStats('test_rate')
      const variantStats = stats.variants.find((v: any) => v.id === 'variant_a')

      expect(variantStats!.conversionRate).toBe(0.2)
    })
  })

  describe('Winner Detection', () => {
    it('should detect clear winner with statistical significance', () => {
      const test: any = {
        id: 'test_winner',
        name: 'Winner Test',
        type: 'email',
        algorithm: 'epsilon_greedy',
        variants: [
          {
            id: 'variant_a',
            name: 'Control',
            config: {},
            impressions: 1000,
            conversions: 100,
          },
          {
            id: 'variant_b',
            name: 'Winner',
            config: {},
            impressions: 1000,
            conversions: 200,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)

      const winner = optimizer.detectWinner('test_winner', 0.95)

      expect(winner).toBeDefined()
      expect(winner!.id).toBe('variant_b')
    })

    it('should not declare winner without sufficient data', () => {
      const test: any = {
        id: 'test_insufficient',
        name: 'Insufficient Data Test',
        type: 'email',
        algorithm: 'epsilon_greedy',
        variants: [
          {
            id: 'variant_a',
            name: 'Control',
            config: {},
            impressions: 10,
            conversions: 1,
          },
          {
            id: 'variant_b',
            name: 'Treatment',
            config: {},
            impressions: 10,
            conversions: 5,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)

      const winner = optimizer.detectWinner('test_insufficient', 0.95)

      expect(winner).toBeNull()
    })
  })

  describe('Multi-Variant Tests', () => {
    it('should handle tests with 3+ variants', () => {
      const test: any = {
        id: 'test_multi',
        name: 'Multi-Variant Test',
        type: 'email',
        algorithm: 'epsilon_greedy',
        epsilon: 0.1,
        variants: [
          {
            id: 'variant_a',
            name: 'Control',
            config: {},
            impressions: 100,
            conversions: 10,
          },
          {
            id: 'variant_b',
            name: 'Treatment 1',
            config: {},
            impressions: 100,
            conversions: 15,
          },
          {
            id: 'variant_c',
            name: 'Treatment 2',
            config: {},
            impressions: 100,
            conversions: 20,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)

      const selections = Array(1000)
        .fill(null)
        .map(() => optimizer.selectVariant('test_multi'))

      const variantCCount = selections.filter(v => v.id === 'variant_c').length

      expect(variantCCount).toBeGreaterThan(300)
    })
  })

  describe('Performance Metrics', () => {
    it('should calculate lift percentage', () => {
      const test: any = {
        id: 'test_lift',
        name: 'Lift Test',
        type: 'email',
        algorithm: 'epsilon_greedy',
        variants: [
          {
            id: 'variant_control',
            name: 'Control',
            config: {},
            impressions: 1000,
            conversions: 100,
          },
          {
            id: 'variant_treatment',
            name: 'Treatment',
            config: {},
            impressions: 1000,
            conversions: 150,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)

      const stats = optimizer.getTestStats('test_lift')

      expect(stats.lift).toBe(0.5) // 50% lift
    })

    it('should track cumulative regret', () => {
      const test: any = {
        id: 'test_regret',
        name: 'Regret Test',
        type: 'email',
        algorithm: 'epsilon_greedy',
        epsilon: 0.5,
        variants: [
          {
            id: 'variant_best',
            name: 'Best',
            config: {},
            impressions: 500,
            conversions: 200,
          },
          {
            id: 'variant_worst',
            name: 'Worst',
            config: {},
            impressions: 500,
            conversions: 50,
          },
        ],
        status: 'active',
        createdAt: new Date(),
      }

      optimizer.createTest(test)

      const stats = optimizer.getTestStats('test_regret')

      expect(stats.cumulativeRegret).toBeGreaterThan(0)
    })
  })
})
