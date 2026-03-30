# Culinary Block — Global Logic (Non-Negotiables)

These are the project's core truths. No AI tool should override, replace, or "improve away" any of these decisions. They exist for a reason.

---

## What This Project Is

Culinary Block is a **commercial kitchen rental management platform** for a shared 8,000 sq ft professional kitchen in San Jose, CA. It serves food entrepreneurs, caterers, and bakers. It is NOT a generic SaaS template. Every decision should be grounded in the physical reality of a shared kitchen.

---

## Stack — Do Not Change

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 16, App Router, React 19** | Production. Do not suggest Pages Router. |
| Database | **Supabase (PostgreSQL + RLS)** | Auth, DB, and Storage in one. Do not suggest Firebase, PlanetScale, or Prisma as a replacement. |
| Auth | **Supabase Auth (PKCE flow)** | Invite-only tenant onboarding is built around it. |
| Styling | **Tailwind CSS v4 + Shadcn UI** | No custom CSS. No other component libraries. |
| AI | **Vercel AI SDK v6 + Google Gemini 2.5 Flash** | Catering permit wizard only. Do not swap to OpenAI unless asked. |
| PDF | **pdf-lib (client-side only)** | Cannot run server-side — Turbopack build will fail. Always dynamic import. |
| Language | **TypeScript (strict)** | No `any`. No JavaScript files in app code. |
| Forms | **React Hook Form + Zod** | Schema-first. Export inferred types as `XFormValues`. |
| Dates | **date-fns** | No moment.js, no dayjs, no luxon. |
| Icons | **lucide-react** | No heroicons, no react-icons. |

---

## Architecture Rules

- **All mutations go through Server Actions** in `@/app/actions/` — never direct Supabase client calls from components.
- **Never bypass RLS.** Every new table needs row-level security policies. The service role client (`utils/supabase/admin.ts`) is for admin-only operations (sending invites) only.
- **Supabase client selection:**
  - Server components / actions → `utils/supabase/server.ts`
  - Browser components → `utils/supabase/client.ts`
  - Admin operations (bypasses RLS) → `utils/supabase/admin.ts`
- **Auth check in every Server Action:** Call `supabase.auth.getUser()` first. For admin actions, verify `profile.role === 'admin'`.
- **Revalidate after mutations:** Always call `revalidatePath()` after data changes.
- **Booking integrity is enforced at the DB level** via SQL exclusion constraints (btree_gist). Do not rely solely on UI validation.
- **PIN security:** Kiosk PINs are hashed via Supabase RPC (`set_user_pin`, `verify_kiosk_pin`). Never store raw PINs.

---

## Business Logic (Kitchen-Specific)

- **Tiered pricing:** $50/hr (0–20h), $40/hr (21–100h), $30/hr (100+h). Calculated in `lib/utils/pricing.ts`. Do not change this formula.
- **Booking slots:** 15-minute intervals only. Aligned calendar blocks.
- **Roles:** `tenant` or `admin`. No other roles exist.
- **Invite-only onboarding:** Tenants apply → admin approves → Supabase invite email → account setup. Do not add self-signup.

---

## What Does Not Exist Yet (Don't Assume It Does)

- No Stripe / payment processing
- No recurring bookings UI (schema column exists, no UI)
- No automated email notifications
- No test suite
- No CI/CD
