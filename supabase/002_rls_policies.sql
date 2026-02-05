-- =====================================================
-- Culinary Block: Row Level Security Policies
-- =====================================================
-- Multi-tenant security policies to ensure data isolation

-- =====================================================
-- PROFILES TABLE RLS
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view all profiles (needed for kiosk user selection)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Only authenticated users can insert their profile (typically done by trigger)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- KITCHENS TABLE RLS
-- =====================================================
ALTER TABLE kitchens ENABLE ROW LEVEL SECURITY;

-- Everyone can view kitchens (needed for booking interface)
CREATE POLICY "Kitchens are viewable by everyone"
  ON kitchens
  FOR SELECT
  USING (true);

-- Only admins can manage kitchens
CREATE POLICY "Admins can manage kitchens"
  ON kitchens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- APPLICATIONS TABLE RLS
-- =====================================================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON applications
  FOR SELECT
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Anyone can submit an application (even unauthenticated)
CREATE POLICY "Anyone can submit applications"
  ON applications
  FOR INSERT
  WITH CHECK (true);

-- Only admins can update applications (for status changes)
CREATE POLICY "Admins can update applications"
  ON applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- BOOKINGS TABLE RLS
-- =====================================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Everyone can view all bookings (needed for calendar availability view)
CREATE POLICY "Bookings are viewable by everyone"
  ON bookings
  FOR SELECT
  USING (true);

-- Users can create their own bookings
CREATE POLICY "Users can create own bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings"
  ON bookings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own bookings
CREATE POLICY "Users can delete own bookings"
  ON bookings
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TIMESHEETS TABLE RLS
-- =====================================================
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- Users can view their own timesheets
-- Admins can view all timesheets
CREATE POLICY "Users can view own timesheets"
  ON timesheets
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can create their own timesheet entries (clock-in)
CREATE POLICY "Users can create own timesheets"
  ON timesheets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own timesheets (clock-out)
CREATE POLICY "Users can update own timesheets"
  ON timesheets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Only admins can delete timesheets
CREATE POLICY "Admins can delete timesheets"
  ON timesheets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
