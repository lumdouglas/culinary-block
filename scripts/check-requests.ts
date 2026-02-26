import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('type', 'maintenance')

    if (error) {
        console.error("Error fetching old requests:", error)
        return
    }

    console.log(`Found ${data.length} old maintenance requests in the requests table.`);
    if (data.length > 0) {
        console.log(data);
    }
}

main()
