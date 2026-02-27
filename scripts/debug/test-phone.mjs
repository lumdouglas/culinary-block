import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPhoneColumn() {
    const { data, error } = await supabase
        .from('profiles')
        .select('phone')
        .limit(1)

    if (error) {
        console.error('Error fetching phone column:', error)
    } else {
        console.log('Success! Phone column exists and is queriable.')
    }
}

checkPhoneColumn()
