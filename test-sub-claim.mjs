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
  const email = `sub-claim-test-${Date.now()}@example.com`
  console.log(`1. Admin invites user ${email}...`)
  const { data: inviteData } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  const userId = inviteData.user.id
  
  console.log(`2. User ID created: ${userId}`)
  
  // Now we simulate the user being deleted while the session is active!
  // This exactly triggers the "User from sub claim in JWT does not exist" error
  
  console.log('3. Generate link to get a valid token...')
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ type: 'invite', email })
  const tokenHashMatch = linkData.properties.action_link.match(/token=([^&]+)/)
  const tokenHash = tokenHashMatch[1]

  const supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  console.log('4. Client gets session...')
  await supabaseClient.auth.verifyOtp({ token_hash: tokenHash, type: 'invite' })

  console.log('5. Admin deletes the user from the database...')
  await supabaseAdmin.auth.admin.deleteUser(userId)
  
  console.log('6. Client attempts to update password using the valid JWT...')
  const { data: updateData, error: updateError } = await supabaseClient.auth.updateUser({ password: 'TestPassword123!' })
  
  if (updateError) {
      console.log('EXPECTED ERROR:', updateError.message)
      if (updateError.message.includes('User from sub claim in JWT does not exist')) {
          console.log('--> REPRODUCED THE BUG!')
      }
  } else {
      console.log('Success! (Unexpected)')
  }
}
run()
