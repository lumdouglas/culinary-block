-- Disable trigger temporarily to test JWT bug
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
