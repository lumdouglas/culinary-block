import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, company_name, role, is_active')
    .eq('role', 'tenant')
    .order('company_name')

  if (error) { console.error(error); process.exit(1) }

  console.log(`Found ${data?.length ?? 0} tenant profiles:\n`)
  for (const p of data ?? []) {
    console.log(`  company_name: "${p.company_name}" | email: ${p.email} | active: ${p.is_active} | id: ${p.id}`)
  }
}

main()
