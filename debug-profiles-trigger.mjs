import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function testTrigger() {
  const email = `triggertest-${Date.now()}@example.com`
  
  console.log(`1. Creating user via invite: ${email}`)
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email)
  
  if (inviteError) {
    console.error('Invite Error:', inviteError)
    return
  }
  
  const userId = inviteData.user.id
  console.log(`User created in auth.users: ${userId}`)
  
  // Wait a second for trigger to complete, sometimes it's async in Edge functions
  await new Promise(r => setTimeout(r, 1000))
  
  console.log(`2. Verifying public.profiles record...`)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
    
  if (profileError) {
    console.error('CRITICAL: Profile not found after user creation!', profileError)
  } else {
    console.log('Profile exists:', profile)
  }
}

testTrigger()
