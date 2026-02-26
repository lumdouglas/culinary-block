import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    const { data, error } = await supabase
        .from('maintenance_tickets')
        .select('*')
        .limit(1)

    if (error) {
        console.error("Error fetching tickets:", error)
        return
    }

    console.log("Ticket data:", data[0] ? Object.keys(data[0]) : "No tickets but works")
}

main()
