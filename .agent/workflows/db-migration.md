---
description: Process for creating and applying database migrations
---

# Database Migration Workflow

1.  **Draft Migration**
    - Create a new SQL file in `supabase/migrations/<timestamp>_name.sql`.
    - Write idempotent SQL (use `IF NOT EXISTS`, `OR REPLACE`).

2.  **Apply Locally**
    - Run `npx supabase migration up` to apply pending migrations to your local instance.

3.  **Generate Types**
    - // turbo
    - Run `npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" --schema public > types/supabase.ts`.

4.  **Verify Schema**
    - Check that new tables/columns are visible in your local dashboard or psql.
    - Ensure RLS policies are in place (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

5.  **Push to Production**
    - Commit the migration file.
    - CI/CD (or `supabase db push`) will apply it to the remote project.
