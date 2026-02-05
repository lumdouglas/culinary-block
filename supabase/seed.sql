-- =====================================================
-- Seed Data for Culinary Block Testing
-- =====================================================
-- This file creates initial test data for development

-- Insert test kitchens
INSERT INTO kitchens (id, name, description, hourly_rate, color_code, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Commercial Kitchen A', 'Large industrial kitchen with gas ranges', 45.00, '#3B82F6', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Baking Studio', 'Specialized baking kitchen with proof box', 35.00, '#8B5CF6', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Prep Kitchen', 'Smaller prep space with refrigeration', 25.00, '#10B981', true)
ON CONFLICT (id) DO NOTHING;

-- Note: User profiles will be created when they sign up through Supabase Auth
-- For testing, you'll need to:
-- 1. Sign up a test user through the /signup page
-- 2. Use the set_kiosk_pin() function to set their PIN
-- 3. Then they'll appear in the kiosk selection

-- Example of setting a PIN for a user (run this after creating a test user):
-- SELECT set_kiosk_pin('USER_ID_HERE', '1234');
