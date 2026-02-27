---
description: Timezone convention — all timestamps in PST/PDT (America/Los_Angeles)
---

# Timezone Convention

All timestamps in this project are **stored in UTC** in the database (Supabase default).
All **display** must convert to **America/Los_Angeles (PST/PDT)**.

## Rule

> Never use `date-fns format()`, `toLocaleDateString()`, or `new Date().toString()` directly
> on a UTC ISO string. The server (Vercel) runs in UTC and the result will be wrong.

## Use the shared utility

```ts
import { formatTimePST, formatLongDatePST, durationLabel, monthGroupKeyPST } from '@/utils/timezone'
```

Available helpers in `/utils/timezone.ts`:

| Function | Returns | Example |
|---|---|---|
| `formatTimePST(iso)` | `"9:00 AM"` | Time only |
| `formatShortDatePST(iso)` | `"Mar 1"` | Short date |
| `formatLongDatePST(iso)` | `"Saturday, March 1, 2026"` | Full date |
| `formatMonthYearPST(iso)` | `"March 2026"` | Month + year |
| `formatMonthAbbrevPST(iso)` | `"Mar"` | Month abbreviation |
| `formatDayPST(iso)` | `"1"` | Day number |
| `formatWeekdayAbbrevPST(iso)` | `"Sat"` | Short weekday |
| `monthGroupKeyPST(iso)` | `"March 2026"` | Group key for month sections |
| `durationLabel(startIso, endIso)` | `"2h 30m"` | Human duration |
| `toDateInputPST(iso)` | `"2026-03-01"` | For `<input type="date">` |
| `toTimeInputPST(iso)` | `"09:00"` | For time select values |

## Booking form inputs

When building date/time inputs:
- Use `toDateInputPST(iso)` to pre-fill a date input from a UTC ISO booking time
- Use `toTimeInputPST(iso)` to pre-fill a time selector
- On submit, construct ISO with `new Date(\`\${dateStr}T\${timeStr}:00\`).toISOString()` — this is safe from client components since the browser knows the local timezone

## FullCalendar

FullCalendar respects the browser's timezone by default. Set `timeZone='America/Los_Angeles'` in the `<FullCalendar>` component to force PST/PDT for server-rendered contexts.
