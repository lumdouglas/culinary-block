import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createInvite() {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail('test-invite@example.com', {
    redirectTo: 'http://localhost:3000/account-setup'
  })
  if (error) {
    console.error('Error:', error)
  } else {
    // Generate an invite link for testing
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: 'test-invite@example.com',
      options: {
        redirectTo: 'http://localhost:3000/account-setup'
      }
    })
    
    if (linkError) {
      console.error('Link Error:', linkError)
    } else {
      console.log('Invite Link Generated:', linkData.properties.action_link)
    }
  }
}

createInvite()
