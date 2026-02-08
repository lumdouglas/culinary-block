
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdminUser() {
    const email = `admin-test-${Date.now()}@culinaryblock.com`;
    const password = 'TestAdminPassword123!';
    const companyName = 'Culinary Block Admin';

    console.log(`Creating admin user: ${email}`);

    // 1. Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authError) {
        console.error('Error creating auth user:', authError);
        return;
    }

    const userId = authData.user.id;
    console.log(`User created with ID: ${userId}`);

    // 2. Update profile with admin role
    // Note: formatting of company_name etc might be handled by triggers, but we force update role here
    // The 'profiles' trigger might have already inserted a row, so we use upsert or update.
    // Let's first check if profile exists, or just upsert.

    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            role: 'admin',
            company_name: companyName
        })
        .eq('id', userId);

    if (profileError) {
        // If update failed, maybe row doesn't exist yet (race condition with trigger?), try insert
        console.log('Update failed, trying upsert...', profileError);
        const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                role: 'admin',
                company_name: companyName
            });

        if (upsertError) {
            console.error('Error setting admin role:', upsertError);
            return;
        }
    }

    console.log('Successfully created admin user!');
    console.log('---------------------------------------------------');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('---------------------------------------------------');
}

createAdminUser();
