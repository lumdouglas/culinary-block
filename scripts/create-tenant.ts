
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { hash } from 'bcrypt-ts';

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

async function createTenantUser() {
    const timestamp = Date.now();
    const email = `tenant-test-${timestamp}@culinaryblock.com`;
    const password = 'TestTenantPassword123!';
    const companyName = `Test Tenant Kitchen ${timestamp}`;
    const pin = '1234';

    console.log(`Creating tenant user: ${email}`);

    // Hash the PIN
    const pinHash = await hash(pin, 10);

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

    // 2. Upsert profile with tenant role and PIN
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email: email,
            role: 'tenant',
            company_name: companyName,
            kiosk_pin_hash: pinHash
        });

    if (profileError) {
        console.error('Error creating profile:', profileError);
        return;
    }

    console.log('Successfully created tenant user!');
    console.log('---------------------------------------------------');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`PIN:      ${pin}`);
    console.log(`Company:  ${companyName}`);
    console.log('---------------------------------------------------');
}

createTenantUser();
