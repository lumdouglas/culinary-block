# Culinary Block — Project Guide

## What This Project Is

**Culinary Block** is a commercial kitchen rental management platform — a SaaS system for a shared 8,000 sq ft professional kitchen facility in San Jose, CA serving food entrepreneurs, caterers, and bakers.

Core functions:
- **Tenant onboarding:** Public application form → admin approval → Supabase invite email → account setup with password creation
- **Booking calendar:** Tenants reserve kitchen stations (Hood1R, Hood1L, Oven L, etc.); conflict-checked at the DB level with exclusion constraints and 15-minute interval enforcement
- **Kiosk timesheet system:** iPad-mounted clock-in/out terminal — tenants select their name, enter a 4-digit PIN, and sessions are recorded automatically
- **Invoicing:** Admin creates invoices with line items; tenants view invoice status and breakdowns under Billing
- **Maintenance tickets:** Tenants report equipment issues with priority levels; admins track resolution
- **Admin panel:** Application review, tenant activation/deactivation, timesheet oversight, request handling

### Pricing Model

Tiered hourly pricing (defined in `lib/utils/pricing.ts`):
- First 20 hours: $50/hr
- Hours 21–100: $40/hr
- Over 100 hours: $30/hr

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Auth & DB | Supabase (PostgreSQL + RLS + Auth + Storage) |
| Styling | Tailwind CSS 4 + Shadcn UI (Radix primitives) |
| Forms | React Hook Form + Zod validation |
| Calendar | FullCalendar 6 (daygrid, timegrid, list, interaction) |
| Dates | date-fns |
| Icons | lucide-react |
| Toasts | sonner |
| PIN hashing | bcrypt-ts (hashed via Supabase RPC `set_user_pin` / `verify_kiosk_pin`) |
| AI (partial) | Vercel AI SDK (`ai`) + Google AI (`@ai-sdk/google`) |
| Path alias | `@/*` maps to project root (configured in `tsconfig.json`) |

---

## File Map

### App Router (`app/`)

**Public pages:**
| Path | Purpose |
|---|---|
| `app/page.tsx` | Landing page — hero image carousel, amenities showcase, feature grid, CTA, footer with Google Maps embed |
| `app/apply/page.tsx` | Public tenant application form |
| `app/apply/thank-you/page.tsx` | Post-submission confirmation |
| `app/contact/page.tsx` | Contact / request form (maintenance reports, rule violations) |
| `app/kiosk/page.tsx` | iPad clock-in/out terminal (PIN-authenticated) |

**Auth pages (`app/(auth)/`):**
| Path | Purpose |
|---|---|
| `login/page.tsx` | Email + password login |
| `signup/page.tsx` | Exists but invite-only flow is the primary onboarding path |
| `account-setup/page.tsx` | Handles invite link token → password creation |
| `account-setup/profile/page.tsx` | Profile completion after account setup |

**Dashboard pages (`app/(dashboard)/`):**
| Path | Purpose |
|---|---|
| `layout.tsx` | Dashboard shell layout |
| `calendar/page.tsx` | Booking calendar — tenants reserve stations via FullCalendar |
| `timesheets/page.tsx` | Tenant timesheet history, edit request submission |
| `settings/page.tsx` | Profile updates, password change, kiosk PIN management |
| `billing/page.tsx` | Billing overview |
| `billing/invoices/page.tsx` | Invoice list for the current tenant |
| `billing/invoices/[id]/page.tsx` | Single invoice detail with line items |
| `billing/invoices/new/page.tsx` | Admin: create a new invoice |
| `maintenance/page.tsx` | Maintenance ticket list |
| `maintenance/[id]/page.tsx` | Single ticket detail |
| `admin/timesheets/page.tsx` | Admin: view and edit all timesheets |

**Admin pages (`app/admin/`):**
| Path | Purpose |
|---|---|
| `applications/page.tsx` | Review pending tenant applications (approve/reject) |
| `tenants/page.tsx` | Manage active tenants (activate/deactivate) |
| `requests/page.tsx` | Review timesheet edit requests and other requests |

