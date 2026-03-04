# Culinary Block — Claude Code Guide

## Stack
- **Framework:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4
- **Database/Auth:** Supabase
- **AI:** Vercel AI SDK v6 (`ai`, `@ai-sdk/react`, `@ai-sdk/google`), Gemini 2.5 Flash
- **PDF:** `pdf-lib` (AcroForm filling, browser-only)
- **Build:** Turbopack (production)

## Key Constraint: Turbopack + pdf-lib
Turbopack resolves **all** imports (static and dynamic) at build time for server routes.
`pdf-lib` cannot be used in any server-side module — not even with `await import("pdf-lib")`.
**Solution:** Generate PDFs entirely in the browser. See `lib/catering-permit-pdf.ts`.

- `serverExternalPackages` is webpack-only — does NOT work with Turbopack.

## Catering Permit Feature
AI-guided form wizard that fills the Santa Clara DEH "Catering Operations at a Host Facility" PDF.

**Files:**
- `app/apply/catering-permit/page.tsx` — page entry point
- `components/catering-permit/permit-wizard.tsx` — full UI (chat, voice, language selector, PDF download)
- `app/api/catering-permit/chat/route.ts` — Gemini 2.5 Flash streaming chat, `runtime = "edge"`
- `lib/catering-permit.ts` — Zod schemas, `CateringPermitData`, `DEFAULT_PERMIT_DATA`, `mergePermitData`
- `lib/catering-permit-pdf.ts` — **client-only** PDF generation via `fetch("/assets/catering-permit-blank.pdf")`, loading `pdf-lib` from a browser-only CDN script (`https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js`) at runtime. Must be loaded only via **dynamic** `import("@/lib/catering-permit-pdf")` (e.g. in the download button handler), never static import, or Turbopack will try to resolve `pdf-lib` at build time and the Vercel build will fail.
- `public/assets/catering-permit-blank.pdf` — real DEH AcroForm PDF (96 fields, 4 pages)
- `scripts/extract-pdf-fields.mjs` — utility to dump field names from the blank PDF

**How tool calls update the form:**
The AI calls `update_permit_data` tool; `extractPermitUpdatesFromMessages` reads `tool-update_permit_data` parts from message history and merges them into `permitData` state.

**PDF download flow:**
`generatePermitPdf(permitData)` is called directly in the browser (no API route). Returns `Uint8Array`. Wrap as `new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" })` for download.

## Hydration Pattern
Never read browser APIs (`window`, `navigator`, etc.) in component render body.
Use `useState(false)` + `useEffect` to set after mount. See `speechSupported` in `permit-wizard.tsx`.

## URL Paths
- Catering permit: `/apply/catering-permit`
- Chat API: `/api/catering-permit/chat`

## Pending Work
- Stripe payment wall ($100 fee) before PDF download — `permit_purchases` Supabase table needed
