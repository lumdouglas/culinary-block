-- Add is_active column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Set existing profiles to active (since they are already scrutinized or created)
UPDATE profiles 
SET is_active = true 
WHERE role = 'tenant';

-- Add index for performance on kiosk/booking queries
CREATE INDEX IF NOT EXISTS idx_profiles_role_active 
ON profiles(role, is_active);
