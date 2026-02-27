import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
// Use service role to bypass RLS and quickly create/delete the user for a test
const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  const email = `dlumsdaine-test-${Date.now()}@gmail.com`
  console.log(`1. Admin invites user ${email}`)
  const { data: inviteData } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  const userId = inviteData.user.id
  
  console.log(`2. User created: ${userId}`)
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ type: 'invite', email })
  const tokenHashMatch = linkData.properties.action_link.match(/token=([^&]+)/)
  const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  console.log('3. Client verifying OTP...')
  await supabaseClient.auth.verifyOtp({ token_hash: tokenHashMatch[1], type: 'invite' })

  console.log('4. Checking if we have a valid session...')
  const { data: { session } } = await supabaseClient.auth.getSession()
  
  if (session) {
      console.log('5. Updating user password...')
      const { data: updateData, error: updateError } = await supabaseClient.auth.updateUser({ password: 'TestPassword123!' })
      if (updateError) console.error('Error:', updateError.message)
      else console.log('Password Update Success!')
  }

  console.log('6. Cleanup (deleting user)...')
  await supabaseAdmin.auth.admin.deleteUser(userId)
}
run()
