
-- Add email column to profiles if it's missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing profiles with email from auth.users (requires superuser or bypass RLS)
-- Note: In Supabase, you can usually cross-join auth.users in raw SQL editor but via client requires permissions.
-- We will try to rely on a trigger or just manual backfill via the app logic if needed.

-- Create a trigger to auto-sync email on user creation/update
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop check if exists to avoid error
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Bind trigger
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();
