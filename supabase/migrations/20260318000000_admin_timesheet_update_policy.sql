-- Allow admins to update any tenant's timesheet entry
-- (existing policy only allows users to update their own)
CREATE POLICY "Admins can update timesheets"
  ON timesheets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to insert timesheet entries on behalf of any tenant
CREATE POLICY "Admins can insert timesheets"
  ON timesheets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
