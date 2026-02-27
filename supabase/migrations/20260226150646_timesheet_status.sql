-- Add status column to timesheets
ALTER TABLE timesheets ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified'));

-- Update existing completed timesheets to 'verified'
UPDATE timesheets SET status = 'verified' WHERE clock_out IS NOT NULL;
