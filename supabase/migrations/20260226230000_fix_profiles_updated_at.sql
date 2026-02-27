-- Fix: "record new has no field updated_at" error on profiles table
-- The update_profiles_updated_at trigger references NEW.updated_at,
-- but the column is missing from the live profiles table.
-- We drop the trigger (it's not required by the app) to resolve the error.

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
