/**
 * Timezone utilities — all date/time display in this project uses America/Los_Angeles (PST/PDT).
 *
 * CONVENTION: Timestamps are stored in UTC in the database. Always convert to PST/PDT
 * for display using these helpers. Never use `new Date().toLocaleDateString()` or
 * `date-fns format()` directly on UTC ISO strings — they will use the server's timezone
 * (UTC on Vercel) or the browser's local timezone, not PST.
 */

export const TZ = 'America/Los_Angeles'

/**
 * Format an ISO timestamp string into a readable date/time string in PST/PDT.
 *
 * @example
 * formatPST('2026-03-01T17:00:00Z', { hour: 'numeric', minute: '2-digit', hour12: true })
 * // → "9:00 AM" (PST)
 */
export function formatPST(iso: string, options: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat('en-US', { ...options, timeZone: TZ }).format(new Date(iso))
}

/** "9:00 AM" */
export function formatTimePST(iso: string): string {
    return formatPST(iso, { hour: 'numeric', minute: '2-digit', hour12: true })
}

/** "Mar 1" */
export function formatShortDatePST(iso: string): string {
    return formatPST(iso, { month: 'short', day: 'numeric' })
}

/** "March 2026" */
export function formatMonthYearPST(iso: string): string {
    return formatPST(iso, { month: 'long', year: 'numeric' })
}

/** "Saturday, March 1, 2026" */
export function formatLongDatePST(iso: string): string {
    return formatPST(iso, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

/** "Sat, Mar 1" */
export function formatShortWeekdayDatePST(iso: string): string {
    return formatPST(iso, { weekday: 'short', month: 'short', day: 'numeric' })
}

/** "Mar" */
export function formatMonthAbbrevPST(iso: string): string {
    return formatPST(iso, { month: 'short' })
}

/** "1" (day of month) */
export function formatDayPST(iso: string): string {
    return formatPST(iso, { day: 'numeric' })
}

/** "Sat" */
export function formatWeekdayAbbrevPST(iso: string): string {
    return formatPST(iso, { weekday: 'short' })
}

/** "March 2026" key — use for grouping bookings by month */
export function monthGroupKeyPST(iso: string): string {
    return formatMonthYearPST(iso)
}

/** Duration label from two ISO strings, e.g. "2h 30m" */
export function durationLabel(startIso: string, endIso: string): string {
    const mins = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h > 0 && m > 0) return `${h}h ${m}m`
    if (h > 0) return `${h}h`
    return `${m}m`
}

/**
 * Convert a local date string ("yyyy-MM-dd") and local time string ("HH:mm") from PST/PDT
 * into a UTC ISO string for storage.
 * Use this in booking forms before sending to the server.
 *
 * Note: We interpret the date+time as a wall-clock time in America/Los_Angeles
 * and return the equivalent UTC ISO string.
 */
export function pstLocalToUTC(dateStr: string, timeStr: string): string {
    // We rely on the fact that browsers already handle DST correctly when you
    // construct a Date from a local-timezone string. On the server (Vercel UTC),
    // this would NOT work — call this only from client components.
    return new Date(`${dateStr}T${timeStr}:00`).toISOString()
}

/**
 * Return "yyyy-MM-dd" in PST/PDT from a UTC ISO string.
 * Use as the `value` for <input type="date"> in PST-aware forms.
 */
export function toDateInputPST(iso: string): string {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date(iso));

    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;

    return `${y}-${m}-${d}`;
}

/**
 * Return "HH:mm" in PST/PDT from a UTC ISO string.
 * Use as the `value` for time selects in PST-aware forms.
 */
export function toTimeInputPST(iso: string): string {
    return formatPST(iso, { hour: '2-digit', minute: '2-digit', hour12: false })
}
