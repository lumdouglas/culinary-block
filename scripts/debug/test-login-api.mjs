import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase Connection...')
console.log('URL:', supabaseUrl ? 'Present' : 'Missing')
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignIn() {
    console.log('\n--- Attempting Sign In ---')
    console.log('Calling supabase.auth.signInWithPassword...')
    const startTime = Date.now()
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'admin@culinaryblock.com',
            password: 'invalid_password_test' // We just want to see if it responds with an error or hangs
        })
        const duration = Date.now() - startTime
        console.log(`Response received in ${duration}ms`)
        
        if (error) {
            console.log('Received expected error:', error.message)
            return true;
        } else {
            console.log('Unexpected success with invalid password')
            return false;
        }
    } catch (e) {
        console.error('Unhandled exception during sign in:', e)
        return false;
    }
}

testSignIn().then(() => process.exit(0)).catch(() => process.exit(1))
