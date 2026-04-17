/**
 * Update Free Meals on Wheels — Station 3 Saturday bookings
 * from 7am–11am  →  8am–10am   (every Saturday, remainder of 2026)
 *
 * Run with:
 *   PATH=/opt/homebrew/bin:$PATH node node_modules/.bin/tsx scripts/update-fmow-station3.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function pstISO(dateStr: string, hour: number): string {
  // dateStr is YYYY-MM-DD (wall date of the booking).
  // We need to reconstruct with the correct PST/PDT offset.
  const year = parseInt(dateStr.slice(0, 4))

  // DST start: 2nd Sunday in March
  const dstStart = nthSunday(year, 2)   // month index 2 = March
  // DST end:   1st Sunday in November
  const dstEnd   = nthSunday(year, 10)  // month index 10 = November

  const d = new Date(`${dateStr}T12:00:00Z`) // noon UTC — just to get the date right
  const isPDT = d >= dstStart && d < dstEnd
  const offset = isPDT ? '-07:00' : '-08:00'

  const hh = String(hour).padStart(2, '0')
  return `${dateStr}T${hh}:00:00${offset}`
}

function nthSunday(year: number, monthIndex: number): Date {
  // Returns the 1st Sunday of a given month (0-indexed) for the DST end (Nov),
  // or the 2nd Sunday for DST start (Mar).
  const nth = monthIndex === 2 ? 2 : 1  // 2nd for Mar, 1st for Nov
  const d = new Date(year, monthIndex, 1)
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1)
  d.setDate(d.getDate() + (nth - 1) * 7)
  return d
}

async function main() {
  console.log('🔍 Looking up Free Meals on Wheels profile…')
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('id, company_name')
    .eq('company_name', 'Free Meals on Wheels')
    .single()

  if (pErr || !profile) {
    console.error('❌ Tenant not found:', pErr?.message)
    process.exit(1)
  }
  console.log(`  ✅ Found: ${profile.company_name} (${profile.id})`)

  console.log('\n🔍 Looking up Station 3…')
  const { data: station, error: sErr } = await supabase
    .from('stations')
    .select('id, name')
    .eq('name', 'Station 3')
    .single()

  if (sErr || !station) {
    console.error('❌ Station 3 not found:', sErr?.message)
    process.exit(1)
  }
  console.log(`  ✅ Found: ${station.name} (id: ${station.id})`)

  // Fetch all confirmed Sat bookings for this tenant at Station 3
  console.log('\n🔍 Fetching existing Saturday bookings…')
  const today = new Date().toISOString()
  const { data: bookings, error: bErr } = await supabase
    .from('bookings')
    .select('id, start_time, end_time')
    .eq('user_id', profile.id)
    .eq('station_id', station.id)
    .eq('status', 'confirmed')
    .gte('start_time', today)
    .order('start_time')

  if (bErr) {
    console.error('❌ Error fetching bookings:', bErr.message)
    process.exit(1)
  }

  // Filter to Saturdays only (day 6)
  const satBookings = (bookings ?? []).filter(b => {
    const d = new Date(b.start_time)
    return d.getDay() === 6
  })

  console.log(`  Found ${satBookings.length} Saturday bookings to update`)

  if (satBookings.length === 0) {
    console.log('Nothing to do.')
    return
  }

  let updated = 0
  let failed = 0

  for (const b of satBookings) {
    // Extract the wall date (YYYY-MM-DD) from the existing start_time
    const existing = new Date(b.start_time)
    const yyyy = existing.getFullYear()
    const mm   = String(existing.getMonth() + 1).padStart(2, '0')
    const dd   = String(existing.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`

    const newStart = pstISO(dateStr, 8)   // 8am
    const newEnd   = pstISO(dateStr, 10)  // 10am

    const { error } = await supabase
      .from('bookings')
      .update({ start_time: newStart, end_time: newEnd })
      .eq('id', b.id)

    if (error) {
      console.error(`  ❌ Failed to update ${dateStr}:`, error.message)
      failed++
    } else {
      updated++
    }
  }

  console.log(`\n✅ Done — updated: ${updated}, failed: ${failed}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
