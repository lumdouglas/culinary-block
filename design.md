# Culinary Block — System Design

## 1. Product Overview

Culinary Block is a commercial kitchen rental management platform for an 8,000 sq ft shared kitchen facility in San Jose, CA. It serves two distinct user groups — **tenants** (food entrepreneurs, caterers, bakers) and **facility admins** — through a single Next.js application with role-gated views.

The platform automates the full tenant lifecycle: application, onboarding, station booking, time tracking, invoicing, and facility maintenance. A separate **Growth Engine** (Python/FastAPI) handles autonomous marketing operations.

### Core Value Propositions

| Audience | Value |
|----------|-------|
| **Tenants** | Self-service booking, kiosk-based clock-in/out, transparent billing, maintenance reporting |
| **Admins** | Automated onboarding pipeline, conflict-free scheduling, timesheet oversight, tiered invoicing |
| **Facility** | Maximized station utilization, audit-ready time records, reduced manual coordination |

---

## 2. User Roles & Permissions

### Tenant

- Submit applications and complete onboarding
- Book kitchen stations via interactive calendar
- Clock in/out at the physical kiosk (PIN-authenticated)
- View personal timesheets and request edits
- View invoices and billing history
- Submit maintenance tickets and general requests
- Manage profile, password, and kiosk PIN

### Admin

- Review and approve/reject tenant applications (triggers Supabase invite)
- Activate/deactivate tenant accounts
- Manage all timesheets (verify, edit, create, delete)
- Approve/reject timesheet edit requests
- Create invoices with line items; manage billing periods
- Handle maintenance tickets and requests
- Full calendar visibility across all tenants

### Kiosk (Unauthenticated Terminal)

- Displays active tenants for selection
- Accepts 4-digit PIN entry (bcrypt-verified via Supabase RPC)
- Clock in/out interface with large touch-friendly controls
- Designed for wall-mounted iPads in the kitchen environment

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌────────┐  ┌──────────┐  │
│  │ Landing  │  │  Dashboard   │  │ Admin  │  │  Kiosk   │  │
│  │  (SSR)   │  │   (SSR+CSR)  │  │ (SSR)  │  │  (CSR)   │  │
│  └──────────┘  └──────────────┘  └────────┘  └──────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Server Actions   │  │   API Routes     │                │
│  │  (app/actions/)   │  │   (app/api/)     │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
│           │                      │                          │
│  ┌────────┴──────────────────────┴─────────┐                │
│  │          Middleware Layer                │                │
│  │  - Session refresh (PKCE cookies)       │                │
│  │  - Route protection (auth + role)       │                │
│  └─────────────────────┬───────────────────┘                │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Platform                         │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │   Auth   │  │ Postgres │  │ Storage  │  │    RPCs    │  │
│  │  (PKCE)  │  │  (+ RLS) │  │ (photos) │  │ (PIN ops)  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Rendering Strategy

| Surface | Strategy | Rationale |
|---------|----------|-----------|
| Landing page | SSR | SEO, fast first paint |
| Application form | SSR + client validation | Progressive enhancement |
| Dashboard pages | SSR with client hydration | Fresh data on load, interactive controls |
| Calendar | Client-side (FullCalendar) | Heavy interaction, drag/drop, real-time updates |
| Kiosk | Full CSR | Persistent single-page terminal, no navigation |
| Admin tables | SSR | Data-heavy, scannable on first render |

### Data Mutation Pattern

All writes flow through **Server Actions** (`app/actions/`). Every action:

1. Calls `supabase.auth.getUser()` to verify the session
2. Checks `profile.role === 'admin'` for admin-only operations
3. Performs the database operation via the Supabase client
4. Calls `revalidatePath()` to refresh cached server-rendered pages
5. Returns a typed result (`{ success, error?, data? }`)

Client components never call Supabase directly for mutations.

---

## 4. Data Model

### Entity Relationship Diagram

