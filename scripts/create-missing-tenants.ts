/**
 * Create tenant accounts for:
 *   1. Free Meals on Wheels
 *   2. Loulan
 *
 * Generates placeholder emails and a random password.
 * Run with:
 *   PATH=/opt/homebrew/bin:$PATH node node_modules/.bin/tsx scripts/create-missing-tenants.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TENANTS = [
  {
    company_name: 'Free Meals on Wheels',
    email: 'freemealsonwheels@culinaryblock.com',
    password: 'CulinaryBlock2026!',
  },
  {
    company_name: 'Loulan',
    email: 'loulan@culinaryblock.com',
    password: 'CulinaryBlock2026!',
  },
]

async function main() {
  for (const tenant of TENANTS) {
    console.log(`\n🔍 Checking if "${tenant.company_name}" exists…`)

    const { data: existing } = await supabase
      .from('profiles')
      .select('id, company_name')
      .eq('company_name', tenant.company_name)
      .single()

    if (existing) {
      console.log(`  ✅ Already exists (id: ${existing.id}) — skipping.`)
      continue
    }

    console.log(`  ➕ Creating auth user: ${tenant.email}`)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: tenant.email,
      password: tenant.password,
      email_confirm: true,
    })

    if (authError) {
      console.error(`  ❌ Auth error: ${authError.message}`)
      continue
    }

    const userId = authData.user.id
    console.log(`  ✅ Auth user created: ${userId}`)

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      email: tenant.email,
      role: 'tenant',
      company_name: tenant.company_name,
      is_active: true,
    })

    if (profileError) {
      console.error(`  ❌ Profile error: ${profileError.message}`)
    } else {
      console.log(`  ✅ Profile created for "${tenant.company_name}"`)
      console.log(`     Email:    ${tenant.email}`)
      console.log(`     Password: ${tenant.password}`)
    }
  }

  console.log('\n✅ Done!')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
