-- Add photo_url to maintenance_tickets table
ALTER TABLE maintenance_tickets ADD COLUMN IF NOT EXISTS photo_url TEXT;
