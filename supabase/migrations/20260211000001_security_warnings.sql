-- Remediation of security warnings reported by Supabase Security Advisor
-- 1. Fix Mutable Search Paths on Functions
-- 2. Fix Overly Permissive RLS on public.applications

-- 1. Fix Mutable Search Paths
-- Explicitly set search_path to public, pg_temp for security

DO $$
BEGIN
    -- Fix calculate_duration if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_duration') THEN
        ALTER FUNCTION public.calculate_duration() SET search_path = public, pg_temp;
    END IF;

    -- Fix verify_kiosk_pin if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_kiosk_pin') THEN
        ALTER FUNCTION public.verify_kiosk_pin(UUID, TEXT) SET search_path = public, pg_temp;
    END IF;

    -- Fix set_kiosk_pin if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_kiosk_pin') THEN
        ALTER FUNCTION public.set_kiosk_pin(UUID, TEXT) SET search_path = public, pg_temp;
    END IF;

    -- Fix update_updated_at_column if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
    END IF;

    -- Fix prevent_multiple_active_sessions if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'prevent_multiple_active_sessions') THEN
        ALTER FUNCTION public.prevent_multiple_active_sessions() SET search_path = public, pg_temp;
    END IF;

    -- Attempt to fix calculate_shift_duration if it exists (mentioned in alerts)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_shift_duration') THEN
        ALTER FUNCTION public.calculate_shift_duration() SET search_path = public, pg_temp;
    END IF;

    -- Attempt to fix fn_calculate_shift_duration if it exists (mentioned in alerts)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_calculate_shift_duration') THEN
        ALTER FUNCTION public.fn_calculate_shift_duration() SET search_path = public, pg_temp;
    END IF;
    
    -- Attempt to fix set_user_pin if it exists (mentioned in alerts)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_user_pin') THEN
         -- Assuming signature based on name, but catching strict if overloaded
         -- We'll try generic alter without args if possible, but PG requires args if overloaded.
         -- Given we don't know the exact signature of the missing one, we'll skip blindly altering it
         -- to avoid errors, unless we find it in pg_proc.
         NULL; 
    END IF;
END $$;


-- 2. Fix Overly Permissive RLS on public.applications
-- Original policy: "Anyone can submit applications" WITH CHECK (true)
-- New policy: Explicitly TO public, and checks that status is 'pending' (default) to ensure no one inserts approved apps directly.

DO $$
BEGIN
    -- Drop the old policy if it exists
    DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;
    
    -- Recreate with stricter checks
    CREATE POLICY "Anyone can submit applications"
    ON public.applications
    FOR INSERT
    TO public
    WITH CHECK (status = 'pending');
END $$;
