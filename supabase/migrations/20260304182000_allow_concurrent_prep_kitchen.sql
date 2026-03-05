-- Drop the existing exclusion constraint that prevents all overlaps
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_overlapping_bookings;

-- Create a function for the trigger to enforce no overlaps ONLY for non-General stations
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
DECLARE
  station_cat TEXT;
  overlap_exists BOOLEAN;
BEGIN
  -- Get the category of the station being booked
  SELECT category INTO station_cat FROM stations WHERE id = NEW.station_id;

  -- If it's not a General station, we require no overlaps
  IF COALESCE(station_cat, '') != 'General' AND NEW.status = 'confirmed' THEN
    SELECT EXISTS (
      SELECT 1 FROM bookings
      WHERE station_id = NEW.station_id
        AND status = 'confirmed'
        AND (TG_OP = 'INSERT' OR id != NEW.id) -- ignore self if updating
        AND start_time < NEW.end_time
        AND end_time > NEW.start_time
    ) INTO overlap_exists;

    IF overlap_exists THEN
      -- Raise exception with 23P01 (exclusion constraint violation) to maintain frontend compatibility
      RAISE EXCEPTION 'This time slot was just booked.' USING ERRCODE = '23P01';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_no_overlapping_bookings ON bookings;
CREATE TRIGGER enforce_no_overlapping_bookings
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION check_booking_overlap();