**Error handling:**
| Path | Purpose |
|---|---|
| `error.tsx` | Route-level error boundary |
| `global-error.tsx` | Root-level error boundary |
| `not-found.tsx` | 404 page |

### Server Actions (`app/actions/`)

All data mutations go through Server Actions — never raw client-side fetches to Supabase.

| File | Key functions |
|---|---|
| `bookings.ts` | `getStations`, `getBookingsForDateRange`, `checkAvailability`, `createBooking`, `cancelBooking`, `getUserBookings` |
| `kiosk.ts` | `verifyKioskPin`, `clockIn`, `clockOut`, `getActiveSession`, `updateTimesheet` |
| `invoicing.ts` | `createInvoice` (FormData-based), `updateInvoiceStatus`, `deleteInvoice` |
| `admin.ts` | `approveApplication` (sends Supabase invite), `rejectApplication`, `getApplications`, `getTenants`, `toggleTenantActive` |
| `applications.ts` | `approveApplication` (duplicate/alternate implementation) |
| `maintenance.ts` | `createTicket` (FormData-based), `updateTicketStatus` |
| `requests.ts` | `createRequest` (with photo upload to Supabase Storage), `getRequests`, `updateRequest` |
| `settings.ts` | `updateKioskPin` (via RPC `set_user_pin`) |

### API Routes (`app/api/`)

| Route | Purpose |
|---|---|
| `auth/callback/route.ts` | PKCE code exchange → session cookies → redirect |
| `kiosk/clock-in/route.ts` | POST: verify PIN + create timesheet record |
| `kiosk/clock-out/route.ts` | POST: update clock_out timestamp |
| `kiosk/active-session/route.ts` | GET: return currently open shift for a user |
| `kiosk-ipad/route.ts` | Kiosk iPad-specific endpoint |
| `settings/update-pin/route.ts` | POST: bcrypt hash + save kiosk PIN |
| `chat/route.ts` | AI chat route (partially integrated) |
| `timesheets/requests/route.ts` | Timesheet amendment request flow |
| `admin/timesheets/requests/route.ts` | Admin: list timesheet requests |
| `admin/timesheets/requests/[id]/route.ts` | Admin: approve/reject specific request |

### Components (`components/`)

| Directory/File | Purpose |
|---|---|
| `ui/` | Shadcn primitives: alert-dialog, badge, button, card, dialog, dropdown-menu, form, input, label, select, switch, table, tabs, textarea |
| `calendar/calendar-page-client.tsx` | Client wrapper for the calendar page |
| `calendar/calendar-view.tsx` | FullCalendar integration (day/week/list views) |
| `calendar/booking-modal.tsx` | Station + time selection modal for new bookings |
| `kiosk/pin-pad.tsx` | Numeric PIN entry pad (large touch-friendly buttons) |
| `kiosk/user-selection.tsx` | Tenant name picker on kiosk screen |
| `kiosk/user-card.tsx` | Individual tenant card in kiosk |
| `kiosk/kiosk-controls.tsx` | Clock in/out control panel |
| `kiosk/kiosk-actions.tsx` | Action buttons after authentication |
| `timesheets/edit-dialog.tsx` | Inline timesheet editing dialog |
| `timesheets/request-dialog.tsx` | Submit timesheet edit request |
| `timesheets/admin-actions.tsx` | Admin timesheet management actions |
| `settings/security-form.tsx` | Password + kiosk PIN update form |
| `maintenance/create-ticket-form.tsx` | New maintenance ticket form |
| `contact/request-form.tsx` | Contact page request form (maintenance/rule violation) |
| `admin/requests-table.tsx` | Admin requests management table |
| `shared/chat-assistant.tsx` | AI chat UI component (not yet wired into any page) |
| `site-nav.tsx` | Sticky header with desktop + mobile responsive nav |
| `user-menu.tsx` | User dropdown — shows tenant or admin links based on role, sign out |
| `application-details.tsx` | Application detail view for admin review |

### Database (`supabase/`)

