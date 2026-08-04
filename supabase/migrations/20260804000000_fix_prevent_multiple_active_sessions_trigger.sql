-- Fix: prevent_multiple_active_sessions() was blocking ALL new timesheet
-- inserts for a tenant whenever they had any existing open session (clock_out
-- IS NULL), even when the new row being inserted already had its own
-- clock_out set. This meant an admin could not add a complete, historical
-- timesheet entry for a tenant who happened to have an unrelated stale
-- open session (e.g. forgot to clock out via the kiosk on a different day).
--
-- The guard should only fire when the NEW row itself is also an open
-- session — that's the only case that actually risks two simultaneous
-- clock-ins for the same tenant.

CREATE OR REPLACE FUNCTION prevent_multiple_active_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Only guard against creating a second open session. A fully-specified
  -- entry (clock_in and clock_out both set) can never collide with this.
  IF NEW.clock_out IS NULL AND EXISTS (
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
