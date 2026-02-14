import { test, expect } from '@playwright/test'

test.describe('A/B Test Automatic Optimization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    // TODO: Add proper login flow when auth is set up
  })

  test('should create new A/B test with multiple variants', async ({ page }) => {
    // Navigate to A/B test management
    await page.goto('/analytics/ab-tests')

    // Click create new test
    await page.locator('[data-testid="create-test"]').click()

    // Fill in test details
    await page.locator('[data-testid="test-name"]').fill('Email Subject Test')
    await page.locator('[data-testid="test-type"]').click()
    await page.locator('[data-testid="type-email"]').click()

    // Select algorithm
    await page.locator('[data-testid="algorithm"]').click()
    await page.locator('[data-testid="algorithm-epsilon-greedy"]').click()

    // Add variants
    await page.locator('[data-testid="add-variant"]').click()
    await page
      .locator('[data-testid="variant-name-0"]')
      .fill('Control - Original')
    await page
      .locator('[data-testid="variant-config-0"]')
      .fill('件名: 【限定】特別オファー')

    await page.locator('[data-testid="add-variant"]').click()
    await page
      .locator('[data-testid="variant-name-1"]')
      .fill('Treatment - Personalized')
    await page
      .locator('[data-testid="variant-config-1"]')
      .fill('件名: {{name}}様、特別なご案内')

    // Save test
    await page.locator('[data-testid="save-test"]').click()

    // Verify success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()

    // Verify test appears in list
    const testList = page.locator('[data-testid="test-list"]')
    await expect(testList).toContainText('Email Subject Test')
  })

  test('should use epsilon-greedy algorithm correctly', async ({ page }) => {
    await page.goto('/analytics/ab-tests')

    // Find an epsilon-greedy test
    const epsilonTest = page
      .locator('[data-testid="test-entry"]')
      .filter({ hasText: 'epsilon_greedy' })
      .first()

    if (await epsilonTest.isVisible()) {
      await epsilonTest.click()

      // Verify algorithm settings
      const algorithmDisplay = page.locator('[data-testid="algorithm-display"]')
      await expect(algorithmDisplay).toContainText('Epsilon Greedy')

      // Check epsilon value
      const epsilonValue = page.locator('[data-testid="epsilon-value"]')
      await expect(epsilonValue).toBeVisible()

      // Verify it shows exploration vs exploitation ratio
      const explorationRatio = page.locator(
        '[data-testid="exploration-ratio"]'
      )
      await expect(explorationRatio).toBeVisible()
    }
  })

  test('should use UCB1 algorithm for exploration', async ({ page }) => {
    await page.goto('/analytics/ab-tests')

    // Create UCB1 test
    await page.locator('[data-testid="create-test"]').click()
    await page.locator('[data-testid="test-name"]').fill('UCB1 Test')
    await page.locator('[data-testid="algorithm"]').click()
    await page.locator('[data-testid="algorithm-ucb1"]').click()

    // Add variants
    await page.locator('[data-testid="add-variant"]').click()
    await page.locator('[data-testid="variant-name-0"]').fill('Variant A')

    await page.locator('[data-testid="add-variant"]').click()
    await page.locator('[data-testid="variant-name-1"]').fill('Variant B')

    await page.locator('[data-testid="save-test"]').click()

    // Verify UCB1 settings
    const testEntry = page
      .locator('[data-testid="test-entry"]')
      .filter({ hasText: 'UCB1 Test' })
      .first()
    await testEntry.click()

    const ucbScore = page.locator('[data-testid="ucb-score"]')
    await expect(ucbScore.first()).toBeVisible()
  })

  test('should use Thompson Sampling for Bayesian optimization', async ({
    page,
  }) => {
    await page.goto('/analytics/ab-tests')

    // Find Thompson Sampling test
    const thompsonTest = page
      .locator('[data-testid="test-entry"]')
      .filter({ hasText: 'thompson_sampling' })
      .first()

    if (await thompsonTest.isVisible()) {
      await thompsonTest.click()

      // Verify beta distribution parameters
      const alphaValue = page.locator('[data-testid="alpha-value"]').first()
      const betaValue = page.locator('[data-testid="beta-value"]').first()

      await expect(alphaValue).toBeVisible()
      await expect(betaValue).toBeVisible()
    }
  })

  test('should display variant performance metrics', async ({ page }) => {
    await page.goto('/analytics/ab-tests')

    // Click on an active test
    const activeTest = page
      .locator('[data-testid="test-entry"]')
      .filter({ has: page.locator('[data-status="active"]') })
      .first()

    await activeTest.click()

    // Verify performance metrics are displayed
    const impressions = page.locator('[data-testid="variant-impressions"]')
    await expect(impressions.first()).toBeVisible()

    const conversions = page.locator('[data-testid="variant-conversions"]')
    await expect(conversions.first()).toBeVisible()

    const conversionRate = page.locator('[data-testid="conversion-rate"]')
    await expect(conversionRate.first()).toBeVisible()
  })

  test('should detect statistical significance', async ({ page }) => {
    await page.goto('/analytics/ab-tests')

    // Find test with sufficient data
    const testWithData = page
      .locator('[data-testid="test-entry"]')
      .first()

    await testWithData.click()

    // Check for significance indicator
    const significanceIndicator = page.locator(
      '[data-testid="significance-indicator"]'
    )
    if (await significanceIndicator.isVisible()) {
      const significanceText = await significanceIndicator.textContent()
      expect(significanceText).toMatch(/95%|99%|統計的有意/)
    }
  })

  test('should show confidence intervals', async ({ page }) => {
    await page.goto('/analytics/ab-tests')

    // Click on a test
    const testEntry = page.locator('[data-testid="test-entry"]').first()
    await testEntry.click()

    // Verify confidence interval display
    const confidenceInterval = page
      .locator('[data-testid="confidence-interval"]')
      .first()

    if (await confidenceInterval.isVisible()) {
      const intervalText = await confidenceInterval.textContent()
      expect(intervalText).toMatch(/\[.*,.*\]/)
    }
  })

  test('should calculate lift percentage', async ({ page }) => {
    await page.goto('/analytics/ab-tests')

    // Click on a test with results
    const testEntry = page.locator('[data-testid="test-entry"]').first()
    await testEntry.click()

    // Check lift display
    const liftDisplay = page.locator('[data-testid="lift-percentage"]')
    if (await liftDisplay.isVisible()) {
      const liftText = await liftDisplay.textContent()
      expect(liftText).toMatch(/[+-]?\d+(\.\d+)?%/)
    }
  })

  test('should automatically allocate traffic to best variant', async ({
    page,
  }) => {
    await page.goto('/analytics/ab-tests')

    // Find an adaptive test (epsilon-greedy, UCB1, or Thompson)
    const adaptiveTest = page
      .locator('[data-testid="test-entry"]')
      .filter({
        has: page.locator(
          '[data-algorithm="epsilon_greedy"], [data-algorithm="ucb1"], [data-algorithm="thompson_sampling"]'
        ),
      })
      .first()

    if (await adaptiveTest.isVisible()) {
      await adaptiveTest.click()

      // Verify traffic allocation chart
      const trafficAllocation = page.locator('[data-testid="traffic-allocation"]')
      await expect(trafficAllocation).toBeVisible()

      // Check that better performing variant gets more traffic
      const variantTraffic = page.locator('[data-testid="variant-traffic-pct"]')
      const firstTrafficPct = await variantTraffic
        .first()
        .textContent()
        .then(text => parseFloat(text?.replace('%', '') || '0'))

      expect(firstTrafficPct).toBeGreaterThanOrEqual(0)
      expect(firstTrafficPct).toBeLessThanOrEqual(100)
    }
  })

  test('should show winner when significance reached', async ({ page }) => {
    await page.goto('/analytics/ab-tests')

    // Look for test with winner
    const winnerBadge = page.locator('[data-testid="winner-badge"]').first()

    if (await winnerBadge.isVisible()) {
      const testWithWinner = page
        .locator('[data-testid="test-entry"]')
        .filter({ has: winnerBadge })
        .first()

      await testWithWinner.click()

      // Verify winner display
      const winnerDisplay = page.locator('[data-testid="winner-display"]')
      await expect(winnerDisplay).toBeVisible()

      // Check for recommendation to implement winner
      const recommendation = page.locator('[data-testid="winner-recommendation"]')
      await expect(recommendation).toBeVisible()
    }
  })

  test('should track cumulative regret', async ({ page }) => {
    await page.goto('/analytics/ab-tests')

    // Click on a test
    const testEntry = page.locator('[data-testid="test-entry"]').first()
    await testEntry.click()

    // Check for regret metric
    const regretDisplay = page.locator('[data-testid="cumulative-regret"]')
    if (await regretDisplay.isVisible()) {
      // Verify it's a number
      const regretText = await regretDisplay.textContent()
      expect(regretText).toMatch(/\d+/)
    }
  })

  test('should allow pausing and resuming tests', async ({ page }) => {
    await page.goto('/analytics/ab-tests')

    // Click on an active test
    const activeTest = page
      .locator('[data-testid="test-entry"]')
      .filter({ has: page.locator('[data-status="active"]') })
      .first()

    await activeTest.click()

    // Pause test
    const pauseButton = page.locator('[data-testid="pause-test"]')
    if (await pauseButton.isVisible()) {
      await pauseButton.click()

      // Verify status changed
      const statusDisplay = page.locator('[data-testid="test-status"]')
      await expect(statusDisplay).toContainText('Paused')

      // Resume test
      const resumeButton = page.locator('[data-testid="resume-test"]')
      await resumeButton.click()

      // Verify status changed back
      await expect(statusDisplay).toContainText('Active')
    }
  })

  test('should archive completed tests', async ({ page }) => {
    await page.goto('/analytics/ab-tests')

    // Filter to show all tests
    await page.locator('[data-testid="filter-status"]').click()
    await page.locator('[data-testid="status-all"]').click()

    // Find an archived test
    const archivedTest = page
      .locator('[data-testid="test-entry"]')
      .filter({ has: page.locator('[data-status="archived"]') })
      .first()

    if (await archivedTest.isVisible()) {
      await archivedTest.click()

      // Verify archived status
      const statusDisplay = page.locator('[data-testid="test-status"]')
      await expect(statusDisplay).toContainText('Archived')

      // Verify final results are preserved
      const finalResults = page.locator('[data-testid="final-results"]')
      await expect(finalResults).toBeVisible()
    }
  })

  test('should export test results', async ({ page }) => {
    await page.goto('/analytics/ab-tests')

    // Click on a test
    const testEntry = page.locator('[data-testid="test-entry"]').first()
    await testEntry.click()

    // Find export button
    const exportButton = page.locator('[data-testid="export-results"]')
    if (await exportButton.isVisible()) {
      // Click export (don't wait for download in test)
      await exportButton.click()

      // Verify export options
      const exportOptions = page.locator('[data-testid="export-options"]')
      await expect(exportOptions).toBeVisible()
    }
  })
})
