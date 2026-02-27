-- Add extended profile fields for tenant business information
-- These columns are used by the Settings page (app/(dashboard)/settings/page.tsx)

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS notification_email TEXT;
