-- Rename "General Kitchen" to "Prep Kitchen"
UPDATE stations
SET name = 'Prep Kitchen'
WHERE name = 'General Kitchen';
