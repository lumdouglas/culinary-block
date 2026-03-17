# qualiow-playwright-skills Reference

Source: https://github.com/willcoliveira/qualiow-playwright-skills

A CLI that scaffolds battle-tested Playwright agent skill packs into any project.
When you can't find a pattern in the existing references, this is where to look next.

---

## What It Covers

The skill packs that matter most for this project:

| Skill Pack | What It Covers |
|------------|----------------|
| **playwright-patterns** | `waitForResponse` ordering, `toPass` retry blocks, `expect.poll` for API polling, network-first safeguards, Zod response validation |
| **data-strategy** | Static data vs dynamic factories decision table; `@faker-js/faker` factory pattern template |
| **test-review** | 7-category review checklist: assertions, selectors, timing, isolation, POM, readability, reliability |
| **test-debugging** | Failure pattern table, debug workflow (error → Playwright UI → trace → CI reports), app bug vs test bug decision tree |
| **test-generation** | Spec template, critical import rules, form filling patterns, fixture docs, tag reference |
| **test-planning** | Exploration workflow, test plan template (objective, env, flow, auth, teardown, tags) |
| **page-object-conventions** | POM class structure, selector priority, composition, factory pattern, iframe handling |
| **project-conventions** | MUST/SHOULD/WON'T rules, file org, CI/CD conventions, ESLint Playwright plugin |

---

## Key Patterns from This Library

### Network-First Safeguard (waitForResponse)

Always start `waitForResponse` **before** the action that triggers it, not after:

```ts
// ❌ Race condition — response may arrive before you start waiting
await page.click('[data-testid="save-button"]')
const response = await page.waitForResponse('/api/bookings')

// ✅ Start listening before the trigger
const responsePromise = page.waitForResponse('/api/bookings')
await page.click('[data-testid="save-button"]')
const response = await responsePromise
expect(response.status()).toBe(200)
```

### toPass — Retrying Flaky Assertions

Use `expect(async () => { ... }).toPass()` for actions that depend on eventual consistency:

```ts
// ✅ Retries the whole block until it passes or times out
await expect(async () => {
  await page.click('[data-testid="refresh-button"]')
  await expect(page.locator('[data-testid="active-session"]')).toBeVisible({ timeout: 1000 })
}).toPass({ timeout: 10_000 })
```

### expect.poll — Polling an API State

```ts
// ✅ Polls until the condition is true
await expect.poll(
  async () => {
    const res = await page.request.get('/api/kiosk/active-session')
    return res.status()
  },
  { timeout: 8000, intervals: [500, 1000, 2000] }
).toBe(200)
```

### Test Data: Static vs. Dynamic

| Scenario | Use Static | Use Dynamic Factory |
|----------|------------|---------------------|
| Fixed tenant names on kiosk | ✅ | |
| Creating a new booking in a test | | ✅ |
| Checking invoice line items | ✅ | |
| Multi-user concurrent booking test | | ✅ |

Dynamic factory example with `@faker-js/faker`:

```ts
import { faker } from '@faker-js/faker'

export function createTestBooking(overrides = {}) {
  return {
    station: 'Hood1R',
    startTime: faker.date.future().toISOString(),
    duration: 60,
    ...overrides,
  }
}
```

### Test Review Checklist (before merging a spec)

1. **Assertions** — Does every test assert something meaningful? No empty tests.
2. **Selectors** — `data-testid` first, ARIA role second, text third. No generated class names.
3. **Timing** — No `waitForTimeout`. Use `toBeVisible`, `toPass`, `expect.poll`.
4. **Isolation** — Each test resets its own state. No shared mutable state between tests.
5. **POM** — Complex multi-step flows use page objects; simple pages use helpers.
6. **Readability** — Test name describes user behavior, not implementation.
7. **Reliability** — Passes >= 10 consecutive runs on CI without flakiness.

---

## CLI Quick-Start (optional — scaffold more skill files)

```bash
# Install the CLI
npm install -g qualiow-playwright-skills

# Run the scaffolder (will detect playwright.config.ts automatically)
wico

# Select platforms: Generic → .agent-skills/
# Select packs: Core Patterns + Playwright CLI + Project Templates
# Project name: culinary-block
# Base URL: http://127.0.0.1:3000
# Fixture path: ../fixtures/auth.fixture
# Page objects dir: tests/pages
# Test dir: tests/
```

The generated files can be added into `skills/playwright/references/` for permanence.
