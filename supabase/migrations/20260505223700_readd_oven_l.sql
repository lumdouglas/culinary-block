-- Add "Oven (L)" back to the stations table
INSERT INTO stations (id, name, category) 
VALUES (5, 'Oven (L)', 'Oven')
ON CONFLICT (id) DO UPDATE SET is_active = true, category = 'Oven', name = 'Oven (L)';
