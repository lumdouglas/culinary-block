// Quick script to verify bookings exist
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verify() {
    console.log('Checking bookings in database...\n')

    const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`*, station:stations(name), profile:profiles(company_name)`)
        .gte('start_time', '2026-02-08')
        .lte('start_time', '2026-02-15')
        .order('start_time')

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log(`Found ${bookings?.length || 0} bookings for Feb 8-14:\n`)

    bookings?.forEach(b => {
        const date = new Date(b.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        const start = new Date(b.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        const end = new Date(b.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        console.log(`${date} ${start}-${end} | Station ${b.station?.name || b.station_id} | ${b.profile?.company_name || 'Unknown'} | ${b.notes}`)
    })
}

verify()
