# Culinary Block — Engineering Standards

---

## TypeScript

- **No `any`.** Use proper types or Zod-inferred types.
- Export Zod-inferred types as `XFormValues` (e.g., `BookingFormValues`, `PermitFormValues`).
- Types for DB entities live in `types/database.ts`.
- Path alias: `@/` maps to project root.

---

## Server Actions

All data mutations go through Server Actions in `@/app/actions/`. Never call Supabase directly from a client component.

```ts
// Pattern for every server action
export async function doSomething(data: SomeFormValues) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // For admin actions only:
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Forbidden' }

  const { error } = await supabase.from('table').insert(...)
  if (error) return { error: error.message }

  revalidatePath('/relevant-path')
  return { success: true }
}
```

---

## Database & Migrations

- Migration files go in `supabase/migrations/` with timestamp prefix: `YYYYMMDDHHMMSS_description.sql`.
- Every new table needs RLS enabled + policies for tenant isolation.
- Add `updated_at` trigger to any table that needs it.
- Booking overlap prevention uses `btree_gist` exclusion constraints — do not remove this.

---

## PDF Generation (Critical Constraint)

`pdf-lib` **cannot run server-side** — Turbopack will fail the build.

```ts
// Always dynamic import, always client-side only
const { PDFDocument } = await import('pdf-lib')
```

Never use `import { PDFDocument } from 'pdf-lib'` at the top of a file that could be imported server-side.

---

## Auth Patterns

- Use `utils/supabase/server.ts` (async) in server components and actions.
- Use `utils/supabase/client.ts` in `'use client'` components.
- Auth callback handles both PKCE (`?code=`) and implicit (`#access_token=`) flows — don't simplify it.
- `NEXT_PUBLIC_SITE_URL` must exactly match the redirect URL configured in Supabase dashboard.

---

## UI Components

- Use Shadcn UI components from `components/ui/` only.
- No custom CSS. Tailwind utility classes only.
- Icons: `lucide-react` only.
- Toasts: `sonner` only.
- Dates: `date-fns` only.

---

## Forms

- React Hook Form + Zod for all forms.
- Use `Controller` for Shadcn Select/Checkbox components.
- Date inputs: use helpers for `datetime-local` format — don't manually format ISO strings.

---

## Testing & Quality

- Add `data-testid` attributes to all interactive elements.
- Kiosk/tablet pages: buttons must be large enough for touch (min 44px hit target).
- No `console.log` in production code paths.
