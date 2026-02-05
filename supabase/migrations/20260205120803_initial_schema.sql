-- =====================================================
-- Culinary Block: Initial Database Schema
-- =====================================================
-- This file creates the core tables for the shared-kitchen
-- management system with multi-tenant support.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- Extends auth.users with business information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  kiosk_pin_hash TEXT, -- bcrypt hash of 4-6 digit PIN
  role TEXT DEFAULT 'tenant' CHECK (role IN ('tenant', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- KITCHENS TABLE
-- =====================================================
-- Represents physical kitchen resources available for booking
CREATE TABLE IF NOT EXISTS kitchens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
  color_code TEXT NOT NULL DEFAULT '#3B82F6', -- For calendar UI
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- APPLICATIONS TABLE
-- =====================================================
-- Stores tenant applications before approval
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  phone TEXT,
  business_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT, -- Admin notes
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================
-- Calendar reservations with recurring booking support
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  kitchen_id UUID REFERENCES kitchens(id) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  rrule TEXT, -- iCalendar RRULE for recurring bookings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure end_time is after start_time
  CHECK (end_time > start_time)
);

-- Ensure start_time and end_time are always rounded to 15-minute blocks
-- This prevents "dirty" data that makes the calendar look messy.
ALTER TABLE bookings 
ADD CONSTRAINT check_15_minute_intervals
CHECK (
  EXTRACT(minute FROM start_time)::int % 15 = 0 AND
  EXTRACT(minute FROM end_time)::int % 15 = 0
);

-- =====================================================
-- TIMESHEETS TABLE
-- =====================================================
-- Clock-in/out records for billing and payroll
CREATE TABLE IF NOT EXISTS timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  kitchen_id UUID REFERENCES kitchens(id),
  clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out TIMESTAMPTZ,
  duration_minutes INTEGER, -- Auto-calculated by trigger
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure clock_out is after clock_in if present
  CHECK (clock_out IS NULL OR clock_out > clock_in)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
-- Speed up common queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_kitchen_id ON bookings(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_bookings_time_range ON bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_timesheets_user_id ON timesheets(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_active_session ON timesheets(user_id) WHERE clock_out IS NULL;
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();-- =====================================================
-- Culinary Block: Row Level Security Policies
-- =====================================================
-- Multi-tenant security policies to ensure data isolation

-- =====================================================
-- PROFILES TABLE RLS
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view all profiles (needed for kiosk user selection)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Only authenticated users can insert their profile (typically done by trigger)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- KITCHENS TABLE RLS
-- =====================================================
ALTER TABLE kitchens ENABLE ROW LEVEL SECURITY;

-- Everyone can view kitchens (needed for booking interface)
CREATE POLICY "Kitchens are viewable by everyone"
  ON kitchens
  FOR SELECT
  USING (true);

-- Only admins can manage kitchens
CREATE POLICY "Admins can manage kitchens"
  ON kitchens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- APPLICATIONS TABLE RLS
-- =====================================================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON applications
  FOR SELECT
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Anyone can submit an application (even unauthenticated)
CREATE POLICY "Anyone can submit applications"
  ON applications
  FOR INSERT
  WITH CHECK (true);

-- Only admins can update applications (for status changes)
CREATE POLICY "Admins can update applications"
  ON applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- BOOKINGS TABLE RLS
-- =====================================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Everyone can view all bookings (needed for calendar availability view)
CREATE POLICY "Bookings are viewable by everyone"
  ON bookings
  FOR SELECT
  USING (true);

-- Users can create their own bookings
CREATE POLICY "Users can create own bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings"
  ON bookings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own bookings
CREATE POLICY "Users can delete own bookings"
  ON bookings
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TIMESHEETS TABLE RLS
-- =====================================================
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- Users can view their own timesheets
-- Admins can view all timesheets
CREATE POLICY "Users can view own timesheets"
  ON timesheets
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can create their own timesheet entries (clock-in)
CREATE POLICY "Users can create own timesheets"
  ON timesheets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own timesheets (clock-out)
CREATE POLICY "Users can update own timesheets"
  ON timesheets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Only admins can delete timesheets
CREATE POLICY "Admins can delete timesheets"
  ON timesheets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
-- =====================================================
-- Culinary Block: Constraints, Triggers & Functions
-- =====================================================
-- Advanced database logic for conflict prevention and automation

-- =====================================================
-- BOOKING OVERLAP PREVENTION (GIST Exclusion Constraint)
-- =====================================================
-- Prevents double-booking at the database level using GIST index
-- This catches race conditions that client-side validation cannot handle

ALTER TABLE bookings
ADD CONSTRAINT prevent_booking_overlap
EXCLUDE USING gist (
  kitchen_id WITH =,
  tstzrange(start_time, end_time) WITH &&
);

-- =====================================================
-- TIMESHEET DURATION CALCULATION TRIGGER
-- =====================================================
-- Automatically calculates duration_minutes when clock_out is set

CREATE OR REPLACE FUNCTION calculate_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if clock_out is set
  IF NEW.clock_out IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 60;
  ELSE
    NEW.duration_minutes := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to timesheets
CREATE TRIGGER timesheets_calculate_duration
  BEFORE INSERT OR UPDATE ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION calculate_duration();

-- =====================================================
-- KIOSK PIN VERIFICATION (RPC Function)
-- =====================================================
-- Securely verifies PIN without exposing the hash to the client
-- Uses crypt() from pgcrypto extension for bcrypt verification

CREATE OR REPLACE FUNCTION verify_kiosk_pin(
  input_user_id UUID,
  input_pin TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  -- Get the stored PIN hash
  SELECT kiosk_pin_hash INTO stored_hash
  FROM profiles
  WHERE id = input_user_id;
  
  -- If no hash exists, PIN is not set
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verify the PIN using bcrypt
  -- crypt() will hash input_pin with the salt from stored_hash and compare
  RETURN stored_hash = crypt(input_pin, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Set Kiosk PIN
-- =====================================================
-- Allows users to set/update their kiosk PIN
-- Hashes the PIN with bcrypt before storing

CREATE OR REPLACE FUNCTION set_kiosk_pin(
  input_user_id UUID,
  input_pin TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  pin_hash TEXT;
BEGIN
  -- Validate PIN is 4-6 digits
  IF input_pin !~ '^\d{4,6}$' THEN
    RAISE EXCEPTION 'PIN must be 4-6 digits';
  END IF;
  
  -- Only allow users to set their own PIN
  IF input_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only set your own PIN';
  END IF;
  
  -- Hash the PIN using bcrypt with default cost factor
  pin_hash := crypt(input_pin, gen_salt('bf'));
  
  -- Update the profile
  UPDATE profiles
  SET kiosk_pin_hash = pin_hash
  WHERE id = input_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PREVENT MULTIPLE ACTIVE SESSIONS PER USER
-- =====================================================
-- Ensures a user can only have one active clock-in at a time

CREATE OR REPLACE FUNCTION prevent_multiple_active_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has an active session (no clock_out)
  IF EXISTS (
    SELECT 1 FROM timesheets
    WHERE user_id = NEW.user_id
    AND clock_out IS NULL
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'User already has an active session. Please clock out first.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for new clock-ins
CREATE TRIGGER check_multiple_sessions
  BEFORE INSERT ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION prevent_multiple_active_sessions();
