# Environment Setup for Playwright Tests

## Required `.env.local` Variables

Add these to your `.env.local` (never commit real credentials):

```bash
# Test tenant account (active, has kiosk PIN set)
TEST_TENANT_EMAIL=test-tenant@yourdomain.com
TEST_TENANT_PASSWORD=your-test-password

# Test admin account
TEST_ADMIN_EMAIL=test-admin@yourdomain.com
TEST_ADMIN_PASSWORD=your-admin-password

# Kiosk PIN for the test tenant (4 digits, set in Supabase via set_user_pin RPC)
TEST_KIOSK_PIN=1234
```

## Recommended: Separate Test Supabase Project

To avoid polluting real production data:

1. Create a separate Supabase project for testing (free tier works).
2. Run migrations against it: `tsx scripts/db-migrate.ts` (pointing at the test project).
3. Seed test data: `tsx scripts/seed-test-data.ts`.
4. Point `.env.local` at the test project's URL/keys only during test runs.

For CI, set these as GitHub Actions secrets and inject via `env:` in the workflow.

## CI Environment Setup (GitHub Actions)

```yaml
# .github/workflows/e2e.yml
- name: Run Playwright Tests
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
    TEST_TENANT_EMAIL: ${{ secrets.TEST_TENANT_EMAIL }}
    TEST_TENANT_PASSWORD: ${{ secrets.TEST_TENANT_PASSWORD }}
    TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
    TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}
    TEST_KIOSK_PIN: ${{ secrets.TEST_KIOSK_PIN }}
  run: npm run test:e2e
```

## Checking the Environment Before Running Tests

```bash
node -e "
const vars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'TEST_TENANT_EMAIL',
  'TEST_ADMIN_EMAIL',
  'TEST_KIOSK_PIN'
]
vars.forEach(v => console.log(v, process.env[v] ? '✅' : '❌ MISSING'))
"
```
