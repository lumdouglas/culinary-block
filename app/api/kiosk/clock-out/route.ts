import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { sessionId } = await req.json();
  const supabase = await createClient();

  const { error } = await supabase
    .from('timesheets')
    .update({ clock_out: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}