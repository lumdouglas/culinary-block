"use server"

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateKioskPin(pin: string) {
  // Fix 1: Ensure we await the createClient call for Next.js 15
  const supabase = await createClient();
  
  // Fix 2: Explicitly get the user to ensure the session is active
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: "You must be logged in to update your PIN." };
  }

  // Fix 3: Call the RPC function we defined in the SQL Editor
  const { error: rpcError } = await supabase.rpc('set_user_pin', {
    input_user_id: user.id,
    new_pin: pin
  });

  if (rpcError) {
    console.error("RPC Error:", rpcError);
    return { error: "Failed to update PIN. Ensure the database function exists." };
  }

  // Fix 4: Clear the cache so the Settings page reflects changes
  revalidatePath('/settings');
  return { success: true };
}