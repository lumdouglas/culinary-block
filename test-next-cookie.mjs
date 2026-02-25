import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// We are going to generate a real link, pretend to be Next.js, and then manually submit the password update
async function run() {
  const email = `cookie-test-${Date.now()}@example.com`
  console.log(`1. Admin invites user ${email}`)
  
  const adminClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { data: inviteData } = await adminClient.auth.admin.inviteUserByEmail(email)
  const userId = inviteData.user.id
  
  console.log(`2. Generate link`)
  const { data: linkData } = await adminClient.auth.admin.generateLink({ type: 'invite', email })
  const tokenHashMatch = linkData.properties.action_link.match(/token=([^&]+)/)
  const tokenHash = tokenHashMatch[1]
  
  console.log(`3. Simulate Next.js client verifyOtp (like /auth/callback route does)`)
  const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'invite' })
  
  if (sessionError) {
      console.error('Session Error:', sessionError)
      return
  }
  
  console.log(`4. Explicitly passing access token into a custom fetch to hit Gotrue updateUser directly`)
  const updateReq = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: 'TestPassword123!' })
  })
  
  const updateRes = await updateReq.json()
  
  if (!updateReq.ok) {
      console.log('Update Error:', updateRes)
      if (updateRes.msg && updateRes.msg.includes('User from sub claim')) {
          console.log('BUG DETECTED: Gotrue rejects the raw JWT internally!')
      }
  } else {
      console.log('Update Success:', updateRes.id)
  }
  
  console.log('5. Cleanup user')
  await adminClient.auth.admin.deleteUser(userId)
}
run()
