import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function testSessionExtraction() {
  const email = `sessionextract-${Date.now()}@example.com`
  console.log('1. Admin invites user...')
  await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  
  console.log('2. Make link (this represents the email the user clicks)...')
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo: 'http://localhost:3000/account-setup' } })
  console.log('Link:', linkData.properties.action_link)

  // This time we won't verify OTP, we'll try verifying what happens when implicit flow tokens are injected
  
  const tokenHashMatch = linkData.properties.action_link.match(/token=([^&]+)/)
  const typeMatch = linkData.properties.action_link.match(/type=([^&]+)/)
  
  if(tokenHashMatch && typeMatch) {
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
     console.log('3. Client verifying OTP manually like our callback route does...')
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.verifyOtp({
      token_hash: tokenHashMatch[1],
      type: typeMatch[1] // 'invite'
    })
    
    if (sessionError) {
      console.error('Session Error:', sessionError)
      return
    }
    
    console.log(`Session established! Access Token starts with: ${sessionData.session.access_token.substring(0, 10)}...`)
    
    console.log('4. Attempting to update user password using this session directly...')
    const { data: updateData, error: updateError } = await supabaseClient.auth.updateUser({ password: 'TestPassword123!' })
    
    if (updateError) {
      console.error('Password Update Error:', updateError)
    } else {
      console.log('Password successfully updated!')
    }
  } else {
      console.log("Could not extract token or type.")
  }

}

testSessionExtraction()
