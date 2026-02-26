-- Add equipment column to stations
ALTER TABLE stations ADD COLUMN equipment TEXT;

-- Update Hoods to Station 1-4 with equipment lists
UPDATE stations 
SET name = 'Station 1', equipment = 'Stove 4-Burner, Griddles (2)' 
WHERE name = 'Hood1L';

UPDATE stations 
SET name = 'Station 2', equipment = 'Stove 6-Burner, Fryer, Stock Pot Burner' 
WHERE name = 'Hood2L';

UPDATE stations 
SET name = 'Station 3', equipment = 'Stove 4-Burner, Chargrill, Fryer' 
WHERE name = 'Hood1R';

UPDATE stations 
SET name = 'Station 4', equipment = 'Wok (2), Stock Pot Burner (2)' 
WHERE name = 'Hood2R';
