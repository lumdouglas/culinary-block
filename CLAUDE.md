# Culinary Block — Claude Code Guide

Commercial kitchen rental management platform (San Jose, CA). Shared 8,000 sq ft kitchen for food entrepreneurs, caterers, and bakers.

Full project rules: `.agents/rules/global-logic.md`
Engineering standards: `.agents/rules/engineering.md`
Squad protocol: `.agents/rules/squad-protocol.md`

---

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test:e2e     # Playwright E2E tests
npm run test:e2e:ui  # Playwright with UI mode

supabase db push     # Apply pending migrations
supabase gen types   # Regenerate types/database.ts after schema changes
```

---

## Non-Negotiables (read `.agents/rules/global-logic.md` for full detail)

- **Stack is fixed:** Next.js 16, Supabase, Tailwind v4, Shadcn UI, Gemini 2.5 Flash, pdf-lib
- **`pdf-lib` is client-side only** — dynamic import only, never at top-level. Turbopack will fail.
- **All mutations via Server Actions** in `@/app/actions/` — never direct Supabase calls from components
- **No `any` in TypeScript** — use Zod-inferred types exported as `XFormValues`
- **Every new Supabase table needs RLS policies**
- **`revalidatePath()`** after every mutation

---

## Key File Locations

| What | Where |
|------|-------|
| Server Actions | `app/actions/` |
| Supabase clients | `utils/supabase/` (server / client / admin) |
| UI components | `components/ui/` (Shadcn) |
| DB types | `types/database.ts` |
| Pricing logic | `lib/utils/pricing.ts` |
| Migrations | `supabase/migrations/` |
| Catering permit PDF | `lib/catering-permit-pdf.ts` |
| AI chat route | `app/api/catering-permit/chat/route.ts` |

---

## Before Writing Code

Run the Squad Check (`.agents/rules/squad-protocol.md`):
- **UX:** Does this work on a tablet/kiosk with messy hands?
- **Engineering:** RLS policies updated? Mutation in a Server Action?
- **Logic:** Billing edge cases handled? Double-booking prevented?

---

## What Doesn't Exist Yet

Don't assume these are implemented — they're not:
- Stripe / payment processing
- Recurring bookings UI
- Automated email notifications
- Test suite / CI/CD
