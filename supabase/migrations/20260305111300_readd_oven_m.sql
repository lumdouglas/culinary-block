-- Add "Oven M" back to the stations table
INSERT INTO stations (id, name, category) 
VALUES (6, 'Oven (M)', 'Oven')
ON CONFLICT (id) DO UPDATE SET is_active = true, category = 'Oven', name = 'Oven (M)';

-- Note: we use id=6 because "Oven M" was previously inserted with id=6 in the initial schema migrations.
-- if it was hard-deleted and not soft-deleted, we might just be inserting it here.
