// Script to update test tenants with role and kiosk PINs
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const testTenants = [
    { company_name: 'Sweet Delights Bakery', kiosk_pin: '1234' },
    { company_name: 'Urban Meals Catering', kiosk_pin: '2345' },
    { company_name: 'Green Juice Co', kiosk_pin: '3456' },
]

async function updateTenants() {
    console.log('🔧 Updating test tenant profiles...\n')

    for (const tenant of testTenants) {
        // First, find the profile
        const { data: profiles, error: findError } = await supabase
            .from('profiles')
            .select('id, company_name')
            .eq('company_name', tenant.company_name)
            .limit(1)

        if (findError || !profiles?.length) {
            console.log(`⚠️ Could not find profile for ${tenant.company_name}`)
            continue
        }

        const profile = profiles[0]

        // Update the profile with role='tenant' and kiosk_pin
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                role: 'tenant',
                kiosk_pin: tenant.kiosk_pin
            })
            .eq('id', profile.id)

        if (updateError) {
            console.log(`❌ Error updating ${tenant.company_name}: ${updateError.message}`)
        } else {
            console.log(`✅ Updated ${tenant.company_name} - role: tenant, PIN: ${tenant.kiosk_pin}`)
        }
    }

    // Verify the updates
    console.log('\n📋 Current tenant profiles:')
    const { data: allTenants } = await supabase
        .from('profiles')
        .select('id, company_name, role, kiosk_pin')
        .eq('role', 'tenant')

    allTenants?.forEach(t => {
        console.log(`  - ${t.company_name} (PIN: ${t.kiosk_pin})`)
    })
}

updateTenants()
