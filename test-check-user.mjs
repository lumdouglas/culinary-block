import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
  if (usersError) console.error(usersError)
  else {
      console.log('Total Users:', usersData.users.length)
      const last5 = usersData.users.slice(0, 5).map(u => ({ email: u.email, id: u.id, created: u.created_at }))
      console.log('Recent users:', last5)
  }
}
run()
