import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  console.log('1. Disabling on_auth_user_updated trigger in Postgres via RPC (or we can just run a raw query later)...')
  // For safety, let's just make the SQL file so we can run it via db push or test it
}
run()
