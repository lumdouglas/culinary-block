-- Remediation of security issues reported by Supabase Security Advisor
-- 1. Fix Security Definer View (view_billing_summary)
-- 2. Enable RLS on public.requests
-- 3. Enable RLS on public.timesheet_requests

-- 1. Fix public.view_billing_summary
DO $$
BEGIN
    -- Check if view exists
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'view_billing_summary') THEN
        -- Set security_invoker = true to fix privilege escalation risk
        ALTER VIEW public.view_billing_summary SET (security_invoker = true);
    END IF;
END $$;

-- 2. Enable RLS on public.requests
ALTER TABLE IF EXISTS public.requests ENABLE ROW LEVEL SECURITY;

-- Re-apply policies for requests to ensure they exist and are correct
DO $$
BEGIN
    -- Drop existing policies to avoid conflicts if re-running
    DROP POLICY IF EXISTS "Admins can view all requests" ON public.requests;
    DROP POLICY IF EXISTS "Users can insert own requests" ON public.requests;
    DROP POLICY IF EXISTS "Admins can update requests" ON public.requests;

    -- Policy: Admins can view all requests
    CREATE POLICY "Admins can view all requests" ON public.requests
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );

    -- Policy: Authenticated users can insert their own requests
    CREATE POLICY "Users can insert own requests" ON public.requests
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    -- Policy: Admins can update requests (status, priority)
    CREATE POLICY "Admins can update requests" ON public.requests
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
END $$;

-- 3. Enable RLS on public.timesheet_requests
ALTER TABLE IF EXISTS public.timesheet_requests ENABLE ROW LEVEL SECURITY;

-- Add policies for timesheet_requests
DO $$
BEGIN
    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Admins can manage all timesheet requests" ON public.timesheet_requests;
    DROP POLICY IF EXISTS "Users can manage own timesheet requests" ON public.timesheet_requests;
    DROP POLICY IF EXISTS "Users can view own timesheet requests" ON public.timesheet_requests;
    DROP POLICY IF EXISTS "Users can insert own timesheet requests" ON public.timesheet_requests;

    -- Policy: Admins can do everything
    CREATE POLICY "Admins can manage all timesheet requests" ON public.timesheet_requests
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );

    -- Policy: Users can view own requests
    CREATE POLICY "Users can view own timesheet requests" ON public.timesheet_requests
      FOR SELECT
      USING (auth.uid() = user_id);

    -- Policy: Users can insert own requests
    CREATE POLICY "Users can insert own timesheet requests" ON public.timesheet_requests
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
      
    -- Note: Users generally shouldn't update requests once submitted, except maybe to cancel (delete). 
    -- For now, we'll restrict updates to Admins via the first policy.
END $$;
