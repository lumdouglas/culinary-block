-- Fix RLS policy for Bookings to allow users to view their own bookings (including cancelled ones)
-- This is necessary so that UPDATE operations that change status to 'cancelled' don't violate Postgres's
-- internal check that ensures new rows are visible to the updater if no other SELECT policy matches.

CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
