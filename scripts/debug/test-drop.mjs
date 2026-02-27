import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { execSync } from 'child_process'

dotenv.config({ path: '.env.local' })
console.log("We need the postgres connection string to run pg async queries reliably if not using Supabase CLI.")
