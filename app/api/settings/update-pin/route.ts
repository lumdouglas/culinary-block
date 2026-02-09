
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { hash } from 'bcrypt-ts';

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { pin } = body;

        if (!pin || pin.length < 4 || pin.length > 6) {
            return NextResponse.json({ error: 'PIN must be 4-6 digits' }, { status: 400 });
        }

        // Hash the PIN
        const pinHash = await hash(pin, 10);

        const { error } = await supabase
            .from('profiles')
            .update({ kiosk_pin_hash: pinHash })
            .eq('id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Error updating PIN:', err);
        return NextResponse.json({ error: 'Failed to update PIN' }, { status: 500 });
    }
}
