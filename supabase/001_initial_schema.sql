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
  EXECUTE FUNCTION update_updated_at_column();