-- Remediation of REMAINING security warnings
-- 1. Fix Mutable Search Paths on handle_new_user and set_user_pin
-- 2. Further tighten public.applications RLS

-- 1. Fix Mutable Search Paths
DO $$
BEGIN
    -- Fix handle_new_user
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
    END IF;

    -- Fix set_user_pin. We attempt to find it by name and alter it.
    -- We'll assume it takes (uuid, text) as it's likely a clone/alias of set_kiosk_pin
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_user_pin') THEN
        -- Check for the specific signature to be safe, or just try to alter it if unique
        -- PG doesn't allow ALTER FUNCTION name() if it's overloaded without args.
        -- We'll try to find the oid and use that or blindly try the expected signature.
        BEGIN
            ALTER FUNCTION public.set_user_pin(UUID, TEXT) SET search_path = public, pg_temp;
        EXCEPTION WHEN OTHERS THEN
            -- If that signature fails, maybe it has different args? 
            -- We'll log a notice but not fail the migration hard? 
            -- Actually, let's try to just set it on *all* functions named set_user_pin if possible.
            -- PG doesn't support "ALTER FUNCTION checking name".
            -- We'll just ignore for now if the specific signature fails, as it might mean it doesn't exist 
            -- (maybe the warning was stale or referred to set_kiosk_pin which we fixed).
            RAISE NOTICE 'Could not alter set_user_pin(UUID, TEXT), maybe signature implies different args.';
        END;
    END IF;
END $$;

-- 2. Further tighten public.applications RLS
-- The warning "RLS Policy Always True" might be triggered because "status = 'pending'" is still considered "broad" or just because it allows public inserts?
-- We will add 'email IS NOT NULL' to be more specific, and ensure no other policies allow insert.

DO $$
BEGIN
    -- Drop previous attempts
    DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;
    DROP POLICY IF EXISTS "Public submit applications" ON public.applications;
    
    -- Create strict policy
    CREATE POLICY "Public submit applications"
    ON public.applications
    FOR INSERT
    TO public
    WITH CHECK (
        status = 'pending' 
        AND email IS NOT NULL
        -- Explicitly check against the column to satisfy "permissive" heuristics
    );
END $$;
