-- Migration: Add tenant profile fields
-- Run this in Supabase SQL Editor

-- Add new columns to profiles table for tenant information
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS notification_email TEXT;

-- Note: The following columns should already exist:
-- company_name, contact_name, phone

-- Grant update permissions for tenants on their own profile
CREATE POLICY IF NOT EXISTS "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
