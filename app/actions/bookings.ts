"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface Station {
  id: number;
  name: string;
  category: 'Hood' | 'Oven' | 'General';
  is_active: boolean;
  equipment?: string;
}

export interface Booking {
  id: string;
  station_id: number;
  user_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
  // Joined data
  station?: Station;
  profile?: { company_name: string };
}

// Get all active stations
export async function getStations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('stations')
    .select('*')
    .eq('is_active', true)
    .order('id');

  if (error) {
    console.error('Error fetching stations:', error);
    return { error: error.message };
  }

  return { data: data as Station[] };
}

// Get bookings for a date range (for calendar display)
export async function getBookingsForDateRange(startDate: string, endDate: string, stationId?: number) {
  const supabase = await createClient();

  // Get current user ID for client-side "My Bookings" filtering
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id || null;

  // Query bookings that overlap with the date range
  // A booking overlaps if: booking.start_time < endDate AND booking.end_time > startDate
  let query = supabase
    .from('bookings')
    .select(`
      *,
      station:stations(*)
    `)
    .eq('status', 'confirmed')
    .lt('start_time', endDate)
    .gt('end_time', startDate)
    .order('start_time');

  if (stationId) {
    query = query.eq('station_id', stationId);
  }

  const { data: bookings, error } = await query;

  if (error) {
    console.error('Error fetching bookings:', error);
    return { error: error.message, data: [], currentUserId };
  }

  if (!bookings || bookings.length === 0) {
    return { data: [], currentUserId };
  }

  // Get unique user IDs from bookings
  const userIds = [...new Set(bookings.map(b => b.user_id))];

  // Fetch profiles for these users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, company_name')
    .in('id', userIds);

  // Create a lookup map
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Merge profile data into bookings
  const bookingsWithProfiles = bookings.map(booking => ({
    ...booking,
    profile: profileMap.get(booking.user_id) || { company_name: 'Unknown' }
  }));

  return { data: bookingsWithProfiles as Booking[], currentUserId };
}


// Check if a time slot is available
export async function checkAvailability(stationId: number, startTime: string, endTime: string) {
  const supabase = await createClient();

  // Check for overlapping confirmed bookings
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('station_id', stationId)
    .eq('status', 'confirmed')
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (error) {
    console.error('Error checking availability:', error);
    return { error: error.message };
  }

  return { available: data.length === 0 };
}

// Create a new booking
export async function createBooking(
  stationId: number,
  startTime: string,
  endTime: string,
  notes?: string
) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated. Please log in to make a booking." };
  }

  // Verify user has a profile (is an approved tenant)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { error: "You must be an approved tenant to make bookings." };
  }

  // Verify tenant is active
  // @ts-ignore - is_active is now on profile but TS might not pick it up from the single() inference without explicit typing or restart
  if (profile.is_active === false) {
    return { error: "Your account is currently inactive. Please contact the administrator to restore booking privileges." };
  }

  // Rule: Cannot book more than 6 months in advance
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  if (new Date(startTime) > sixMonthsFromNow) {
    return { error: "Bookings cannot be made more than 6 months in advance. To request a booking beyond this window, please contact Culinary Block Management." };
  }

  // Rule: Cannot have two simultaneous confirmed bookings across different stations
  const { data: concurrentBookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (concurrentBookings && concurrentBookings.length > 0) {
    return { error: "You already have a booking during this time. To book multiple stations simultaneously, please contact Culinary Block Management." };
  }

  // Check availability before booking
  const availability = await checkAvailability(stationId, startTime, endTime);
  if (availability.error) {
    return { error: availability.error };
  }
  if (!availability.available) {
    return { error: "This time slot is no longer available. Please select a different time." };
  }

  // Create the booking
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      station_id: stationId,
      user_id: user.id,
      start_time: startTime,
      end_time: endTime,
      notes,
      status: 'confirmed'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    if (error.code === '23P01') { // Exclusion constraint violation
      return { error: "This time slot was just booked. Please try a different time." };
    }
    return { error: "Failed to create booking. Please try again." };
  }

  revalidatePath('/calendar');
  return { data };
}

// Cancel a booking
export async function cancelBooking(bookingId: string) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if booking belongs to user or user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const { data: booking } = await supabase
    .from('bookings')
    .select('user_id')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return { error: "Booking not found" };
  }

  if (booking.user_id !== user.id && profile?.role !== 'admin') {
    return { error: "You can only cancel your own bookings" };
  }

  // Update status to cancelled
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (error) {
    console.error('Error cancelling booking:', error);
    return { error: "Failed to cancel booking" };
  }

  revalidatePath('/calendar');
  revalidatePath('/my-bookings');
  return { success: true };
}

// Update an existing booking
export async function updateBooking(
  bookingId: string,
  stationId: number,
  startTime: string,
  endTime: string,
  notes?: string
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify ownership
  const { data: booking } = await supabase
    .from('bookings')
    .select('user_id')
    .eq('id', bookingId)
    .single();

  if (!booking) return { error: "Booking not found" };
  if (booking.user_id !== user.id) return { error: "You can only edit your own bookings" };

  // Rule: Cannot book more than 6 months in advance
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  if (new Date(startTime) > sixMonthsFromNow) {
    return { error: "Bookings cannot be made more than 6 months in advance. To request a booking beyond this window, please contact Culinary Block Management." };
  }

  // Rule: Cannot have two simultaneous confirmed bookings across different stations
  const { data: concurrentBookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .neq('id', bookingId)   // exclude the booking being edited
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (concurrentBookings && concurrentBookings.length > 0) {
    return { error: "You already have a booking during this time. To book multiple stations simultaneously, please contact Culinary Block Management." };
  }

  // Check availability — exclude the current booking from the overlap check
  const { data: overlapping } = await supabase
    .from('bookings')
    .select('id')
    .eq('station_id', stationId)
    .eq('status', 'confirmed')
    .neq('id', bookingId)
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (overlapping && overlapping.length > 0) {
    return { error: "This time slot conflicts with another booking. Please choose a different time." };
  }

  const { error } = await supabase
    .from('bookings')
    .update({ station_id: stationId, start_time: startTime, end_time: endTime, notes })
    .eq('id', bookingId);

  if (error) return { error: "Failed to update booking. Please try again." };

  revalidatePath('/calendar');
  revalidatePath('/my-bookings');
  return { success: true };
}


// Get user's own bookings
export async function getUserBookings() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      station:stations(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .gte('end_time', new Date().toISOString())
    .order('start_time');

  if (error) {
    console.error('Error fetching user bookings:', error);
    return { error: error.message };
  }

  return { data: data as Booking[] };
}