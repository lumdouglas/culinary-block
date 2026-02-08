-- Migration: Enhanced Application Schema
-- Description: Add comprehensive fields to applications table and phone to profiles
-- Created: 2026-02-05

-- Add phone number to profiles table (for kiosk PIN generation)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Expand applications table with comprehensive business information
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS contact_first_name TEXT,
ADD COLUMN IF NOT EXISTS contact_last_name TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS years_in_operation TEXT,
ADD COLUMN IF NOT EXISTS social_media TEXT,
ADD COLUMN IF NOT EXISTS cuisine_type TEXT,
ADD COLUMN IF NOT EXISTS kitchen_use_description TEXT,
ADD COLUMN IF NOT EXISTS usage_hours TEXT,
ADD COLUMN IF NOT EXISTS equipment_needed TEXT;

-- Drop old business_type column (replaced by more specific fields)
ALTER TABLE applications
DROP COLUMN IF EXISTS business_type;

-- Add index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Update RLS policies if needed (existing policies should still work)
-- Applications table already has proper RLS for tenant access
