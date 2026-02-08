import { createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { compare } from 'bcrypt-ts';

export async function POST(req: Request) {
  try {
    const { userId, pin } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get the user's PIN hash from their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('kiosk_pin_hash')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }


    if (!profile.kiosk_pin_hash) {
      return NextResponse.json({ error: 'No PIN set for this user. Please contact admin.' }, { status: 400 });
    }

    // Verify the PIN - support both bcrypt hashes and plaintext PINs
    let isValidPin = false;

    if (profile.kiosk_pin_hash.startsWith('$2')) {
      // bcrypt hash format - use secure comparison
      isValidPin = await compare(pin, profile.kiosk_pin_hash);
    } else {
      // Plaintext PIN - direct comparison (legacy format)
      isValidPin = pin === profile.kiosk_pin_hash;
    }

    if (!isValidPin) {
      return NextResponse.json({ error: 'Invalid PIN. Please try again.' }, { status: 401 });
    }

    // PIN is valid - create the timesheet entry
    const { data, error } = await supabase
      .from('timesheets')
      .insert({ user_id: userId, clock_in: new Date().toISOString() })
      .select()
      .single();

    if (error) {
      console.error('Clock-in error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Clock-in exception:', err);
    return NextResponse.json({ error: 'Failed to process clock-in' }, { status: 500 });
  }
}