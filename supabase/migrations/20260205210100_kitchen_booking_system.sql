-- Kitchen Booking System Schema
-- Recreates bookings table with proper schema for kitchen reservations

-- Enable required extensions for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create stations table if it doesn't exist
CREATE TABLE IF NOT EXISTS stations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('Hood', 'Oven', 'General')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the 8 kitchen stations
INSERT INTO stations (name, category) VALUES
  ('Hood1R', 'Hood'),
  ('Hood1L', 'Hood'),
  ('Hood2R', 'Hood'),
  ('Hood2L', 'Hood'),
  ('Oven L', 'Oven'),
  ('Oven M', 'Oven'),
  ('Oven R', 'Oven'),
  ('General Kitchen', 'General')
ON CONFLICT (name) DO NOTHING;

-- Drop old bookings table if it exists (it has an incompatible schema)
DROP TABLE IF EXISTS bookings CASCADE;

-- Create new bookings table with kitchen reservation schema
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure end_time is after start_time
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  
  -- Ensure booking duration is between 30 minutes and 12 hours
  CONSTRAINT valid_duration CHECK (
    end_time - start_time >= INTERVAL '30 minutes' AND
    end_time - start_time <= INTERVAL '12 hours'
  )
);

-- Add exclusion constraint to prevent overlapping bookings for the same station
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
  EXCLUDE USING gist (
    station_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status = 'confirmed');

-- Create indexes for efficient queries
CREATE INDEX idx_bookings_station_id ON bookings(station_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_time_range ON bookings(start_time, end_time);

-- Enable RLS
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Stations policies (everyone can view active stations)
DROP POLICY IF EXISTS "Anyone can view active stations" ON stations;
CREATE POLICY "Anyone can view active stations"
ON stations FOR SELECT
TO public
USING (is_active = true);

-- Bookings policies
-- Authenticated users can view all confirmed bookings (for calendar display)
CREATE POLICY "Authenticated users can view confirmed bookings"
ON bookings FOR SELECT
TO authenticated
USING (status = 'confirmed');

-- Users can create their own bookings
CREATE POLICY "Users can create their own bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings (for cancellation)
CREATE POLICY "Users can update their own bookings"
ON bookings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all bookings
CREATE POLICY "Admins can manage all bookings"
ON bookings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
