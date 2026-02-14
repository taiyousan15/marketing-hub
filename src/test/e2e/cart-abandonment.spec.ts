import { test, expect } from '@playwright/test'

test.describe('Cart Abandonment Automation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    // TODO: Add proper login flow when auth is set up
  })

  test('should trigger cart recovery email after abandonment', async ({ page }) => {
    // Step 1: Navigate to products
    await page.goto('/products')
    await expect(page.locator('h1')).toContainText('Products')

    // Step 2: Add product to cart
    const addToCartButton = page.locator('[data-testid="add-to-cart"]').first()
    await addToCartButton.click()

    // Verify cart has items
    const cartBadge = page.locator('[data-testid="cart-badge"]')
    await expect(cartBadge).toHaveText('1')

    // Step 3: Navigate to cart
    await page.goto('/cart')
    await expect(page.locator('h1')).toContainText('Shopping Cart')

    // Verify cart value is displayed
    const cartValue = page.locator('[data-testid="cart-total"]')
    await expect(cartValue).toBeVisible()

    // Step 4: Abandon cart (leave page without checkout)
    await page.goto('/dashboard')

    // Step 5: Verify automation trigger logged
    await page.goto('/automation')
    await expect(page.locator('[data-testid="automation-logs"]')).toBeVisible()

    // Check for cart abandonment event
    const cartAbandonmentLog = page.locator(
      '[data-testid="log-entry"]:has-text("cart_abandoned")'
    )
    await expect(cartAbandonmentLog).toBeVisible()

    // Verify recovery action was triggered
    const recoveryAction = page.locator(
      '[data-testid="log-entry"]:has-text("send_email")'
    )
    await expect(recoveryAction).toBeVisible()
  })

  test('should prioritize high-value cart abandonment', async ({ page }) => {
    // Navigate to automation dashboard
    await page.goto('/ai/autopilot')

    // Verify autopilot is enabled
    const autopilotStatus = page.locator('[data-testid="autopilot-status"]')
    await expect(autopilotStatus).toContainText('Active')

    // Check decision logs for high-value prioritization
    const decisionLogs = page.locator('[data-testid="decision-logs"]')
    await expect(decisionLogs).toBeVisible()

    // Filter by high priority
    await page.locator('[data-testid="filter-priority"]').click()
    await page.locator('[data-testid="priority-high"]').click()

    // Verify high-value cart decisions exist
    const highPriorityDecisions = page.locator(
      '[data-testid="decision-entry"][data-priority="high"]'
    )
    await expect(highPriorityDecisions.first()).toBeVisible()
  })

  test('should respect automation level settings', async ({ page }) => {
    // Navigate to autopilot settings
    await page.goto('/ai/autopilot')

    // Change to suggest mode
    await page.locator('[data-testid="automation-level"]').click()
    await page.locator('[data-testid="level-suggest"]').click()
    await page.locator('[data-testid="save-config"]').click()

    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()

    // Check that decisions require approval
    await page.goto('/automation')
    const pendingApprovals = page.locator('[data-testid="pending-approvals"]')
    await expect(pendingApprovals).toBeVisible()
  })

  test('should send personalized recovery messages', async ({ page }) => {
    // Navigate to automation logs
    await page.goto('/automation')

    // Find a cart recovery action
    const recoveryAction = page.locator(
      '[data-testid="log-entry"]:has-text("send_email")'
    ).first()
    await recoveryAction.click()

    // Verify personalization details
    const messagePreview = page.locator('[data-testid="message-preview"]')
    await expect(messagePreview).toBeVisible()

    // Check for personalized content (contact name, product details)
    await expect(messagePreview).toContainText(/様|さん/) // Japanese honorifics
    await expect(messagePreview).toContainText('カート') // "Cart" in Japanese
  })

  test('should track recovery campaign performance', async ({ page }) => {
    // Navigate to analytics
    await page.goto('/analytics')

    // Check cart recovery metrics
    const recoveryRate = page.locator('[data-testid="cart-recovery-rate"]')
    await expect(recoveryRate).toBeVisible()

    const revenueRecovered = page.locator('[data-testid="revenue-recovered"]')
    await expect(revenueRecovered).toBeVisible()

    // Verify metrics are displayed as percentages/currency
    await expect(recoveryRate).toContainText('%')
    await expect(revenueRecovered).toContainText('¥')
  })

  test('should stop sending after purchase completion', async ({ page }) => {
    // Navigate to automation settings
    await page.goto('/automation')

    // Create a cart abandonment trigger
    await page.locator('[data-testid="new-automation"]').click()
    await page.locator('[data-testid="trigger-type"]').click()
    await page.locator('[data-testid="type-cart-abandoned"]').click()

    // Add stop condition for purchase
    await page.locator('[data-testid="add-stop-condition"]').click()
    await page.locator('[data-testid="condition-purchase-completed"]').click()

    // Save automation
    await page.locator('[data-testid="save-automation"]').click()

    // Verify success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()

    // Verify stop condition in automation list
    const automation = page.locator('[data-testid="automation-entry"]').first()
    await automation.click()

    const stopConditions = page.locator('[data-testid="stop-conditions"]')
    await expect(stopConditions).toContainText('purchase_completed')
  })
})
