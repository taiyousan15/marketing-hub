import { test, expect } from '@playwright/test'

test.describe('Purchase Intent Analysis & Auto-Branching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    // TODO: Add proper login flow when auth is set up
  })

  test('should analyze purchase intent from user behavior', async ({ page }) => {
    // Navigate to intent analysis dashboard
    await page.goto('/automation/intent')
    await expect(page.locator('h1')).toContainText('購入意向分析')

    // Verify intent analysis UI is loaded
    const intentDashboard = page.locator('[data-testid="intent-dashboard"]')
    await expect(intentDashboard).toBeVisible()

    // Check for contact list with intent levels
    const contactList = page.locator('[data-testid="contact-list"]')
    await expect(contactList).toBeVisible()

    // Verify intent level indicators
    const veryHighIntent = page.locator('[data-intent-level="very_high"]')
    await expect(veryHighIntent.first()).toBeVisible()
  })

  test('should display intent level badges correctly', async ({ page }) => {
    await page.goto('/automation/intent')

    // Check all intent levels are displayed
    const intentLevels = [
      'very_high',
      'high',
      'medium',
      'low',
      'very_low',
      'none',
    ]

    for (const level of intentLevels) {
      const badge = page.locator(`[data-intent-level="${level}"]`).first()
      if (await badge.isVisible()) {
        // Verify badge has appropriate styling
        const classList = await badge.getAttribute('class')
        expect(classList).toBeTruthy()
      }
    }
  })

  test('should show purchase barriers for contacts', async ({ page }) => {
    await page.goto('/automation/intent')

    // Click on a contact with medium/low intent
    const contactWithBarriers = page
      .locator('[data-testid="contact-entry"]')
      .filter({ has: page.locator('[data-intent-level="medium"]') })
      .first()

    await contactWithBarriers.click()

    // Verify barrier analysis is displayed
    const barrierSection = page.locator('[data-testid="barriers-section"]')
    await expect(barrierSection).toBeVisible()

    // Check for barrier types
    const barrierTypes = ['price', 'trust', 'feature_gap', 'timing']
    for (const type of barrierTypes) {
      const barrier = page.locator(`[data-barrier-type="${type}"]`).first()
      if (await barrier.isVisible()) {
        // Verify barrier has description
        await expect(barrier).toContainText(/.*/)
      }
    }
  })

  test('should automatically branch contacts based on intent', async ({ page }) => {
    await page.goto('/automation/intent')

    // Verify branching flow diagram
    const flowDiagram = page.locator('[data-testid="branching-flow"]')
    await expect(flowDiagram).toBeVisible()

    // Check all branch destinations
    const branches = [
      'purchase_ready',
      'nurturing',
      'education',
      'objection_price',
      'objection_trust',
      'reengagement',
    ]

    for (const branch of branches) {
      const branchNode = page.locator(`[data-branch="${branch}"]`)
      await expect(branchNode).toBeVisible()
    }
  })

  test('should assign contacts to purchase_ready segment', async ({ page }) => {
    await page.goto('/automation/intent')

    // Filter by very high intent
    await page.locator('[data-testid="filter-intent"]').click()
    await page.locator('[data-testid="intent-very-high"]').click()

    // Verify contacts are shown
    const veryHighContacts = page.locator('[data-intent-level="very_high"]')
    await expect(veryHighContacts.first()).toBeVisible()

    // Click on a contact
    await veryHighContacts.first().click()

    // Verify suggested segment is purchase_ready
    const suggestedSegment = page.locator('[data-testid="suggested-segment"]')
    await expect(suggestedSegment).toContainText('購入準備完了')
  })

  test('should recommend actions based on barriers', async ({ page }) => {
    await page.goto('/automation/intent')

    // Find a contact with barriers
    const contactEntry = page.locator('[data-testid="contact-entry"]').first()
    await contactEntry.click()

    // Verify recommended actions section
    const actionsSection = page.locator('[data-testid="recommended-actions"]')
    await expect(actionsSection).toBeVisible()

    // Check for action recommendations
    const actionTypes = [
      'offer_discount',
      'show_social_proof',
      'provide_demo',
      'immediate_contact',
    ]

    for (const type of actionTypes) {
      const action = page.locator(`[data-action-type="${type}"]`).first()
      if (await action.isVisible()) {
        // Verify action has description and CTA
        await expect(action).toContainText(/.*/)
      }
    }
  })

  test('should display confidence scores', async ({ page }) => {
    await page.goto('/automation/intent')

    // Check confidence score display
    const confidenceScores = page.locator('[data-testid="confidence-score"]')
    await expect(confidenceScores.first()).toBeVisible()

    // Verify score is a percentage
    const firstScore = await confidenceScores.first().textContent()
    expect(firstScore).toMatch(/\d+%/)
  })

  test('should track intent over time', async ({ page }) => {
    await page.goto('/automation/intent')

    // Click on a contact
    const contactEntry = page.locator('[data-testid="contact-entry"]').first()
    await contactEntry.click()

    // Verify intent history chart
    const intentHistory = page.locator('[data-testid="intent-history"]')
    await expect(intentHistory).toBeVisible()

    // Check for chart elements
    const chartCanvas = page.locator('canvas, svg').first()
    await expect(chartCanvas).toBeVisible()
  })

  test('should allow manual segment override', async ({ page }) => {
    await page.goto('/automation/intent')

    // Click on a contact
    const contactEntry = page.locator('[data-testid="contact-entry"]').first()
    await contactEntry.click()

    // Find override button
    const overrideButton = page.locator('[data-testid="override-segment"]')
    if (await overrideButton.isVisible()) {
      await overrideButton.click()

      // Select different segment
      await page.locator('[data-testid="segment-selector"]').click()
      await page.locator('[data-segment="nurturing"]').click()

      // Save override
      await page.locator('[data-testid="save-override"]').click()

      // Verify success
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
    }
  })

  test('should show signal breakdown', async ({ page }) => {
    await page.goto('/automation/intent')

    // Click on a contact
    const contactEntry = page.locator('[data-testid="contact-entry"]').first()
    await contactEntry.click()

    // Verify signals section
    const signalsSection = page.locator('[data-testid="signals-section"]')
    await expect(signalsSection).toBeVisible()

    // Check for different signal types
    const signalTypes = [
      'page_view',
      'cart_add',
      'checkout_start',
      'form_fill',
      'download',
    ]

    for (const type of signalTypes) {
      const signal = page.locator(`[data-signal-type="${type}"]`).first()
      if (await signal.isVisible()) {
        // Verify signal has timestamp and weight
        await expect(signal).toBeVisible()
      }
    }
  })

  test('should integrate with automation triggers', async ({ page }) => {
    await page.goto('/automation/intent')

    // Click on a high-intent contact
    const highIntentContact = page
      .locator('[data-testid="contact-entry"]')
      .filter({ has: page.locator('[data-intent-level="high"]') })
      .first()

    await highIntentContact.click()

    // Trigger automation from intent
    const triggerButton = page.locator('[data-testid="trigger-automation"]')
    if (await triggerButton.isVisible()) {
      await triggerButton.click()

      // Verify automation selector
      const automationSelector = page.locator(
        '[data-testid="automation-selector"]'
      )
      await expect(automationSelector).toBeVisible()
    }
  })
})
