import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPhoneColumn() {
  const { data, error } = await supabase
    .from('profiles')
    .select('phone')
    .limit(1)
  
  if (error) {
    console.error('Error:', error.message)
  } else {
    console.log('Success! Phone column exists.')
    console.log(data)
  }
}

checkPhoneColumn()
