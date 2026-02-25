import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  const email = 'dlumsdaine@gmail.com'
  
  // We use generateLink to invite the user WITHOUT triggering the Supabase email provider
  const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
        redirectTo: 'https://www.culinaryblock.com/account-setup'
    }
  })
  
  if (error) {
      console.error('Error:', error)
  } else {
      console.log('Action Link:', linkData.properties.action_link)
      
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
      const u = listData.users.find(u => u.email === email)
      console.log('User created:', !!u, u?.id)
  }
}
run()
