-- Ensure start_time and end_time are always rounded to 15-minute blocks
-- This prevents "dirty" data that makes the calendar look messy.
ALTER TABLE bookings 
ADD CONSTRAINT check_15_minute_intervals
CHECK (
  EXTRACT(minute FROM start_time)::int % 15 = 0 AND
  EXTRACT(minute FROM end_time)::int % 15 = 0
);