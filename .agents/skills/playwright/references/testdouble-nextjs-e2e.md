# testdouble — Next.js E2E Auth Example

Source: https://github.com/testdouble/nextjs-e2e-test-example

Demonstrates battle-tested patterns for E2E testing Next.js apps with authenticated flows —
session caching, smoke vs feature test separation, and reusable auth helpers.

---

## Key Ideas to Apply Here

### 1. Separate Smoke Tests from Feature Tests

Run two distinct test projects in `playwright.config.ts`:

```ts
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'smoke',
      testMatch: '**/*.smoke.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'features',
      testMatch: 'tests/features/**/*.ts',
      // Features depend on auth setup running first
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.playwright/auth/tenant.json', // cached session
      },
    },
    {
      name: 'auth-setup',
      testMatch: 'tests/auth.setup.ts',
    },
  ],
})
```

**Smoke tests** — run on every PR push, fast, no auth dependencies:
- Homepage loads
- Login page renders
- Kiosk page renders

**Feature tests** — run with cached sessions, test actual user flows:
- Tenant creates a booking
- Admin approves application
- Kiosk clock-in / clock-out

### 2. Session Caching with storageState

Instead of logging in on every test (slow), authenticate once in a setup file and save the session:

```ts
// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test'
import path from 'path'

const tenantAuthFile = '.playwright/auth/tenant.json'
const adminAuthFile = '.playwright/auth/admin.json'

setup('authenticate as tenant', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', process.env.TEST_TENANT_EMAIL!)
  await page.fill('[data-testid="password-input"]', process.env.TEST_TENANT_PASSWORD!)
  await page.click('[data-testid="login-submit"]')
  await expect(page).toHaveURL(/\/calendar/)

  // Save session to disk — reused by all feature tests
  await page.context().storageState({ path: tenantAuthFile })
})

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', process.env.TEST_ADMIN_EMAIL!)
  await page.fill('[data-testid="password-input"]', process.env.TEST_ADMIN_PASSWORD!)
  await page.click('[data-testid="login-submit"]')
  await page.context().storageState({ path: adminAuthFile })
})
```

Add `.playwright/` to `.gitignore` so cached sessions are never committed.

### 3. Reusable Auth Helpers (spec.helpers.ts pattern)

```ts
// tests/helpers/auth.ts
import { Page, expect } from '@playwright/test'

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', email)
  await page.fill('[data-testid="password-input"]', password)
  await page.click('[data-testid="login-submit"]')
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]')
  await page.click('[data-testid="sign-out-button"]')
  await expect(page).toHaveURL(/\/login/)
}
```

### 4. Smoke Spec Pattern

```ts
// tests/smoke.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Smoke — critical paths', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Culinary Block/)
  })

  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible()
  })

  test('kiosk page renders', async ({ page }) => {
    await page.goto('/kiosk')
    // Kiosk requires no auth — should render user selection
    await expect(page.locator('[data-testid="user-card"]').first()).toBeVisible()
  })
})
```

### 5. Useful npm Scripts to Add

```json
// package.json additions
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:smoke": "playwright test --project=smoke",
  "test:e2e:features": "playwright test --project=features",
  "test:e2e:record": "playwright codegen http://127.0.0.1:3000",
  "test:e2e:debug": "playwright test --debug"
}
```

---

## Recommendation for This Project

Adopt the **smoke / features split + session caching** pattern as soon as you have more than 5 tests.
It dramatically speeds up CI because the auth login step only runs once per suite, not per test.
