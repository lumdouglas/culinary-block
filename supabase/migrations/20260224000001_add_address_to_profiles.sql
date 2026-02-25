-- Add address column to profiles table for profile setup form
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address TEXT;
