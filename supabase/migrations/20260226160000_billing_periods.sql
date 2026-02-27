-- =====================================================
-- BILLING PERIODS TABLE
-- =====================================================
-- Tracks the billing status for each tenant per month.
-- Status flow: in_progress -> pending -> invoiced
-- Only admins can change status to 'invoiced'.

CREATE TABLE IF NOT EXISTS billing_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_month TEXT NOT NULL, -- Format: YYYY-MM
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'pending', 'invoiced')),
  updated_by UUID REFERENCES profiles(id), -- admin who last changed the status
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, period_month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_periods_tenant_id ON billing_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_periods_period_month ON billing_periods(period_month);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_billing_periods_updated_at ON billing_periods;
CREATE TRIGGER update_billing_periods_updated_at
  BEFORE UPDATE ON billing_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE billing_periods ENABLE ROW LEVEL SECURITY;

-- Admins: full access
DROP POLICY IF EXISTS "Admins can manage all billing periods" ON billing_periods;
CREATE POLICY "Admins can manage all billing periods"
  ON billing_periods FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Tenants: can only view their own billing periods
DROP POLICY IF EXISTS "Tenants can view own billing periods" ON billing_periods;
CREATE POLICY "Tenants can view own billing periods"
  ON billing_periods FOR SELECT
  TO authenticated
  USING (auth.uid() = tenant_id);
