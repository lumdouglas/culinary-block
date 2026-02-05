"use server"

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function clockOut(timesheetId: string) {
  const supabase = await createClient(); // Await for Next.js 15

  const { error } = await supabase
    .from('timesheets')
    .update({ 
      clock_out: new Date().toISOString() 
    })
    .eq('id', timesheetId);

  if (error) {
    console.error("Clock-out error:", error);
    return { error: "Failed to record clock-out." };
  }

  // Clear caches so Billing and Admin views update immediately
  revalidatePath('/billing');
  revalidatePath('/admin');
  
  return { success: true };
}