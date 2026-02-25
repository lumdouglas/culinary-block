import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  const email = 'dlumsdaine@gmail.com'
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) {
      console.error(error)
      return
  }
  const user = data.users.find(u => u.email === email)
  console.log('User found:', user ? user.id : 'NO')
}
run()
