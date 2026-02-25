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
  const email = `trigger-crash-${Date.now()}@example.com`
  console.log(`1. Admin invites user ${email}`)
  const { data: inviteData } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  const userId = inviteData.user.id
  
  // NOTE: If we DELETE the public.profiles record manually right now...
  console.log('2. Manually deleting public.profiles record to simulate a missing row...')
  await supabaseAdmin.from('profiles').delete().eq('id', userId)

  console.log('3. Authenticate to get a valid JWT')
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ type: 'invite', email })
  const tokenHashMatch = linkData.properties.action_link.match(/token=([^&]+)/)
  const supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  await supabaseClient.auth.verifyOtp({ token_hash: tokenHashMatch[1], type: 'invite' })

  console.log('4. Calling updateUser(password) on a user with NO corresponding public profile...')
  const { data: updateData, error: updateError } = await supabaseClient.auth.updateUser({ password: 'TestPassword123!' })
  
  if (updateError) {
      console.log('ERROR MESSAGE:', updateError.message)
      if (updateError.message.includes('User from sub claim in JWT does not exist')) {
          console.log('--> Confirmed! The error happens if the underlying profile row is missing when the auth trigger fires.')
      }
  } else {
      console.log('Success? (Should not happen if triggers expect a row)')
  }
}
run()
