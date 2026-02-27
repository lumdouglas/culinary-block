-- Create the requests table for maintenance and rule violation reports
CREATE TABLE IF NOT EXISTS requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('maintenance', 'rule_violation')),
  description TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all requests" ON requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Policy: Authenticated users can insert their own requests
CREATE POLICY "Users can insert own requests" ON requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can update requests (status, priority)
CREATE POLICY "Admins can update requests" ON requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create index for common queries
CREATE INDEX IF NOT EXISTS requests_status_idx ON requests(status);
CREATE INDEX IF NOT EXISTS requests_created_at_idx ON requests(created_at DESC);
