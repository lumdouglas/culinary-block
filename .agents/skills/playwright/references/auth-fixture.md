# Auth Fixture

Extends Playwright's `test` with `tenantPage` and `adminPage` fixtures.
These skip the login UI entirely by injecting a Supabase session cookie directly.

## File: `tests/fixtures/auth.fixture.ts`

```ts
import { test as base, Page, BrowserContext } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

type AuthFixtures = {
  tenantPage: Page
  adminPage: Page
}

async function getSupabaseSession(email: string, password: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`Auth failed for ${email}: ${error?.message}`)
  return data.session
}

async function createAuthContext(
  context: BrowserContext,
  email: string,
  password: string
): Promise<Page> {
  const session = await getSupabaseSession(email, password)

  // Inject Supabase auth cookies so Next.js SSR sees the session
  const baseURL = 'http://127.0.0.1:3000'
  await context.addCookies([
    {
      name: 'sb-access-token',
      value: session.access_token,
      domain: '127.0.0.1',
      path: '/',
    },
    {
      name: 'sb-refresh-token',
      value: session.refresh_token,
      domain: '127.0.0.1',
      path: '/',
    },
  ])

  const page = await context.newPage()
  return page
}

export const test = base.extend<AuthFixtures>({
  tenantPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await createAuthContext(
      context,
      process.env.TEST_TENANT_EMAIL!,
      process.env.TEST_TENANT_PASSWORD!
    )
    await use(page)
    await context.close()
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await createAuthContext(
      context,
      process.env.TEST_ADMIN_EMAIL!,
      process.env.TEST_ADMIN_PASSWORD!
    )
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
```

## Setup

1. Add test credentials to `.env.local` — see [Env Setup](env-setup.md).
2. Import `test` from the fixture instead of `@playwright/test`:

```ts
// ✅ Use the extended test
import { test, expect } from '../fixtures/auth.fixture'

// ❌ Not the base test (no auth fixtures)
import { test, expect } from '@playwright/test'
```

## Notes

- Supabase SSR uses `@supabase/ssr` and reads cookies via `createServerClient`.
  The cookie names may differ in your environment — inspect browser cookies on a real login
  and match them in `addCookies()` above.
- If session expires mid-run, the fixture re-authenticates per test (each test gets a fresh context).
- For tests that don't need auth, use the base `test` from `@playwright/test` directly.
