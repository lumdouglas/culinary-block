import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  const email = `trigger-crash-${Date.now()}@example.com`
  console.log(`1. Admin invites user ${email}`)
  const { data: inviteData, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  console.log('Error:', error)
  console.log('Data:', inviteData)
}
run()