```
 ┌──────────────┐         ┌──────────────┐
 │ applications │────────▶│   profiles   │
 │              │ approve  │              │
 │ status:      │ creates  │ role: enum   │
 │  pending     │          │ is_active    │
 │  approved    │          │ kiosk_pin    │
 │  rejected    │          │ company_name │
 └──────────────┘          └──────┬───────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
             ┌───────────┐ ┌───────────┐ ┌────────────────┐
             │ bookings  │ │timesheets │ │   invoices     │
             │           │ │           │ │                │
             │ station ──┤ │ kitchen ──┤ │ tenant_id      │
             │ start     │ │ clock_in  │ │ status: enum   │
             │ end       │ │ clock_out │ │ total          │
             │ status    │ │ duration  │ │                │
             └─────┬─────┘ │ status    │ └───────┬────────┘
                   │       └─────┬─────┘         │
                   │             │               ▼
                   ▼             ▼         ┌────────────┐
             ┌──────────┐ ┌───────────┐   │invoice_lines│
             │ stations │ │ kitchens  │   │            │
             │          │ │           │   │ qty        │
             │ category │ │ hourly_   │   │ unit_price │
             │ equipment│ │   rate    │   │ amount     │
             └──────────┘ └───────────┘   └────────────┘

             ┌───────────────────┐  ┌──────────────────┐
             │maintenance_tickets│  │    requests       │
             │                   │  │                   │
             │ kitchen_id        │  │ type: enum        │
             │ priority          │  │ photo_url         │
             │ status            │  │ status            │
             └───────────────────┘  └──────────────────┘

             ┌───────────────────┐  ┌──────────────────┐
             │timesheet_requests │  │ billing_periods  │
             │                   │  │                   │
             │ type: create/     │  │ tenant_id         │
             │   update/delete   │  │ period_month      │
             │ status: pending/  │  │ status: in_prog/  │
             │   approved/       │  │   pending/        │
             │   rejected        │  │   invoiced        │
             └───────────────────┘  └──────────────────┘
```

### Key Constraints

| Constraint | Mechanism | Purpose |
|------------|-----------|---------|
| No double-booking | `btree_gist` exclusion constraint per station | DB-level overlap prevention |
| 15-minute intervals | Application-level validation | Consistent scheduling grid |
| 30 min – 12 hr duration | Zod schema + server validation | Practical booking bounds |
| One active timesheet | `prevent_multiple_active_sessions` trigger | Clock-in integrity |
| Auto-calculated duration | `calculate_duration` trigger on clock_out | Audit-ready time records |
| PIN security | bcrypt via `pgcrypto` RPCs | Kiosk authentication without passwords |
| Row-Level Security | RLS policies on every table | Tenants see only their own data |

---

## 5. User Flows

### 5.1 Tenant Onboarding

```
Applicant visits /apply
        │
        ▼
Fills out form (company, contact, cuisine type, usage needs)
        │
        ▼
Server Action: submitApplication → inserts into applications table
        │
        ▼
Redirected to /apply/thank-you
        │
        ▼
Admin sees pending application at /admin/applications
        │
        ▼
Admin clicks Approve
        │
        ▼
Server Action: approveApplication
  1. Updates application.status → 'approved'
  2. Calls supabase.auth.admin.inviteUserByEmail()
  3. Supabase sends magic link email
        │
        ▼
Tenant clicks invite link → /account-setup
  1. Sets password
  2. Completes profile (/account-setup/profile)
        │
        ▼
Tenant is active → redirected to /calendar
```

### 5.2 Station Booking

```
Tenant opens /calendar
        │
        ▼
FullCalendar renders week/day view with existing bookings
        │
        ▼
Tenant clicks empty timeslot → booking modal opens
        │
        ▼
Selects station, confirms start/end time
        │
        ▼
Client: Zod validation (15-min intervals, 30 min–12 hr)
        │
        ▼
Server Action: checkAvailability → queries for overlapping bookings
        │
        ▼
Server Action: createBooking → INSERT with exclusion constraint
        │
        ▼
Calendar re-renders with new booking (color-coded by station)
```

### 5.3 Kiosk Clock-In/Out

```
iPad displays /kiosk → shows tenant cards
        │
        ▼
Tenant taps their name
        │
        ▼
PIN pad appears (large, touch-friendly digits)
        │
        ▼
Enters 4-digit PIN → API route verifies via RPC (bcrypt)
        │
        ▼
If no active session → "Clock In" button
If active session → "Clock Out" button with elapsed time
        │
        ▼
API route: creates/updates timesheet record
  - clock_in: NOW()
  - clock_out: NULL (active) or NOW() (closing)
  - duration_minutes: computed by trigger on clock_out
```

