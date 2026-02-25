import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function testPasswordUpdate() {
  const email = `pwdtest-${Date.now()}@example.com`
  console.log(`1. Creating invite for ${email}...`)
  
  // Create user via admin
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  
  if (inviteError) {
    console.error('Invite error:', inviteError)
    return
  }
  
  const userId = inviteData.user.id
  console.log(`User created. ID: ${userId}`)
  
  // Generate a valid magic link to get the hash
  console.log('2. Generating invite link...')
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'invite',
    email: email
  })
  
  if (linkError) {
    console.error('Link Error:', linkError)
    return
  }
  
  // Parse the token hash from the returned URL to simulate the implicit flow callback
  const tokenHashMatch = linkData.properties.action_link.match(/token=([^&]+)/)
  if (!tokenHashMatch) {
    console.error("Couldn't extract token from link:", linkData.properties.action_link)
    return
  }
  const tokenHash = tokenHashMatch[1]
  
  console.log('3. Exchanging token hash for session (simulating the email click)...')
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'invite'
  })
  
  if (sessionError) {
    console.error('Session Error:', sessionError)
    return
  }
  
  console.log(`Session established for: ${sessionData.user.email}`)
  
  console.log('4. Attempting to update password...')
  const { data: updateData, error: updateError } = await supabaseClient.auth.updateUser({
    password: 'TestPassword123!'
  })
  
  if (updateError) {
    console.error('Password Update Error:', updateError)
  } else {
    console.log('Password successfully updated!')
  }
}

testPasswordUpdate()
