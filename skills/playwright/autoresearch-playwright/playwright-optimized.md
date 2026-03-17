---
name: playwright-e2e
description: >
  Write, run, and maintain Playwright E2E tests for the culinary-block Next.js app.
  Use when: writing a new test, adding coverage for auth flows (login, invite, account-setup),
  kiosk flows (PIN entry, clock-in/out), or admin flows (application approval, tenant management).
  Triggers on: "write a test", "add e2e coverage", "test the login flow", "test the kiosk",
  "playwright", "e2e test", "end-to-end".
---

# Playwright E2E Testing — Culinary Block

Tests live in `tests/` and run against a local dev server (`npm run dev` on port 3000).
Config: `playwright.config.ts` — Chromium only, `baseURL: http://127.0.0.1:3000`.

---

## Project Structure

```
tests/
├── fixtures/
│   ├── auth.fixture.ts      # Authenticated page fixture (tenant + admin)
│   └── kiosk.fixture.ts     # Kiosk page fixture (no auth cookie needed)
├── helpers/
│   ├── auth.ts              # Login / sign-out helpers
│   └── kiosk.ts             # PIN entry / clock helpers
├── auth/
│   ├── login.spec.ts        # Login page happy + sad paths
│   ├── account-setup.spec.ts # Invite → password creation flow
│   └── middleware.spec.ts   # Protected route redirects
├── kiosk/
│   ├── clock-in.spec.ts     # Tenant selects name, enters PIN, clocks in
│   └── clock-out.spec.ts    # Active session clock-out
├── admin/
│   ├── applications.spec.ts # Approve / reject tenant applications
│   └── tenants.spec.ts      # Activate / deactivate tenants
├── dashboard/
│   ├── calendar.spec.ts     # Booking creation / cancel
│   └── timesheets.spec.ts   # Timesheet view + edit request
└── example.spec.ts          # Default smoke test (keep as sanity check)
```

---

## Before Writing Tests

1. **Read the helpers** in `tests/helpers/` before referencing auth or kiosk state.
2. **Check existing fixtures** in `tests/fixtures/` — prefer them over rolling your own setup.
3. **Check `data-testid` attributes** in components. All interactive elements should already have them per project standards. If missing, add `data-testid` to the component first.
4. **Never hard-code credentials** — use env vars from `.env.local` (see references/env-setup.md).

---

## Running Tests

```bash
# Run all tests (starts dev server automatically)
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Run a single file
npx playwright test tests/auth/login.spec.ts

# Run with headed browser (good for debugging)
npx playwright test --headed tests/kiosk/clock-in.spec.ts

# Debug a specific test
npx playwright test --debug tests/auth/login.spec.ts
```

---

## Auth Fixture Pattern

Always use the `authenticatedPage` fixture for tests that require a logged-in session.
See `tests/fixtures/auth.fixture.ts` for the full implementation.

```ts
import { test } from '../fixtures/auth.fixture'

test('tenant sees their bookings', async ({ tenantPage }) => {
  await tenantPage.goto('/calendar')
  await expect(tenantPage.locator('h1')).toContainText('My Bookings')
})

test('admin sees all tenants', async ({ adminPage }) => {
  await adminPage.goto('/admin/tenants')
  await expect(adminPage.locator('[data-testid="tenants-table"]')).toBeVisible()
})
```

---

## Kiosk Test Pattern

Kiosk tests run at `/kiosk` with no auth cookie — PIN entry is the auth mechanism.

```ts
import { test, expect } from '@playwright/test'
import { enterPin, selectTenant } from '../helpers/kiosk'

test('tenant can clock in with correct PIN', async ({ page }) => {
  await page.goto('/kiosk')
  await selectTenant(page, 'Jane Smith')
  await enterPin(page, '1234') // uses data-testid="pin-pad-*"
  await expect(page.locator('[data-testid="clock-in-button"]')).toBeVisible()
  await page.click('[data-testid="clock-in-button"]')
  await expect(page.locator('[data-testid="active-session"]')).toBeVisible()
})

test('wrong PIN shows error', async ({ page }) => {
  await page.goto('/kiosk')
  await selectTenant(page, 'Jane Smith')
  await enterPin(page, '0000')
  await expect(page.locator('[data-testid="pin-error"]')).toBeVisible()
})
```

---

## Auth Flow Patterns

### Login

```ts
import { test, expect } from '@playwright/test'
import { login, logout } from '../helpers/auth'

test('valid credentials redirect to calendar', async ({ page }) => {
  await login(page, process.env.TEST_TENANT_EMAIL!, process.env.TEST_TENANT_PASSWORD!)
  await expect(page).toHaveURL(/\/calendar/)
})

test('invalid credentials show error', async ({ page }) => {
  await login(page, 'notreal@example.com', 'wrongpassword')
  await expect(page.locator('[data-testid="login-error"]')).toBeVisible()
})
```

### Protected Route Redirect

```ts
test('unauthenticated user is redirected from /calendar to /login', async ({ page }) => {
  await page.goto('/calendar')
  await expect(page).toHaveURL(/\/login/)
})
```

---

## Selectors — Priority Order

1. `data-testid` attributes (preferred — stable, semantic)
2. ARIA roles: `page.getByRole('button', { name: 'Clock In' })`
3. Text content: `page.getByText('Clock In')`
4. CSS selectors: only as last resort, never rely on generated class names (Tailwind)

---

## Test Naming Convention

Test names MUST describe what the **user experiences**, not what the code does.

```ts
// ❌ Implementation detail — describes code, not behavior
test('calls clockIn() with correct tenantId', ...)
test('verifies POST /api/kiosk/clock-in returns 200', ...)
test('setActiveSession state updates', ...)

// ✅ User behavior — describes what someone observes
test('tenant can clock in with correct PIN', ...)
test('wrong PIN shows an error message', ...)
test('unauthenticated user is redirected to login', ...)
test('admin can approve a pending application', ...)
```

Use `test.describe` to group by feature or role:
```ts
test.describe('Kiosk — clock-in flow', () => {
  test('tenant sees their name in the user list', ...)
  test('correct PIN reveals the clock-in button', ...)
  test('wrong PIN shows an error without clocking in', ...)
})
```

---

## Anti-Patterns to Avoid

| ❌ Bad | ✅ Good |
|--------|---------|
| `page.waitForTimeout(2000)` | `await expect(locator).toBeVisible()` |
| Hard-coded test credentials in spec files | `process.env.TEST_TENANT_EMAIL` |
| `page.locator('.bg-green-500')` | `page.locator('[data-testid="success-badge"]')` |
| Running tests against production DB | Use dedicated test Supabase project or mocks |
| Testing implementation details | Test user-visible outcomes |
| Test name describes code: `'calls clockIn()'` | Test name describes behavior: `'tenant clocks in'` |

---

## References

- [Auth Fixture](references/auth-fixture.md) — Full fixture source + setup instructions
- [Kiosk Helper](references/kiosk-helper.md) — PIN entry, clock-in/out utilities
- [Env Setup](references/env-setup.md) — Required env vars for test runs
- [Page Object Model](references/page-objects.md) — When and how to use POMs for complex flows
- [qualiow-playwright-skills](references/qualiow-playwright-skills.md) — Battle-tested patterns: `waitForResponse`, `toPass`, `expect.poll`, data strategy, test review checklist, CLI scaffolding
- [testdouble Next.js E2E](references/testdouble-nextjs-e2e.md) — Session caching with `storageState`, smoke/feature test split, auth helpers, recommended npm scripts
- https://playwright.dev/docs/
