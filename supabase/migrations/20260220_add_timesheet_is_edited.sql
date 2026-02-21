-- Migration: add `is_edited` column to `timesheets`

ALTER TABLE timesheets
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ DEFAULT NULL;
