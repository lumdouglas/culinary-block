-- Application Workflow Enhancements
-- Description: Add columns to track approval workflow and link to created profiles
-- Created: 2026-02-05

-- Add workflow tracking columns to applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

-- Add index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);

-- Add index for email lookups (for finding approved applications during signup)
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);

-- Update RLS policies for applications table

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Users can view their own application" ON applications;
DROP POLICY IF EXISTS "Anyone can insert applications" ON applications;
DROP POLICY IF EXISTS "Admins can update applications" ON applications;

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public application form)
CREATE POLICY "Anyone can insert applications"
ON applications FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Users can view their linked application
CREATE POLICY "Users can view their own application"
ON applications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Admins can update all applications
CREATE POLICY "Admins can update applications"
ON applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Admins can delete applications
CREATE POLICY "Admins can delete applications"
ON applications FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
