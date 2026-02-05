import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { userId } = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('timesheets')
    .insert({ user_id: userId, clock_in: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}