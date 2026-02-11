-- =====================================================
-- MAINTENANCE SYSTEM SCHEMA
-- =====================================================
-- Simple ticketing system linked to kitchens

-- =====================================================
-- MAINTENANCE TICKETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id UUID REFERENCES kitchens(id), -- Optional: could be general facility issue
  user_id UUID NOT NULL REFERENCES profiles(id), -- Reporter
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES profiles(id), -- Admin/Staff handling the ticket
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_kitchen_id ON maintenance_tickets(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_user_id ON maintenance_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_tickets(status);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_maintenance_tickets_updated_at ON maintenance_tickets;
CREATE TRIGGER update_maintenance_tickets_updated_at
  BEFORE UPDATE ON maintenance_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;

-- ADMINS: Full access
DROP POLICY IF EXISTS "Admins can manage all tickets" ON maintenance_tickets;
CREATE POLICY "Admins can manage all tickets"
  ON maintenance_tickets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- USERS: Can create tickets
DROP POLICY IF EXISTS "Users can create tickets" ON maintenance_tickets;
CREATE POLICY "Users can create tickets"
  ON maintenance_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- USERS: Can view tickets they created OR tickets for kitchens they have booked (complex, so let's stick to simple visibility first)
-- For now, let's allow users to see tickets they created AND all tickets for kitchens (so they know if equipment is broken)
DROP POLICY IF EXISTS "Users can view relevant tickets" ON maintenance_tickets;
CREATE POLICY "Users can view relevant tickets"
  ON maintenance_tickets FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id -- Their own tickets
    OR
    kitchen_id IS NOT NULL -- Public kitchen issues (transparency)
  );

-- USERS: Can update their own tickets (e.g. to add more info or close it)
DROP POLICY IF EXISTS "Users can update own tickets" ON maintenance_tickets;
CREATE POLICY "Users can update own tickets"
  ON maintenance_tickets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
