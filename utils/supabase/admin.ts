import { createClient as createBaseClient } from '@supabase/supabase-js'

// Create an admin client with service role key for server-side operations
// that need elevated privileges (like inserting timesheets)
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    return createBaseClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
