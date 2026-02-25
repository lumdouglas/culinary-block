import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function debugJWT() {
  const email = `testjwt-${Date.now()}@example.com`
  
  console.log(`1. Inviting user ${email}...`)
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email)
  if (inviteError) return console.error('Invite Error:', inviteError)
  const userId = inviteData.user.id
  console.log(`User created in auth.users with ID: ${userId}`)
  
  console.log(`2. Checking if profile was created by trigger...`)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
    
  if (profileError) {
    console.error('Profile Error (Trigger might have failed!):', profileError)
  } else {
    console.log('Profile created successfully:', profileData)
  }
}

debugJWT()