### 5.4 Billing Cycle

```
Admin opens /admin/billing
        │
        ▼
Views billing periods per tenant (monthly: YYYY-MM)
        │
        ▼
Period auto-created as 'in_progress' via ensureBillingPeriod
        │
        ▼
At month end, admin reviews timesheets → marks period 'pending'
        │
        ▼
Admin creates invoice at /billing/invoices/new
  - Selects tenant
  - Adds line items (description, qty, unit_price)
  - Tiered pricing: $50/hr (0-20), $40/hr (21-100), $30/hr (100+)
        │
        ▼
Server Action: createInvoice → inserts invoice + invoice_lines
        │
        ▼
Marks billing period 'invoiced'
        │
        ▼
Tenant views invoice at /billing/invoices/[id]
```

---

## 6. Pricing Model

The tiered pricing structure incentivizes higher utilization:

| Tier | Hours | Rate | Max Tier Cost |
|------|-------|------|---------------|
| 1 | 0 – 20 | $50/hr | $1,000 |
| 2 | 21 – 100 | $40/hr | $3,200 |
| 3 | 100+ | $30/hr | Uncapped |

**Examples:**

- 10 hours/month = $500
- 50 hours/month = $1,000 + (30 × $40) = $2,200
- 150 hours/month = $1,000 + $3,200 + (50 × $30) = $5,700

Implemented in `lib/utils/pricing.ts` via `calculateTieredCost()`.

---

## 7. UX Design Principles

### Kiosk-First Touch Interface

The facility operates in a kitchen environment where users have wet or messy hands. All kiosk interactions follow these constraints:

- **Large tap targets** — PIN pad buttons, user cards, and action buttons are sized for imprecise touch input
- **Minimal navigation** — kiosk is a single-screen flow: select user → enter PIN → clock in/out
- **High contrast** — clear visual hierarchy for quick scanning at arm's length
- **No typing** — PIN pad is the only input; no keyboard required

### Dashboard Information Hierarchy

Dashboard pages prioritize scannable data for busy kitchen operators:

- **Calendar view** — color-coded stations, week/day/list toggle, visual density of bookings at a glance
- **Tables** — sortable, filterable, with inline actions (no page navigation for common operations)
- **Status badges** — consistent color coding across the app (pending=yellow, confirmed=green, cancelled=red)
- **Toast notifications** — non-blocking feedback via Sonner for all mutations

### Responsive Breakpoints

| Device | Context | Considerations |
|--------|---------|----------------|
| iPad (kiosk) | Wall-mounted in kitchen | Touch-only, no scroll, large buttons |
| Tablet | Admin on the floor | Dashboard tables, calendar week view |
| Desktop | Office admin work | Full admin panels, invoice creation, reporting |
| Mobile | Tenant on the go | Booking check, timesheet review, basic profile |

---

## 8. Authentication & Security

### Authentication Flow

```
                    ┌─────────────┐
                    │  Invite via  │
                    │ Admin Panel  │
                    └──────┬──────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │ Supabase sends   │
                 │ magic link email  │
                 └────────┬─────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ /account-setup         │
              │ PKCE code exchange     │
              │ → session cookie set   │
              │ → password creation    │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Subsequent logins:     │
              │ /login (email+password)│
              │ → Supabase session     │
              │ → cookie-based auth    │
              └────────────────────────┘
```

### Security Layers

| Layer | Implementation |
|-------|----------------|
| **Transport** | HTTPS (Vercel/hosting enforced) |
| **Session** | Supabase PKCE flow, HTTP-only cookies via `@supabase/ssr` |
| **Route protection** | Next.js middleware — redirects unauthenticated users |
| **Role gating** | Server Action checks `profile.role`; middleware checks admin routes |
| **Row-Level Security** | PostgreSQL RLS — tenants can only read/write their own records |
| **PIN hashing** | bcrypt via Supabase RPCs (`pgcrypto`) — never stored in plaintext |
| **Input validation** | Zod schemas on both client and server |
| **CSRF** | Server Actions use Next.js built-in CSRF protection |

### Supabase Client Hierarchy