**Base schema** defined in root-level SQL files:
- `001_initial_schema.sql` — profiles, kitchens, applications, bookings, timesheets tables + indexes + triggers
- `002_rls_policies.sql` — Row-level security policies for all tables
- `003_constraints_functions.sql` — Exclusion constraints, RPC functions (`set_user_pin`, `verify_kiosk_pin`)

**Core tables:**
| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users` — role (tenant/admin), company_name, email, phone, kiosk_pin_hash, is_active |
| `kitchens` | Physical kitchen resources with hourly_rate and calendar color_code |
| `stations` | Specific stations within kitchens (Hood1R, Hood1L, Oven L, etc.) |
| `applications` | Pre-approval records — pending/approved/rejected with admin notes |
| `bookings` | Calendar reservations with station_id, status (confirmed/cancelled), 15-minute interval constraint |
| `timesheets` | Clock-in/out records — nullable clock_out means shift is active; auto-calculated duration_minutes |
| `invoices` | Billing records — status: draft/open/paid/void/uncollectible; links to tenant via tenant_id |
| `invoice_lines` | Line items: description, quantity, unit_price, amount |
| `maintenance_tickets` | Equipment issues — priority (low/medium/high/critical), status (open/in_progress/resolved/closed) |
| `requests` | Generic request tracking — type (maintenance/rule_violation), supports photo uploads |
| `timesheet_requests` | Timesheet edit request workflow for admin approval |

**Migrations** (`supabase/migrations/`): 22 timestamped migration files covering schema evolution, RLS policies, security remediations, and profile field additions. Plus 4 unnumbered loose SQL files (`add_email_fix.sql`, `add_profile_fields.sql`, `create_requests_table.sql`, `test_drop_trigger.sql`) that may or may not be applied.

**Key database features:**
- `btree_gist` extension for exclusion constraints on booking overlaps
- `pgcrypto` extension for UUID generation
- `rrule` column on bookings for future recurring reservation support
- Automatic `updated_at` trigger on profiles and bookings
- RPC functions for PIN hashing and verification (server-side bcrypt)

### Utilities

| Path | Purpose |
|---|---|
| `utils/supabase/server.ts` | Async server-side Supabase client (cookie-based auth) |
| `utils/supabase/client.ts` | Browser-side Supabase client |
| `utils/supabase/admin.ts` | Service role client for elevated operations (invites, bypassing RLS) |
| `utils/supabase/middleware.ts` | Session refresh + route protection (redirects unauthenticated users from /calendar, /settings, /admin) |
| `middleware.ts` | Next.js middleware — delegates to `updateSession()`, excludes static files and API routes |
| `lib/utils.ts` | `cn()` helper — Tailwind class merging via clsx + tailwind-merge |
| `lib/utils/pricing.ts` | `calculateTieredCost()` — tiered hourly rate calculation |
| `lib/constants.ts` | `KITCHEN_RULES` — array of 15 facility rules displayed to tenants |
| `lib/validations/booking.ts` | Zod schema for booking form validation (kitchen_id, start_time, end_time) |
| `lib/validations/auth.ts` | Empty — placeholder for auth validation schemas |
| `types/database.ts` | TypeScript interfaces: Profile, Kitchen, Application, Booking, Timesheet |

### Scripts (`scripts/`)

Manual admin/dev scripts (run with `tsx`):
- `create-tenant.ts`, `create-admin.ts` — provision user accounts
- `seed-test-data.ts` — populate dev database
- `apply_migration.ts`, `db-migrate.ts` — run SQL migrations against Supabase
- `verify-bookings.ts` — validate booking data integrity
- `update-tenants.ts` — bulk tenant profile updates

### Docs (`docs/`)

- `SUPABASE_AUTH_SETUP.md` — invite flow setup, PKCE vs implicit token handling, environment variable config, flow diagram
- `EMAIL_TEMPLATES.md` — tenant invite email and timesheet announcement email copy

### Configuration Files

| File | Purpose |
|---|---|
| `next.config.ts` | Next.js config (CSP headers commented out) |
| `tsconfig.json` | TypeScript — strict mode, `@/*` path alias, ESNext target |
| `eslint.config.mjs` | ESLint with Next.js core-web-vitals + TypeScript rules |
| `postcss.config.mjs` | PostCSS with Tailwind CSS plugin |
| `components.json` | Shadcn UI configuration |
| `.gitignore` | Ignores node_modules, .next, .env*, build output |
| `.antigravityrules` | Squad analysis protocol for AI assistants (UX + engineering + logic checks) |
| `.cursorrules` | Cursor editor AI rules (subset of antigravityrules) |

---

## What Is Missing or Incomplete

### Clutter to Clean Up
- **25 `test-*.mjs` / `test-*.js` files** in the project root — one-off debug scripts (JWT decoding, PIN testing, invite testing, cookie debugging). These are not a test suite. Safe to move to `scripts/debug/` or delete.
- **`visual_review_*.webp`** — 2 screenshots in the root, leftover from UI review sessions.
- **`patch.mjs`, `fix-signout.mjs`, `debug-profiles-trigger.mjs`** — manual fix/debug scripts in the root.
- **`app/test-remediation/page.tsx`** — test page that should be removed.
- **Empty file:** `lib/validations/auth.ts` — placeholder with no content.
- **Empty migration:** `20260225012102_drop_trigger_test.sql` is 0 bytes.
- **Loose unnumbered SQL files** in `migrations/`: `add_email_fix.sql`, `add_profile_fields.sql`, `create_requests_table.sql`, `test_drop_trigger.sql` — unclear if applied.
- **Duplicate server action:** `app/actions/applications.ts` has an `approveApplication` that duplicates the one in `app/actions/admin.ts` with a different implementation.

### Missing Infrastructure
- **No `.env.example`** — new developers have no reference for required environment variables.
- **No CI/CD** — no GitHub Actions workflows, no automated checks on PRs.
- **No test suite** — no Jest, Vitest, or Playwright setup despite having `data-testid` attributes on components.
- **No error monitoring** — no Sentry or similar service.
- **`README.md`** is still the default `create-next-app` boilerplate — doesn't describe the project.

### Incomplete Features
- **Recurring bookings:** `bookings` table has an `rrule` column but no UI to create or display recurring reservations.
- **AI chat assistant:** `components/shared/chat-assistant.tsx` and `app/api/chat/route.ts` exist but the component is not rendered on any page.
- **Payment processing:** Invoicing system is complete but there is no Stripe or payment gateway integration.
- **Maintenance resolution workflow:** Tickets can be created and status updated, but there is no formal resolution/close UI flow for admins.
- **Email/SMS notifications:** No automated alerts for booking confirmations, invoice reminders, shift alerts, or maintenance updates.
- **Analytics/reporting:** No revenue, occupancy, or tenant usage dashboards.
- **Bulk admin operations:** Timesheets and invoices are managed one record at a time.
- **Admin role enforcement in middleware:** The admin role check in `utils/supabase/middleware.ts` is commented out — currently only checks authentication, not authorization.
- **CSP headers:** Content-Security-Policy configuration in `next.config.ts` is commented out.

---

## Engineering Standards

- **No `any` in TypeScript.** Use proper types or Zod inferred types exported as `XFormValues`.
- **All mutations via Server Actions** in `app/actions/` — never call Supabase directly from client components.
- **Dates:** Use `date-fns` helpers. Always use helpers for `datetime-local` inputs.
- **New UI components:** Use Shadcn (`components/ui/`) and Radix primitives only.
- **Kiosk UI:** Buttons must be large enough for touch/tablet. Think messy-hands UX.
- **RLS:** Every new table needs row-level security policies. Check `002_rls_policies.sql` for existing patterns.
- **Interactive elements:** Add `data-testid` attributes for future test automation.
- **Auth pattern:** Always call `supabase.auth.getUser()` in server actions before database operations. For admin actions, verify `profile.role === 'admin'` after authentication.
- **Revalidation:** Call `revalidatePath()` after mutations so server-rendered pages reflect changes.

---

## How to Run Locally

```bash
npm run dev      # Start Next.js dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
