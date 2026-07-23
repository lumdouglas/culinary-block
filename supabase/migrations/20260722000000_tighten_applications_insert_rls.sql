-- Tighten public.applications INSERT policy
-- Description: The previous policy ("status = 'pending' AND email IS NOT NULL")
-- was trivially satisfied by any payload, leaving the public anon endpoint open
-- to spam/bot inserts that bypass the /apply form's Zod validation entirely.
-- This adds real shape/format constraints so malformed or empty submissions
-- are rejected at the database layer, regardless of client.

DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;
    DROP POLICY IF EXISTS "Public submit applications" ON public.applications;

    CREATE POLICY "Public submit applications"
    ON public.applications
    FOR INSERT
    TO public
    WITH CHECK (
        status = 'pending'
        AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        AND length(email) <= 255
        AND company_name IS NOT NULL AND length(btrim(company_name)) BETWEEN 2 AND 200
        AND contact_first_name IS NOT NULL AND length(btrim(contact_first_name)) BETWEEN 1 AND 100
        AND contact_last_name IS NOT NULL AND length(btrim(contact_last_name)) BETWEEN 1 AND 100
        AND phone IS NOT NULL AND length(regexp_replace(phone, '[^0-9]', '', 'g')) BETWEEN 10 AND 15
        AND cuisine_type IS NOT NULL AND length(btrim(cuisine_type)) BETWEEN 2 AND 100
        AND kitchen_use_description IS NOT NULL AND length(btrim(kitchen_use_description)) BETWEEN 10 AND 2000
        AND usage_hours IS NOT NULL AND length(btrim(usage_hours)) BETWEEN 5 AND 500
        AND equipment_needed IS NOT NULL AND length(btrim(equipment_needed)) BETWEEN 5 AND 1000
        AND address IS NOT NULL AND length(btrim(address)) BETWEEN 5 AND 300
        AND user_id IS NULL
        AND reviewed_at IS NULL
        AND reviewed_by IS NULL
        AND invited_at IS NULL
    );
END $$;
