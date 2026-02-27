
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { hash, compare } from 'bcrypt-ts';

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { currentPin, pin } = body;

        if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
            return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
        }

        if (!currentPin || currentPin.length !== 4) {
            return NextResponse.json({ error: 'Current PIN is required' }, { status: 400 });
        }

        // Fetch existing PIN hash to verify current PIN
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('kiosk_pin_hash')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.kiosk_pin_hash) {
            return NextResponse.json({ error: 'Could not verify current PIN' }, { status: 500 });
        }

        const pinMatches = await compare(currentPin, profile.kiosk_pin_hash);
        if (!pinMatches) {
            return NextResponse.json({ error: 'Incorrect current PIN' }, { status: 403 });
        }

        // Hash the new PIN
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
