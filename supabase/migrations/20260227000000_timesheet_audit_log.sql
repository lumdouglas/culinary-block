-- Append-only audit log for all timesheet changes.
-- Captures every INSERT, UPDATE, and DELETE on the timesheets table
-- via a database trigger, independent of application code.

CREATE TABLE timesheet_audit_log (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  operation        TEXT        NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  timesheet_id     UUID        NOT NULL,
  user_id          UUID,
  kitchen_id       UUID,
  clock_in         TIMESTAMPTZ,
  clock_out        TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes            TEXT,
  is_edited        BOOLEAN,
  status           TEXT,
  old_data         JSONB,  -- full row snapshot before the change (UPDATE / DELETE)
  new_data         JSONB   -- full row snapshot after the change  (INSERT / UPDATE)
);

-- Only admins can read; nobody can delete or update (append-only).
ALTER TABLE timesheet_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
  ON timesheet_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Trigger function -- runs with SECURITY DEFINER so it can always insert.
CREATE OR REPLACE FUNCTION log_timesheet_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO timesheet_audit_log (
      operation, timesheet_id, user_id, kitchen_id,
      clock_in, clock_out, duration_minutes, notes, is_edited, status,
      new_data
    ) VALUES (
      'INSERT', NEW.id, NEW.user_id, NEW.kitchen_id,
      NEW.clock_in, NEW.clock_out, NEW.duration_minutes, NEW.notes, NEW.is_edited, NEW.status,
      to_jsonb(NEW)
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO timesheet_audit_log (
      operation, timesheet_id, user_id, kitchen_id,
      clock_in, clock_out, duration_minutes, notes, is_edited, status,
      old_data, new_data
    ) VALUES (
      'UPDATE', NEW.id, NEW.user_id, NEW.kitchen_id,
      NEW.clock_in, NEW.clock_out, NEW.duration_minutes, NEW.notes, NEW.is_edited, NEW.status,
      to_jsonb(OLD), to_jsonb(NEW)
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO timesheet_audit_log (
      operation, timesheet_id, user_id, kitchen_id,
      clock_in, clock_out, duration_minutes, notes, is_edited, status,
      old_data
    ) VALUES (
      'DELETE', OLD.id, OLD.user_id, OLD.kitchen_id,
      OLD.clock_in, OLD.clock_out, OLD.duration_minutes, OLD.notes, OLD.is_edited, OLD.status,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER timesheet_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON timesheets
FOR EACH ROW EXECUTE FUNCTION log_timesheet_changes();

-- Index for fast lookups by timesheet or user.
CREATE INDEX idx_timesheet_audit_log_timesheet_id ON timesheet_audit_log (timesheet_id);
CREATE INDEX idx_timesheet_audit_log_user_id      ON timesheet_audit_log (user_id);
CREATE INDEX idx_timesheet_audit_log_changed_at   ON timesheet_audit_log (changed_at DESC);
