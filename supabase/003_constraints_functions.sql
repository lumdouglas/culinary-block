-- =====================================================
-- Culinary Block: Constraints, Triggers & Functions
-- =====================================================
-- Advanced database logic for conflict prevention and automation

-- =====================================================
-- BOOKING OVERLAP PREVENTION (GIST Exclusion Constraint)
-- =====================================================
-- Prevents double-booking at the database level using GIST index
-- This catches race conditions that client-side validation cannot handle

ALTER TABLE bookings
ADD CONSTRAINT prevent_booking_overlap
EXCLUDE USING gist (
  kitchen_id WITH =,
  tstzrange(start_time, end_time) WITH &&
);

-- =====================================================
-- TIMESHEET DURATION CALCULATION TRIGGER
-- =====================================================
-- Automatically calculates duration_minutes when clock_out is set

CREATE OR REPLACE FUNCTION calculate_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if clock_out is set
  IF NEW.clock_out IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 60;
  ELSE
    NEW.duration_minutes := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to timesheets
CREATE TRIGGER timesheets_calculate_duration
  BEFORE INSERT OR UPDATE ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION calculate_duration();

-- =====================================================
-- KIOSK PIN VERIFICATION (RPC Function)
-- =====================================================
-- Securely verifies PIN without exposing the hash to the client
-- Uses crypt() from pgcrypto extension for bcrypt verification

CREATE OR REPLACE FUNCTION verify_kiosk_pin(
  input_user_id UUID,
  input_pin TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  -- Get the stored PIN hash
  SELECT kiosk_pin_hash INTO stored_hash
  FROM profiles
  WHERE id = input_user_id;
  
  -- If no hash exists, PIN is not set
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verify the PIN using bcrypt
  -- crypt() will hash input_pin with the salt from stored_hash and compare
  RETURN stored_hash = crypt(input_pin, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Set Kiosk PIN
-- =====================================================
-- Allows users to set/update their kiosk PIN
-- Hashes the PIN with bcrypt before storing

CREATE OR REPLACE FUNCTION set_kiosk_pin(
  input_user_id UUID,
  input_pin TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  pin_hash TEXT;
BEGIN
  -- Validate PIN is 4-6 digits
  IF input_pin !~ '^\d{4,6}$' THEN
    RAISE EXCEPTION 'PIN must be 4-6 digits';
  END IF;
  
  -- Only allow users to set their own PIN
  IF input_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only set your own PIN';
  END IF;
  
  -- Hash the PIN using bcrypt with default cost factor
  pin_hash := crypt(input_pin, gen_salt('bf'));
  
  -- Update the profile
  UPDATE profiles
  SET kiosk_pin_hash = pin_hash
  WHERE id = input_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PREVENT MULTIPLE ACTIVE SESSIONS PER USER
-- =====================================================
-- Ensures a user can only have one active clock-in at a time

CREATE OR REPLACE FUNCTION prevent_multiple_active_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has an active session (no clock_out)
  IF EXISTS (
    SELECT 1 FROM timesheets
    WHERE user_id = NEW.user_id
    AND clock_out IS NULL
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'User already has an active session. Please clock out first.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for new clock-ins
CREATE TRIGGER check_multiple_sessions
  BEFORE INSERT ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION prevent_multiple_active_sessions();
