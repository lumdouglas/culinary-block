-- Add missing business profile fields to the profiles table
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS business_type text,
    ADD COLUMN IF NOT EXISTS business_description text,
    ADD COLUMN IF NOT EXISTS notification_email text;
