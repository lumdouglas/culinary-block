/**
 * Seed Recurring Bookings for 2026
 *
 * 1. Free Meals on Wheels — Station 3 & 4, 7am–11am, every Saturday
 *    from today through Dec 31 2026.
 *
 * 2. Loulan — Station 4, 7am–3pm, every Mon–Fri
 *    from today through Dec 31 2026.
 *
 * Run with:
 *   npx tsx scripts/seed-recurring-bookings-2026.ts
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY so app-level guard rails (6-month limit,
 * concurrent-station check) are bypassed. DB constraints still apply.
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── helpers ──────────────────────────────────────────────────────────────────

/** Return every date between start and end (inclusive) that satisfies dayOfWeek[]. */
function dateRange(
  start: Date,
  end: Date,
  daysOfWeek: number[] // 0=Sun … 6=Sat
): Date[] {
  const dates: Date[] = []
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  while (cur <= end) {
    if (daysOfWeek.includes(cur.getDay())) {
      dates.push(new Date(cur))
    }
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

/** Build an ISO 8601 string in America/Los_Angeles without relying on Intl time-zone offset math. */
function pstISO(date: Date, hour: number, minute = 0): string {
  // Determine if this date is in PDT (second Sun Mar → first Sun Nov)
  const year = date.getFullYear()

  // DST starts: 2nd Sunday in March
  const dstStart = nthSundayOf(year, 2, 1) // month=2 (March, 0-indexed), 2nd Sunday
  // DST ends: 1st Sunday in November
  const dstEnd = nthSundayOf(year, 10, 0) // month=10 (November, 0-indexed), 1st Sunday

  const isPDT = date >= dstStart && date < dstEnd

  const offset = isPDT ? '-07:00' : '-08:00'

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(hour).padStart(2, '0')
  const mi = String(minute).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00${offset}`
}

/** Return the Nth (0-indexed) weekday (0=Sun) of a given month (0-indexed) / year. */
function nthSundayOf(year: number, month: number, nthIndex: number): Date {
  // nthIndex: 0 = 1st, 1 = 2nd …
  const d = new Date(year, month, 1)
  // advance to first Sunday
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1)
  d.setDate(d.getDate() + nthIndex * 7)
  return d
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Fetching stations…')
  const { data: stations, error: stErr } = await supabase
    .from('stations')
    .select('id, name')
    .in('name', ['Station 3', 'Station 4'])

  if (stErr || !stations?.length) {
    console.error('❌ Could not fetch stations:', stErr?.message)
    process.exit(1)
  }

  const stationMap: Record<string, number> = {}
  for (const s of stations) stationMap[s.name] = s.id
  console.log('  Stations found:', stationMap)

  const station3 = stationMap['Station 3']
  const station4 = stationMap['Station 4']

  if (!station3 || !station4) {
    console.error('❌ Station 3 or Station 4 not found in DB')
    process.exit(1)
  }

  console.log('\n🔍 Fetching tenant profiles…')
  const { data: profiles, error: prErr } = await supabase
    .from('profiles')
    .select('id, company_name')
    .in('company_name', ['Free Meals on Wheels', 'Loulan'])

  if (prErr) {
    console.error('❌ Could not fetch profiles:', prErr.message)
    process.exit(1)
  }

  const profileMap: Record<string, string> = {}
  for (const p of profiles ?? []) profileMap[p.company_name] = p.id

  const freeMealsId = profileMap['Free Meals on Wheels']
  const loulanId = profileMap['Loulan']

  if (!freeMealsId) {
    console.error('❌ Tenant "Free Meals on Wheels" not found in profiles table.')
    process.exit(1)
  }
  if (!loulanId) {
    console.error('❌ Tenant "Loulan" not found in profiles table.')
    process.exit(1)
  }

  console.log(`  Free Meals on Wheels → ${freeMealsId}`)
  console.log(`  Loulan               → ${loulanId}`)

  // Current date in LA time (approximate — just use today's wall date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endOf2026 = new Date(2026, 11, 31) // Dec 31 2026

  // ── 1. Free Meals on Wheels — Station 3 & 4, 7am–11am, every Saturday ────
  console.log('\n📅 Generating Saturdays for Free Meals on Wheels…')
  const saturdays = dateRange(today, endOf2026, [6]) // 6 = Saturday

  const freeMealsBookings = saturdays.flatMap((date) => [
    {
      station_id: station3,
      user_id: freeMealsId,
      start_time: pstISO(date, 7),
      end_time: pstISO(date, 11),
      notes: 'Recurring — Free Meals on Wheels',
      status: 'confirmed',
    },
    {
      station_id: station4,
      user_id: freeMealsId,
      start_time: pstISO(date, 7),
      end_time: pstISO(date, 11),
      notes: 'Recurring — Free Meals on Wheels',
      status: 'confirmed',
    },
  ])

  console.log(
    `  → ${saturdays.length} Saturdays × 2 stations = ${freeMealsBookings.length} bookings`
  )

  // ── 2. Loulan — Station 4, 7am–3pm, Mon–Fri ───────────────────────────────
  console.log('\n📅 Generating weekdays for Loulan…')
  const weekdays = dateRange(today, endOf2026, [1, 2, 3, 4, 5]) // Mon–Fri

  const loulanBookings = weekdays.map((date) => ({
    station_id: station4,
    user_id: loulanId,
    start_time: pstISO(date, 7),
    end_time: pstISO(date, 15),
    notes: 'Recurring — Loulan',
    status: 'confirmed',
  }))

  console.log(`  → ${weekdays.length} weekdays = ${loulanBookings.length} bookings`)

  // ── Insert in batches of 100 ──────────────────────────────────────────────

  async function insertBatches(
    label: string,
    rows: object[]
  ): Promise<void> {
    const BATCH = 100
    let inserted = 0
    let skipped = 0
    let failed = 0

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH)
      const { data, error } = await supabase
        .from('bookings')
        .insert(batch)
        .select('id')

      if (error) {
        // Exclusion constraint = overlap already exists, skip gracefully
        if (
          error.code === '23P01' ||
          error.message.toLowerCase().includes('overlap') ||
          error.message.toLowerCase().includes('duplicate') ||
          error.message.toLowerCase().includes('conflict') ||
          error.message.toLowerCase().includes('exclusion')
        ) {
          console.log(
            `  [${label}] batch ${Math.floor(i / BATCH) + 1}: ⏭️  overlap/duplicate — inserting one-by-one to skip conflicts`
          )
          // Re-try row by row to skip individual conflicts
          for (const row of batch) {
            const { error: rowErr } = await supabase
              .from('bookings')
              .insert(row)
            if (rowErr) {
              if (
                rowErr.code === '23P01' ||
                rowErr.message.toLowerCase().includes('overlap') ||
                rowErr.message.toLowerCase().includes('duplicate') ||
                rowErr.message.toLowerCase().includes('exclusion')
              ) {
                skipped++
              } else {
                console.error(`  [${label}] row error:`, rowErr.message)
                failed++
              }
            } else {
              inserted++
            }
          }
        } else {
          console.error(`  [${label}] batch error:`, error.message)
          failed += batch.length
        }
      } else {
        inserted += data?.length ?? batch.length
      }
    }

    console.log(
      `  [${label}] Done — inserted: ${inserted}, skipped (existing): ${skipped}, failed: ${failed}`
    )
  }

  console.log('\n🚀 Inserting bookings…')

  await insertBatches('Free Meals on Wheels', freeMealsBookings)
  await insertBatches('Loulan', loulanBookings)

  console.log('\n✅ All done!')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
