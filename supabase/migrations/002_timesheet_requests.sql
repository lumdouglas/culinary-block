-- =====================================================
-- TIMESHEET REQUESTS TABLE
-- =====================================================
-- Allows tenants to request edits or new entries for timesheets
-- Status flow: pending -> approved (updates timesheets table) OR rejected

CREATE TABLE IF NOT EXISTS timesheet_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  timesheet_id UUID REFERENCES timesheets(id), -- Nullable: if null, it's a request for a NEW entry
  type TEXT NOT NULL CHECK (type IN ('create', 'update', 'delete')),
  
  -- The requested values
  clock_in TIMESTAMPTZ, 
  clock_out TIMESTAMPTZ,
  
  reason TEXT, -- "Forgot to clock out", etc.
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timesheet_requests_user_id ON timesheet_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_requests_status ON timesheet_requests(status);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_timesheet_requests_updated_at ON timesheet_requests;
CREATE TRIGGER update_timesheet_requests_updated_at
  BEFORE UPDATE ON timesheet_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
