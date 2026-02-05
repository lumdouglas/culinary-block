import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('timesheets')
    .select('*')
    .eq('user_id', userId)
    .is('clock_out', null)
    .maybeSingle();

  return NextResponse.json({ session: data });
}