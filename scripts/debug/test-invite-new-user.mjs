import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  const email = `tenant-test-${Date.now()}@example.com`
  console.log(`1. Inviting new test user: ${email}`)
  await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ 
      type: 'invite', 
      email, 
      options: { redirectTo: 'http://localhost:3000/account-setup' }
  })
  
  console.log('\n=============================================')
  console.log('NEW INVITE LINK FOR LOCAL TESTING:')
  console.log(linkData.properties.action_link)
  console.log('=============================================\n')
}
run()
