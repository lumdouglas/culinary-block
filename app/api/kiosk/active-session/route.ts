import { createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ session: null });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('timesheets')
    .select('*')
    .eq('user_id', userId)
    .is('clock_out', null)
    .maybeSingle();

  if (error) {
    console.error('Active session error:', error);
    return NextResponse.json({ session: null });
  }

  return NextResponse.json({ session: data });
}