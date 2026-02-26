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
      role, -- Default is 'tenant'
      is_active,
      phone
    )
    VALUES (
      NEW.id,
      NEW.email,
      app_record.company_name,
      'tenant',
      true, -- Active by default for approved applications
      app_record.phone
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