| Client | Use Case | Privilege Level |
|--------|----------|-----------------|
| `server.ts` | Server Actions, SSR data fetching | User session (RLS-scoped) |
| `client.ts` | Browser-side reads, auth state | User session (RLS-scoped) |
| `admin.ts` | Invite emails, bypassing RLS | Service role (full access) |
| `middleware.ts` | Session refresh on every request | Anon/user session |

---

## 9. Database Design Decisions

### Why Exclusion Constraints for Bookings

Rather than application-level overlap checking alone, bookings use PostgreSQL `btree_gist` exclusion constraints. This provides atomicity — two concurrent booking requests for the same station/time will be caught at the database level, preventing race conditions that application-level checks cannot guarantee.

### Why Trigger-Based Duration Calculation

Timesheet `duration_minutes` is computed by a database trigger on `clock_out` update rather than calculated client-side. This ensures the duration is always derived from the authoritative `clock_in`/`clock_out` timestamps and cannot be tampered with through the API.

### Why RPCs for PIN Operations

Kiosk PIN hashing and verification run inside Supabase RPCs (PostgreSQL functions) rather than in the Next.js application layer. This keeps the raw PIN out of network requests and application logs — the bcrypt operation happens entirely within the database.

### Billing Period State Machine

```
in_progress ──▶ pending ──▶ invoiced
    │                          │
    └──── (reopen) ◀───────────┘
```

Each tenant has one billing period per month. The state machine prevents invoicing an incomplete period and allows corrections by reopening.

---

## 10. Growth Engine (Satellite System)

The Growth Engine is an autonomous AI marketing agent that operates independently from the core platform. It is located in `/growth-engine/` and consists of:

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend | Python, FastAPI, Celery, Redis | Scheduled task execution, API orchestration |
| Dashboard | React (Vite) | Human-in-the-loop approval interface |
| Modules | SEO, Content, Ads, Outreach, Ops | Five specialized marketing automation modules |

### Module Responsibilities

- **SEO Intelligence** — Pulls GA4 + Search Console data, suggests content based on keyword intent
- **Content Engine** — Drafts social posts and nurture email sequences via LLM
- **Ads Manager** — Monitors ROAS across Meta/Google Ads, proposes bid adjustments
- **Outreach** — Scrapes local food business directories, drafts personalized cold emails
- **Ops Automation** — Monitors booking cancellations and matches waitlisted leads to openings

All destructive actions (spending budget, sending emails) require explicit admin approval through the dashboard.

---

## 11. Deployment Architecture

```
┌──────────────────────────────┐
│         Vercel (Edge)        │
│                              │
│  Next.js 16 App              │
│  - SSR pages                 │
│  - Server Actions            │
│  - API routes                │
│  - Static assets (CDN)       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     Supabase (Managed)       │
│                              │
│  - PostgreSQL (+ RLS)        │
│  - Auth (PKCE, invite flow)  │
│  - Storage (photo uploads)   │
│  - Edge Functions (future)   │
└──────────────────────────────┘

┌──────────────────────────────┐
│  Growth Engine (Separate)    │
│                              │
│  - FastAPI on Render/Fly.io  │
│  - Redis (Celery broker)     │
│  - React dashboard on Vercel │
└──────────────────────────────┘
```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key for AI features |

---

## 12. Future Design Considerations

### Recurring Bookings

The `bookings` table already has an `rrule` column (iCalendar recurrence rule format). Implementation requires:

- UI for recurrence pattern selection (daily, weekly, specific days)
- Server-side expansion of rrules into individual booking instances
- Conflict resolution for series that overlap with existing bookings
- Ability to modify/cancel a single instance or the entire series

### Payment Integration

The invoicing system is built but payments are manual. Stripe integration would connect:

- `invoices.stripe_invoice_id` → Stripe Invoice object
- Webhook handler for `invoice.paid` → auto-update `invoices.status`
- Hosted payment links sent to tenants via email

### Real-Time Features

- **Calendar updates** — Supabase Realtime subscriptions for live booking changes
- **Kiosk status** — Active session count displayed in admin dashboard
- **Notifications** — Push notifications for booking confirmations, invoice generation, maintenance updates

### Analytics Dashboard

- Station utilization heatmaps (peak hours, underused slots)
- Revenue per tenant over time
- Tenant retention and churn metrics
- Maintenance response time tracking
