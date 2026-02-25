import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  const emailStr = process.argv[2]
  if (!emailStr) {
      console.log('Provide an email address to lookup!')
      return
  }
  
  // Try signing in using dummy password to see if user exists, usually gives Invalid Login if user exists but pwd wrong.
  const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: emailStr,
      password: "WrongPassword123!"
  })
  
  if (error) {
      console.log('Result for', emailStr, ':', error.message)
  } else {
      console.log('Logged in???')
  }
}
run()
