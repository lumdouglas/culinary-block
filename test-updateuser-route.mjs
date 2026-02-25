import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  const email = `route-test-${Date.now()}@example.com`
  console.log('1. Admin invites user...')
  const { data: inviteData } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  
  console.log('2. Make link...')
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ type: 'invite', email })
  const tokenHashMatch = linkData.properties.action_link.match(/token=([^&]+)/)
  const tokenHash = tokenHashMatch[1]

  const supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  console.log('3. Client verifies OTP...')
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'invite'
  })

  console.log('4. Check if session has user...')
  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) console.error('getUser() returned null!')
  else console.log('getUser() returned ID:', user.id)

  console.log('5. Try to update user password...')
  const { data: updateData, error: updateError } = await supabaseClient.auth.updateUser({ password: 'TestPassword123!' })
  
  if (updateError) console.error('Error:', updateError)
  else console.log('Success!')
}
run()
