# Test Infrastructure Documentation

## Overview

This directory contains comprehensive test coverage for the MarketingHub AI automation system, targeting **80% code coverage** with unit tests and E2E tests for critical user flows.

## Test Structure

```
src/test/
├── setup.ts              # Global test setup and mocks
├── e2e/                  # End-to-end tests (Playwright)
│   ├── cart-abandonment.spec.ts
│   ├── intent-analysis.spec.ts
│   └── ab-optimization.spec.ts
└── __tests__/            # Unit tests (Vitest)
    └── (located alongside source files in src/lib/ai/__tests__/)
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run with UI
npm run test:ui

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm test -- --watch
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Run specific test file
npm run test:e2e -- cart-abandonment.spec.ts

# Run specific browser
npm run test:e2e -- --project=chromium
```

## Test Coverage Targets

| Component | Target | Status |
|-----------|--------|--------|
| Autopilot System | 80% | ✅ |
| Trigger Engine | 80% | ✅ |
| Intent Analyzer | 80% | ✅ |
| A/B Optimizer | 80% | ✅ |
| E2E Critical Flows | 100% | ✅ |

## Unit Tests

### Autopilot System (`src/lib/ai/__tests__/autopilot.test.ts`)

**Coverage areas:**
- Configuration management
- Decision making for different event types
- Priority rules and high-value cart handling
- Automation levels (suggest, semi_auto, full_auto)
- Budget management and limits
- Safety guards and approval workflows
- Performance metrics tracking
- Mode-specific behavior (conservative, balanced, aggressive)

**Key test scenarios:**
- Cart abandonment with various cart values
- Budget limit enforcement
- Safety guard application
- Confidence score calculation
- Success rate tracking

### Trigger Engine (`src/lib/ai/__tests__/trigger-engine.test.ts`)

**Coverage areas:**
- Trigger registration and management
- Event processing and condition evaluation
- Multiple trigger execution
- AI-enhanced triggers with intent analysis
- Message personalization
- Send time optimization
- Execution statistics

**Key test scenarios:**
- Cart abandonment triggers
- Condition operators (gt, lt, eq, contains, in)
- Multi-trigger matching
- AI intent analysis integration
- Personalized content generation

### Intent Analyzer (`src/lib/ai/__tests__/intent-analyzer.test.ts`)

**Coverage areas:**
- Purchase intent level detection (very_high to very_low)
- Signal processing and weighting
- Barrier detection (price, trust, feature_gap)
- Action recommendations
- Segment assignment
- Confidence calculation

**Key test scenarios:**
- High intent detection (checkout_start, cart_add)
- Time decay for old signals
- Negative signal handling (unsubscribe)
- Barrier-specific recommendations
- Segment routing logic

### A/B Optimizer (`src/lib/ai/__tests__/ab-optimizer.test.ts`)

**Coverage areas:**
- Test setup and management
- Epsilon-greedy algorithm
- UCB1 (Upper Confidence Bound) algorithm
- Thompson Sampling (Bayesian optimization)
- Winner detection with statistical significance
- Multi-variant tests (3+ variants)
- Performance metrics (lift, regret)

**Key test scenarios:**
- Traffic allocation based on performance
- Exploration vs exploitation balance
- Confidence interval calculation
- Cumulative regret tracking
- Winner declaration with significance testing

## E2E Tests

### Cart Abandonment Flow (`src/test/e2e/cart-abandonment.spec.ts`)

**Test scenarios:**
1. Trigger recovery email after cart abandonment
2. Prioritize high-value cart abandonment
3. Respect automation level settings
4. Send personalized recovery messages
5. Track recovery campaign performance
6. Stop sending after purchase completion

**User flow covered:**
- Product browsing → Add to cart → Cart view → Abandonment → Automation trigger → Recovery action

### Intent Analysis & Auto-Branching (`src/test/e2e/intent-analysis.spec.ts`)

**Test scenarios:**
1. Analyze purchase intent from user behavior
2. Display intent level badges correctly
3. Show purchase barriers for contacts
4. Automatically branch contacts based on intent
5. Assign contacts to purchase_ready segment
6. Recommend actions based on barriers
7. Display confidence scores
8. Track intent over time
9. Allow manual segment override
10. Show signal breakdown
11. Integrate with automation triggers

**User flow covered:**
- Contact activity tracking → Intent scoring → Barrier identification → Segment assignment → Action recommendation

### A/B Test Optimization (`src/test/e2e/ab-optimization.spec.ts`)

**Test scenarios:**
1. Create new A/B test with multiple variants
2. Use epsilon-greedy algorithm correctly
3. Use UCB1 algorithm for exploration
4. Use Thompson Sampling for Bayesian optimization
5. Display variant performance metrics
6. Detect statistical significance
7. Show confidence intervals
8. Calculate lift percentage
9. Automatically allocate traffic to best variant
10. Show winner when significance reached
11. Track cumulative regret
12. Allow pausing and resuming tests
13. Archive completed tests
14. Export test results

**User flow covered:**
- Test creation → Variant setup → Traffic allocation → Performance tracking → Winner detection → Implementation

## Mock Configuration

The test setup includes mocks for:
- **Next.js Router** - Navigation and routing
- **Clerk Auth** - Authentication and user management
- **Anthropic SDK** - AI decision-making API
- **Prisma Client** - Database operations

See `src/test/setup.ts` for full mock configuration.

## Coverage Thresholds

Configured in `vitest.config.ts`:
- **Lines:** 80%
- **Functions:** 80%
- **Branches:** 80%
- **Statements:** 80%

## CI/CD Integration

The test suite is designed for CI/CD integration:
- Playwright runs in headless mode in CI
- Coverage reports generated in JSON and HTML formats
- Tests run in parallel for faster execution
- Retry mechanism for flaky E2E tests

## Best Practices

1. **Unit Tests**
   - Test one thing at a time
   - Use descriptive test names
   - Mock external dependencies
   - Verify both success and error cases

2. **E2E Tests**
   - Use data-testid attributes for stable selectors
   - Test complete user flows, not individual interactions
   - Verify visual feedback (toasts, status indicators)
   - Handle async operations properly

3. **Test Data**
   - Use factory functions for test data creation
   - Keep test data minimal and focused
   - Clean up after tests when necessary

## Troubleshooting

### Common Issues

**Unit tests failing:**
- Check mock configuration in `src/test/setup.ts`
- Verify imports are correct
- Ensure Vitest can resolve path aliases (@/)

**E2E tests failing:**
- Verify dev server is running
- Check Playwright browser installation: `npx playwright install`
- Review test selectors - ensure data-testid attributes exist
- Check for timing issues - add appropriate waits

**Coverage not reaching 80%:**
- Run `npm run test:coverage` to see coverage report
- Check HTML report in `coverage/index.html`
- Add tests for uncovered branches and functions

## Next Steps

1. **Phase 2: ML Model Enhancement** (40% → 80%)
   - Add TensorFlow.js integration tests
   - Test predictive model training
   - Verify model inference accuracy

2. **Phase 3: Integration Tests**
   - Test Autopilot → Trigger Engine integration
   - Test Intent Analyzer → Segment assignment flow
   - Test A/B Optimizer → Email delivery integration

3. **Phase 4: Performance Tests**
   - Load testing for high-volume events
   - Stress testing for concurrent A/B tests
   - Memory profiling for long-running automations
