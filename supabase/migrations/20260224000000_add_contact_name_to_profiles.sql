-- Add contact_name column to profiles table
-- The settings form uses this field but it was never added in migrations
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS contact_name TEXT;
