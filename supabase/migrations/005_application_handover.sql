-- =====================================================
-- APPLICATION HANDOVER AUTOMATION
-- =====================================================
-- Automatically creates a profile when a new user signs up.
-- If an approved application exists for the email, data is copied to the profile.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  app_record RECORD;
BEGIN
  -- Check if there is an APPROVED application for this email
  SELECT * INTO app_record
  FROM public.applications
  WHERE email = NEW.email
  AND status = 'approved'
  ORDER BY submitted_at DESC
  LIMIT 1;

  IF FOUND THEN
    -- Insert profile using application data
    INSERT INTO public.profiles (
      id,
      email,
      company_name,
      business_type,
      business_description,
      role -- Default is 'tenant'
    )
    VALUES (
      NEW.id,
      NEW.email,
      app_record.company_name,
      app_record.business_type,
      app_record.kitchen_use_description, -- Mapping description to business_description
      'tenant'
    );
    
    -- Optional: Update application to indicate it has been converted?
    -- For now, we leave it as 'approved'.
    
  ELSE
    -- Insert default profile for users without application (e.g. manual invites or admins)
    INSERT INTO public.profiles (
      id,
      email,
      company_name,
      role
    )
    VALUES (
      NEW.id,
      NEW.email,
      'New User', -- Placeholder
      'tenant' -- Default role, can be changed by admin later
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
