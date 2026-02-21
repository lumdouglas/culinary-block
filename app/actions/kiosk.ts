"use server"

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getActiveSession(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('timesheets')
    .select('*')
    .eq('user_id', userId)
    .is('clock_out', null)
    .maybeSingle();
  return data;
}

export async function verifyKioskPin(pin: string, userId: string) {
  const supabase = await createClient();

  // Verify PIN using the RPC we set up
  const { data: isValid } = await supabase.rpc('verify_kiosk_pin', {
    input_user_id: userId,
    input_pin: pin
  });

  if (!isValid) {
    throw new Error("Invalid PIN");
  }

  return { success: true };
}


export async function clockIn(userId: string, pin: string) {
  const supabase = await createClient();

  // Verify PIN using the RPC we set up
  const { data: isValid } = await supabase.rpc('verify_kiosk_pin', {
    input_user_id: userId,
    input_pin: pin
  });

  if (!isValid) return { error: "Invalid PIN. Please try again." };

  const { data, error } = await supabase
    .from('timesheets')
    .insert({ user_id: userId, clock_in: new Date().toISOString() })
    .select()
    .single();

  if (error) return { error: "Database error. Could not clock in." };

  revalidatePath('/kiosk');
  return { data };
}

export async function clockOut(sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('timesheets')
    .update({ clock_out: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) return { error: "Could not clock out." };

  revalidatePath('/kiosk');
  return { success: true };
}

export async function updateTimesheet(sessionId: string, newClockIn: string, newClockOut: string | null) {
  const supabase = await createClient();

  const updateData: any = {
    clock_in: new Date(newClockIn).toISOString(),
    is_edited: true
  };

  if (newClockOut) {
    updateData.clock_out = new Date(newClockOut).toISOString();
  }

  const { error } = await supabase
    .from('timesheets')
    .update(updateData)
    .eq('id', sessionId);

  if (error) return { error: "Failed to update timesheet." };

  revalidatePath('/timesheets');
  revalidatePath('/admin/timesheets');
  return { success: true };
}