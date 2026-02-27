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
  const email = `jwt-api-${Date.now()}@example.com`
  console.log('1. Admin invites user...')
  await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  
  console.log('2. Make link...')
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ type: 'invite', email })
  const tokenHashMatch = linkData.properties.action_link.match(/token=([^&]+)/)
  const tokenHash = tokenHashMatch[1]

  const supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  console.log('3. Client verifies OTP...')
  await supabaseClient.auth.verifyOtp({ token_hash: tokenHash, type: 'invite' })

  console.log('4. Calling getUser() with the current session token')
  const { data: { session } } = await supabaseClient.auth.getSession()
  
  console.log('Token exists:', session ? 'Yes' : 'No')
  
  if (session) {
    const rawJwt = session.access_token
    const base64Url = rawJwt.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const jwtPayload = JSON.parse(jsonPayload);
    console.log('JWT Sub Claim:', jwtPayload.sub)
    console.log('JWT Role Claim:', jwtPayload.role)
    console.log('JWT exp:', new Date(jwtPayload.exp * 1000).toLocaleString())
  }
}
run()
