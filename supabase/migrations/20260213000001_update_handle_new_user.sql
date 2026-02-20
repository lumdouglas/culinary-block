-- Update handle_new_user to set is_active = true for approved applications

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
    -- Insert profile using application data AND set is_active = true
    INSERT INTO public.profiles (
      id,
      email,
      company_name,
      business_type,
      business_description, -- Mapped from kitchen_use_description
      role, -- Default is 'tenant'
      is_active
    )
    VALUES (
      NEW.id,
      NEW.email,
      app_record.company_name,
      app_record.business_type,
      app_record.kitchen_use_description,
      'tenant',
      true -- Active by default for approved applications
    );
    
  ELSE
    -- Insert default profile for users without application
    -- Default is_active will be false (from table definition)
    INSERT INTO public.profiles (
      id,
      email,
      company_name,
      role
    )
    VALUES (
      NEW.id,
      NEW.email,
      'New User',
      'tenant'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure search_path is set correctly (security best practice)
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
