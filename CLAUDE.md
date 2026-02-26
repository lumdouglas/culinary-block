# Culinary Block — Claude Code Guide

## What This Project Is

**Culinary Block** is a commercial kitchen rental management platform — a SaaS system for a shared 8,000 sq ft professional kitchen facility serving food entrepreneurs, caterers, and bakers.

Core functions:
- **Tenant onboarding:** Application → admin approval → invite email → account setup
- **Booking calendar:** Tenants reserve kitchen stations; conflict-checked at the DB level
- **Kiosk timesheet system:** iPad clock-in/out terminal with PIN authentication
- **Invoicing:** Admin creates invoices with line items; tenants view their billing
- **Maintenance tickets:** Tenants report equipment issues; admins track resolution
- **Admin panel:** Application review, tenant management, timesheet oversight, request handling

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Auth & DB | Supabase (PostgreSQL + RLS + Auth) |
| Styling | Tailwind CSS 4 + Shadcn UI (Radix primitives) |
| Forms | React Hook Form + Zod validation |
| Calendar | FullCalendar 6 |
| Dates | date-fns |
| PIN hashing | bcrypt-ts |
| AI (partial) | Vercel AI SDK + Google AI |
| Path alias | `@/*` maps to project root |

---

## Squad Analysis Protocol

When working on any feature, always check three angles (from `.antigravityrules`):

- **UX Check:** Does this UI work on a tablet/kiosk? Is data hierarchy scannable?
- **Engineering Check:** How does this affect the `bookings` schema? Are RLS policies updated?
- **Logic Check:** Does this handle overlapping timeslots or billing edge cases?

---

## File Map

### App Router (`app/`)

| Path | Purpose |
|---|---|
| `app/page.tsx` | Public landing page (hero carousel, amenities, CTA) |
| `app/(auth)/login/` | Email + password login |
| `app/(auth)/signup/` | (Exists but invite-only flow is primary) |
| `app/(auth)/account-setup/` | Handles invite link token → password creation |
| `app/(dashboard)/calendar/` | Booking calendar for tenants |
| `app/(dashboard)/timesheets/` | Tenant timesheet history + edit requests |
| `app/(dashboard)/settings/` | Profile, password, kiosk PIN management |
| `app/(dashboard)/billing/invoices/` | Invoice list, detail, new invoice |
| `app/(dashboard)/maintenance/` | Report and track equipment issues |
| `app/admin/applications/` | Admin: review tenant applications |
| `app/admin/tenants/` | Admin: manage active tenants |
| `app/admin/requests/` | Admin: approve timesheet/other requests |
| `app/admin/timesheets/` | Admin: view and edit all timesheets |
| `app/apply/` | Public application form |
| `app/kiosk/` | iPad clock-in/out terminal |
| `app/contact/` | Contact form |

### Server Actions (`app/actions/`)

All mutations go through Server Actions — never raw client-side fetches to Supabase.

| File | Covers |
|---|---|
| `bookings.ts` | getStations, getBookingsForDateRange, createBooking, cancelBooking |
| `kiosk.ts` | verifyKioskPin, clockIn, clockOut, getActiveSession |
| `invoicing.ts` | createInvoice, updateInvoiceStatus, deleteInvoice |
| `admin.ts` | approveApplication, rejectApplication, pagination helpers |
| `applications.ts` | submitApplication |
| `maintenance.ts` | Create/update maintenance tickets |
| `requests.ts` | Timesheet edit requests |
| `settings.ts` | Profile updates, PIN/password changes |

### API Routes (`app/api/`)

| Route | Purpose |
|---|---|
| `auth/callback/` | PKCE code exchange → session cookies |
| `kiosk/clock-in/` | POST: verify PIN + create timesheet |
| `kiosk/clock-out/` | POST: update clock_out |
| `kiosk/active-session/` | GET: return open shift |
| `settings/update-pin/` | POST: bcrypt hash + save kiosk PIN |
| `chat/` | AI chat route (partial) |
| `timesheets/requests/` | Timesheet amendment request flow |

### Components (`components/`)

| Directory/File | Purpose |
|---|---|
| `ui/` | Shadcn UI primitives (button, input, dialog, etc.) |
| `calendar/` | CalendarPageClient, CalendarView (FullCalendar), BookingModal |
| `kiosk/` | PinPad, UserSelection, UserCard, KioskControls, KioskActions |
| `timesheets/` | EditDialog, RequestDialog, AdminActions |
| `settings/` | SecurityForm (password + PIN update) |
| `maintenance/` | CreateTicketForm |
| `admin/` | RequestsTable |
| `shared/chat-assistant.tsx` | AI chat UI (partially integrated) |
| `site-nav.tsx` | Sticky header, desktop + mobile nav |
| `user-menu.tsx` | User dropdown (tenant vs admin links, sign out) |
| `application-details.tsx` | Application detail view |

### Database (`supabase/`)

