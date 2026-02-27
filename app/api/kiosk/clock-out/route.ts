import { createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { compare } from 'bcrypt-ts';
import { appendTimesheetLog } from '@/utils/timesheet-log';

export async function POST(req: Request) {
  try {
    const { sessionId, userId, pin, companyName } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

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

    // PIN is valid - update the timesheet
    const { error } = await supabase
      .from('timesheets')
      .update({ clock_out: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      console.error('Clock-out error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    appendTimesheetLog({ op: 'clock_out', timesheetId: sessionId, userId, companyName, clockOut: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Clock-out exception:', err);
    return NextResponse.json({ error: 'Failed to process clock-out' }, { status: 500 });
  }
}