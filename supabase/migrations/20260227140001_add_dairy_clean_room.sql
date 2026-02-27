-- Insert Dairy Clean Room into stations
INSERT INTO stations (name, category) 
VALUES ('Dairy Clean Room', 'General')
ON CONFLICT (name) DO NOTHING;