**Core tables:**
- `profiles` — extends auth.users; stores role (tenant|admin), kiosk_pin_hash, company info
- `kitchens` — physical kitchen resources with hourly_rate and color_code
- `stations` — specific stations within kitchens (Hood1R, Hood1L, Oven L, etc.)
- `applications` — pre-approval records (pending|approved|rejected)
- `bookings` — calendar reservations with conflict exclusion constraint
- `timesheets` — clock-in/out records; nullable clock_out for active shifts
- `invoices` + `invoice_lines` — billing with status (draft|open|paid|void)
- `maintenance_tickets` — equipment issue tracking
- `timesheet_requests` — admin approval workflow for edits
- `requests` — generic request tracking

**Migrations** (`supabase/migrations/`): 26 files covering initial schema, RLS policies, feature additions, and security remediations. Several loose `.sql` files in the migrations folder are unnumbered and may be unapplied.

### Utilities

| Path | Purpose |
|---|---|
| `utils/supabase/server.ts` | Async server-side Supabase client |
| `utils/supabase/client.ts` | Browser Supabase client |
| `utils/supabase/admin.ts` | Service role client for admin ops |
| `utils/supabase/middleware.ts` | Session refresh + auth redirects |
| `middleware.ts` | Route protection (redirects unauthenticated users) |
| `lib/utils.ts` | Tailwind class merging (cn helper) |
| `lib/validations/` | Zod schemas |
| `types/database.ts` | TypeScript interfaces for all DB tables |

### Scripts (`scripts/`)

Manual admin/dev scripts (run with `tsx`):
- `create-tenant.ts`, `create-admin.ts` — provision accounts
- `seed-test-data.ts` — populate dev DB
- `apply_migration.ts`, `db-migrate.ts` — migration helpers
- `verify-bookings.ts`, `update-tenants.ts` — data verification

### Docs (`docs/`)

- `SUPABASE_AUTH_SETUP.md` — invite flow setup, PKCE vs implicit tokens, env var config

---

## What Is Missing or Incomplete

### Clutter to Clean Up
- **25+ `test-*.mjs` / `test-*.js` files** in the project root — manual debug scripts, not a test suite. Safe to archive or delete.
- **`visual_review_*.webp`** screenshots in root — leftover from UI review sessions.
- **Empty migration:** `20260225012102_drop_trigger_test.sql` is 0 bytes.
- **Loose unnumbered SQL files** in `migrations/`: `add_email_fix.sql`, `add_profile_fields.sql`, `create_requests_table.sql`, `test_drop_trigger.sql` — unclear if applied.

### Missing Infrastructure
- **No `.env.example`** — new developers have no reference for required environment variables.
- **No CI/CD** — no GitHub Actions workflows.
- **No real test suite** — no Jest, Vitest, or Playwright setup despite having `data-testid` attributes on components.
- **No error monitoring** — no Sentry or similar.

### Incomplete Features
- **Recurring bookings:** `bookings` table has an `rrule` column but no UI to create recurring reservations.
- **AI chat assistant:** `components/shared/chat-assistant.tsx` and `app/api/chat/route.ts` exist but the feature is not integrated into any page.
- **Payment processing:** Invoicing system is complete but there is no Stripe or payment gateway integration.
- **Maintenance resolution workflow:** Tickets can be created but there is no formal close/resolve flow.
- **Email/SMS notifications:** No automated alerts for booking confirmations, invoice reminders, or shift alerts.
- **Analytics/reporting:** No revenue, occupancy, or tenant usage dashboards.
- **Bulk admin operations:** Timesheet management is handled one record at a time.

---

## Engineering Standards to Follow

- **No `any` in TypeScript.** Export Zod types as `XFormValues`.
- **All mutations via Server Actions** in `app/actions/` — not client-side Supabase calls.
- **Dates:** Use `date-fns` helpers. Always use helpers for `datetime-local` inputs.
- **New UI components:** Use Shadcn (`components/ui/`) and Radix primitives only.
- **Kiosk UI:** Buttons must be large enough for touch/tablet. Think messy-hands UX.
- **RLS:** Every new table needs row-level security policies. Check `002_rls_policies.sql` for patterns.
- **Interactive elements:** Add `data-testid` attributes for future test coverage.

---

## How to Run Locally

```bash
npm run dev      # Start Next.js dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

Required environment variables (see `docs/SUPABASE_AUTH_SETUP.md`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Suggested Next Priorities

1. **Create `.env.example`** — document all required env vars
2. **Archive root test files** — move `test-*.mjs` to `scripts/debug/` or delete
3. **Wire up the AI chat assistant** — component and API route exist, just needs a page hook
4. **Add Stripe integration** — invoices are built; payment collection is the gap
5. **Set up Playwright** — `data-testid` attributes are already in place
6. **Build recurring booking UI** — `rrule` column is in the schema waiting to be used
7. **Add a GitHub Actions workflow** — lint + build check on PRs
