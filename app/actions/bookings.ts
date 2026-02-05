"use server"

import { createClient } from '@/utils/supabase/server';
import type { z } from "zod";
import { bookingSchema } from "@/lib/validations/booking";

type BookingFormValues = z.infer<typeof bookingSchema>;
import { revalidatePath } from 'next/cache';

export async function createBooking(values: BookingFormValues) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "You must be logged in to book." };

  const payload: any = {
    user_id: user.id,
    kitchen_id: values.kitchen_id,
    start_time: values.start_time.toISOString(),
    end_time: values.end_time.toISOString(),
  };

  if ((values as any).rrule) {
    payload.rrule = (values as any).rrule;
  }

  const { error } = await supabase
    .from('bookings')
    .insert([payload]);

  if (error) {
    // 23P01 is the Postgres code for an exclusion constraint violation (overlap)
    if (error.code === '23P01') {
      return { error: "Conflict: This kitchen is already reserved for this time." };
    }
    return { error: error.message };
  }

  revalidatePath('/calendar');
  return { success: true };
}