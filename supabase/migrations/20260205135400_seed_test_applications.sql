-- Seed Data: Test Applications
-- Insert test applications only (profiles require auth.users which must be created through Supabase Auth)

INSERT INTO applications (
  email, company_name, phone, address,
  contact_first_name, contact_last_name,
  website, years_in_operation, social_media,
  cuisine_type, kitchen_use_description,
  usage_hours, equipment_needed, status, notes
) VALUES 
  -- Application 1: Artisan Bakery Co (Approved)
  (
    'contact@artisanbakery.com', 
    'Artisan Bakery Co', 
    '4085551234',
    '123 Baker Street, San Jose, CA 95133',
    'Maria', 
    'Garcia',
    'https://artisanbakery.com', 
    '3 years', 
    '@artisanbakery',
    'French pastries and artisan breads',
    'We specialize in traditional French baking techniques including croissants, baguettes, and sourdough breads. Our production requires proper proofing areas and deck ovens for authentic results.',
    'Tuesday-Saturday, 4:00 AM - 12:00 PM. Approximately 40 hours per week.',
    'Deck oven, spiral mixer, proofing cabinet, prep tables, walk-in cooler access',
    'approved',
    'Excellent references. Approved for monthly kitchen rental - Station 1.'
  ),
  
  -- Application 2: Gourmet Catering LLC (Approved)
  (
    'info@gourmetcatering.com', 
    'Gourmet Catering LLC', 
    '4085555678',
    '456 Culinary Avenue, San Jose, CA 95134',
    'James', 
    'Chen',
    'https://gourmetcatering.com', 
    '5 years', 
    '@gourmetcatering, facebook.com/gourmetcatering',
    'Mediterranean and Asian fusion catering',
    'High-end catering service for corporate events and weddings. Need flexible kitchen space for meal prep, plating, and packaging for events ranging from 50-300 guests.',
    'Monday-Friday, 8:00 AM - 6:00 PM, with occasional weekend prep. Average 50 hours per week.',
    'Commercial range, convection oven, food processor, large refrigeration, steam table, chafing dishes',
    'approved',
    'Strong portfolio of past events. Approved for flexible hourly rental.'
  ),
  
  -- Application 3: Taco Street Food Truck (Pending)
  (
    'hello@tacostreet.com', 
    'Taco Street Food Truck', 
    '4085559012',
    '789 Food Court Lane, San Jose, CA 95110',
    'Carlos', 
    'Rodriguez',
    'https://tacostreet.com', 
    '1 year', 
    '@tacostreet',
    'Authentic Mexican street tacos',
    'Mobile food truck specializing in fresh tacos, salsas, and aguas frescas. Need commissary kitchen for daily prep of proteins, salsas, and tortilla storage.',
    'Daily, 6:00 AM - 10:00 AM for morning prep (service 11 AM - 9 PM at various locations).',
    'Flat top griddle, prep tables, refrigeration for marinated meats, salsa station, tortilla warmer',
    'pending',
    NULL
  )
ON CONFLICT DO NOTHING;
