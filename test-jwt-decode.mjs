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
  console.log(`Testing authentication state for ${emailStr}`)
  // Using signInWithOtp as a trick to see if the user exists and we can trigger an email
  // If we shouldn't spam, we can't do this easily. 
}
run()
