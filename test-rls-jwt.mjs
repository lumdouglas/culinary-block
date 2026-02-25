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
  const email = `rls-test-${Date.now()}@example.com`
  console.log('1. Admin invites user...')
  const { data: inviteData } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  const userId = inviteData.user.id
  
  console.log('2. Check if admin can see profile...')
  const { data: profileAdmin } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single()
  console.log('Admin sees:', profileAdmin ? 'Yes' : 'No')
  
  console.log('3. Generating Invite Link')
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ type: 'invite', email })
  const tokenHashMatch = linkData.properties.action_link.match(/token=([^&]+)/)
  
  console.log('4. Authenticating as user...')
  const supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  await supabaseClient.auth.verifyOtp({
    token_hash: tokenHashMatch[1],
    type: 'invite'
  })

  console.log('5. Check if USER can see their own profile...')
  const { data: profileUser, error: profileUserError } = await supabaseClient.from('profiles').select('*').eq('id', userId).single()
  
  if (profileUserError) {
      console.error('USER CANNOT SEE PROFILE:', profileUserError)
  } else {
      console.log('User sees:', profileUser ? 'Yes' : 'No')
  }

}
run()
