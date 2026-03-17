# Kiosk Helper

Utility functions for kiosk E2E tests — PIN entry, tenant selection, clock-in/out.

## File: `tests/helpers/kiosk.ts`

```ts
import { Page, expect } from '@playwright/test'

/**
 * Selects a tenant by display name from the kiosk user selection screen.
 * Expects the page to already be at /kiosk.
 */
export async function selectTenant(page: Page, name: string) {
  // User cards rendered by components/kiosk/user-card.tsx
  const userCard = page.locator(`[data-testid="user-card"]`, { hasText: name })
  await expect(userCard).toBeVisible({ timeout: 5000 })
  await userCard.click()
}

/**
 * Enters a 4-digit PIN via the on-screen PIN pad.
 * Digits are rendered by components/kiosk/pin-pad.tsx with data-testid="pin-pad-{digit}".
 */
export async function enterPin(page: Page, pin: string) {
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new Error(`PIN must be exactly 4 digits, got: "${pin}"`)
  }
  for (const digit of pin) {
    await page.click(`[data-testid="pin-pad-${digit}"]`)
  }
}

/**
 * Clears the current PIN entry (clicks the backspace/clear button).
 */
export async function clearPin(page: Page) {
  const clearBtn = page.locator('[data-testid="pin-pad-clear"]')
  await expect(clearBtn).toBeVisible()
  await clearBtn.click()
}

/**
 * Full clock-in flow: navigate → select tenant → enter PIN → click clock-in.
 * Returns after the active-session indicator is visible.
 */
export async function clockIn(page: Page, tenantName: string, pin: string) {
  await page.goto('/kiosk')
  await selectTenant(page, tenantName)
  await enterPin(page, pin)
  const clockInBtn = page.locator('[data-testid="clock-in-button"]')
  await expect(clockInBtn).toBeVisible()
  await clockInBtn.click()
  await expect(page.locator('[data-testid="active-session"]')).toBeVisible()
}

/**
 * Full clock-out flow: assumes tenant is already clocked in and the active session is visible.
 */
export async function clockOut(page: Page) {
  const clockOutBtn = page.locator('[data-testid="clock-out-button"]')
  await expect(clockOutBtn).toBeVisible()
  await clockOutBtn.click()
  // Confirm the session ended — active-session indicator disappears
  await expect(page.locator('[data-testid="active-session"]')).not.toBeVisible()
}
```

## Usage

```ts
import { test, expect } from '@playwright/test'
import { clockIn, clockOut, enterPin, selectTenant } from '../helpers/kiosk'

test.describe('Kiosk clock-in flow', () => {
  test('correct PIN allows clock-in', async ({ page }) => {
    await clockIn(page, 'Jane Smith', process.env.TEST_KIOSK_PIN!)
  })

  test('incorrect PIN shows error and does not clock in', async ({ page }) => {
    await page.goto('/kiosk')
    await selectTenant(page, 'Jane Smith')
    await enterPin(page, '0000')
    await expect(page.locator('[data-testid="pin-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-session"]')).not.toBeVisible()
  })

  test('full clock-in then clock-out cycle', async ({ page }) => {
    await clockIn(page, 'Jane Smith', process.env.TEST_KIOSK_PIN!)
    await clockOut(page)
  })
})
```

## Notes

- `data-testid` values assumed from `components/kiosk/pin-pad.tsx` and `kiosk-controls.tsx`.
  If they're missing, add them to the components first — project standards require `data-testid` on all interactive elements.
- Kiosk tests do **not** need authenticated cookies — PIN is the auth mechanism.
- The kiosk page is intended for iPads: buttons are large and touch-friendly. Tests reflect this by using `click()` without coordinate offsets.
