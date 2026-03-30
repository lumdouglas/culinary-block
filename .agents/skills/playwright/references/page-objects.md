# Page Object Model (POM) Reference

Use POMs for flows that span multiple steps (login, booking creation) to avoid duplicating
selectors across spec files. For simple single-page tests, helpers are sufficient.

## When to Create a POM

✅ Three or more spec files reference the same page/flow
✅ A page has complex state (multi-step wizard, dynamic forms)
❌ One-off test against a simple read-only page → use helpers directly

## File Location

```
tests/
└── pages/
    ├── LoginPage.ts
    ├── KioskPage.ts
    └── CalendarPage.ts
```

## Example: KioskPage POM

```ts
// tests/pages/KioskPage.ts
import { Page, Locator, expect } from '@playwright/test'

export class KioskPage {
  readonly page: Page
  readonly userCards: Locator
  readonly pinPad: (digit: string) => Locator
  readonly clockInButton: Locator
  readonly clockOutButton: Locator
  readonly activeSession: Locator
  readonly pinError: Locator

  constructor(page: Page) {
    this.page = page
    this.userCards = page.locator('[data-testid="user-card"]')
    this.pinPad = (digit: string) => page.locator(`[data-testid="pin-pad-${digit}"]`)
    this.clockInButton = page.locator('[data-testid="clock-in-button"]')
    this.clockOutButton = page.locator('[data-testid="clock-out-button"]')
    this.activeSession = page.locator('[data-testid="active-session"]')
    this.pinError = page.locator('[data-testid="pin-error"]')
  }

  async goto() {
    await this.page.goto('/kiosk')
  }

  async selectTenant(name: string) {
    await this.userCards.filter({ hasText: name }).click()
  }

  async enterPin(pin: string) {
    for (const digit of pin) {
      await this.pinPad(digit).click()
    }
  }

  async clockIn(tenantName: string, pin: string) {
    await this.goto()
    await this.selectTenant(tenantName)
    await this.enterPin(pin)
    await this.clockInButton.click()
    await expect(this.activeSession).toBeVisible()
  }
}
```

## Usage in a Spec

```ts
import { test, expect } from '@playwright/test'
import { KioskPage } from '../pages/KioskPage'

test('kiosk clock-in via POM', async ({ page }) => {
  const kiosk = new KioskPage(page)
  await kiosk.clockIn('Jane Smith', process.env.TEST_KIOSK_PIN!)
  await expect(kiosk.activeSession).toBeVisible()
})
```
