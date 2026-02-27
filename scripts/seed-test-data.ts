// Seed script to create test tenants and bookings
// Run with: npx tsx scripts/seed-test-data.ts

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// Test tenant profiles
const testTenants = [
    {
        email: 'maria@sweetdelights.com',
        password: 'testpass123',
        company_name: 'Sweet Delights Bakery',
        contact_name: 'Maria Rodriguez',
        phone: '408-555-1001',
        business_type: 'Bakery',
    },
    {
        email: 'james@urbanmeals.com',
        password: 'testpass123',
        company_name: 'Urban Meals Catering',
        contact_name: 'James Chen',
        phone: '408-555-1002',
        business_type: 'Catering',
    },
    {
        email: 'sarah@greenjuice.com',
        password: 'testpass123',
        company_name: 'Green Juice Co',
        contact_name: 'Sarah Kim',
        phone: '408-555-1003',
        business_type: 'Juice Bar',
    }
]

// Bookings for week of Feb 8-14, 2026
// Station IDs: 1-4 = Hoods, 5-7 = Ovens, 8 = Prep Kitchen
function getBookingsForTenant(userId: string, tenantIndex: number) {
    const baseDate = '2026-02-'

    switch (tenantIndex) {
        case 0: // Sweet Delights Bakery - Early morning baker, uses ovens
            return [
                // Monday Feb 9 - Morning baking session
                { station_id: 5, user_id: userId, start_time: `${baseDate}09T05:00:00-08:00`, end_time: `${baseDate}09T11:00:00-08:00`, notes: 'Morning bread baking', status: 'confirmed' },
                // Wednesday Feb 11 - Pastry prep
                { station_id: 6, user_id: userId, start_time: `${baseDate}11T04:30:00-08:00`, end_time: `${baseDate}11T10:00:00-08:00`, notes: 'Pastry production', status: 'confirmed' },
                // Friday Feb 13 - Weekend prep baking
                { station_id: 5, user_id: userId, start_time: `${baseDate}13T05:00:00-08:00`, end_time: `${baseDate}13T12:00:00-08:00`, notes: 'Weekend order prep', status: 'confirmed' },
                // Saturday Feb 14 - Valentine's special
                { station_id: 7, user_id: userId, start_time: `${baseDate}14T03:00:00-08:00`, end_time: `${baseDate}14T09:00:00-08:00`, notes: "Valentine's Day special orders", status: 'confirmed' },
            ]

        case 1: // Urban Meals Catering - Uses hoods for cooking, various times
            return [
                // Monday Feb 9 - Lunch prep
                { station_id: 1, user_id: userId, start_time: `${baseDate}09T08:00:00-08:00`, end_time: `${baseDate}09T14:00:00-08:00`, notes: 'Corporate lunch prep', status: 'confirmed' },
                // Tuesday Feb 10 - Event prep
                { station_id: 2, user_id: userId, start_time: `${baseDate}10T10:00:00-08:00`, end_time: `${baseDate}10T16:00:00-08:00`, notes: 'Wedding event prep', status: 'confirmed' },
                // Thursday Feb 12 - Large order
                { station_id: 1, user_id: userId, start_time: `${baseDate}12T07:00:00-08:00`, end_time: `${baseDate}12T15:00:00-08:00`, notes: 'Large corporate event', status: 'confirmed' },
                { station_id: 3, user_id: userId, start_time: `${baseDate}12T07:00:00-08:00`, end_time: `${baseDate}12T15:00:00-08:00`, notes: 'Large corporate event - overflow', status: 'confirmed' },
                // Saturday Feb 14 - Valentine's dinner prep
                { station_id: 2, user_id: userId, start_time: `${baseDate}14T12:00:00-08:00`, end_time: `${baseDate}14T18:00:00-08:00`, notes: "Valentine's dinner service prep", status: 'confirmed' },
            ]

        case 2: // Green Juice Co - Morning juicing sessions, uses general kitchen
            return [
                // Monday Feb 9 - Juice production
                { station_id: 8, user_id: userId, start_time: `${baseDate}09T06:00:00-08:00`, end_time: `${baseDate}09T10:00:00-08:00`, notes: 'Weekly juice batch', status: 'confirmed' },
                // Wednesday Feb 11 - Mid-week production
                { station_id: 8, user_id: userId, start_time: `${baseDate}11T06:00:00-08:00`, end_time: `${baseDate}11T11:00:00-08:00`, notes: 'Fresh juice production', status: 'confirmed' },
                // Friday Feb 13 - Weekend prep
                { station_id: 8, user_id: userId, start_time: `${baseDate}13T07:00:00-08:00`, end_time: `${baseDate}13T12:00:00-08:00`, notes: 'Weekend farmer market prep', status: 'confirmed' },
                // Uses Hood 4 for some cooking
                { station_id: 4, user_id: userId, start_time: `${baseDate}10T14:00:00-08:00`, end_time: `${baseDate}10T17:00:00-08:00`, notes: 'Soup production for cafe', status: 'confirmed' },
            ]

        default:
            return []
    }
}

async function seedTestData() {
    console.log('🌱 Starting test data seed...\n')

    const userIds: string[] = []

    // Create test users and profiles
    for (let i = 0; i < testTenants.length; i++) {
        const tenant = testTenants[i]
        console.log(`Creating user: ${tenant.company_name}...`)

        // Check if user already exists
        const { data: existingUsers } = await supabase
            .from('profiles')
            .select('id')
            .eq('company_name', tenant.company_name)
            .limit(1)

        if (existingUsers && existingUsers.length > 0) {
            console.log(`  ✅ User already exists, using existing ID`)
            userIds.push(existingUsers[0].id)
            continue
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: tenant.email,
            password: tenant.password,
            email_confirm: true,
            user_metadata: {
                full_name: tenant.contact_name
            }
        })

        if (authError) {
            console.error(`  ❌ Error creating user: ${authError.message}`)
            // Try to get existing user
            const { data: { users } } = await supabase.auth.admin.listUsers()
            const existingUser = users.find(u => u.email === tenant.email)
            if (existingUser) {
                console.log(`  Found existing auth user`)
                userIds.push(existingUser.id)
            }
            continue
        }

        const userId = authData.user!.id
        userIds.push(userId)
        console.log(`  ✅ Created auth user: ${userId}`)

        // Create/update profile
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                company_name: tenant.company_name,
                contact_name: tenant.contact_name,
                phone: tenant.phone,
                business_type: tenant.business_type,
                status: 'approved'
            })

        if (profileError) {
            console.error(`  ❌ Error creating profile: ${profileError.message}`)
        } else {
            console.log(`  ✅ Created profile for ${tenant.company_name}`)
        }
    }

    console.log('\n📅 Creating bookings...\n')

    // Create bookings for each tenant
    for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i]
        const tenant = testTenants[i]
        const bookings = getBookingsForTenant(userId, i)

        console.log(`Creating ${bookings.length} bookings for ${tenant.company_name}...`)

        for (const booking of bookings) {
            const { error } = await supabase
                .from('bookings')
                .insert(booking)

            if (error) {
                if (error.message.includes('duplicate') || error.message.includes('overlapping')) {
                    console.log(`  ⏭️ Booking already exists, skipping`)
                } else {
                    console.error(`  ❌ Error: ${error.message}`)
                }
            } else {
                console.log(`  ✅ Created booking: ${booking.notes}`)
            }
        }
    }

    console.log('\n✅ Test data seeding complete!')
    console.log('\nTest accounts created:')
    testTenants.forEach(t => {
        console.log(`  📧 ${t.email} / ${t.password} - ${t.company_name}`)
    })
}

seedTestData().catch(console.error)
