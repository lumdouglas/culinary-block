---
name: supabase-postgres-best-practices
description: Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, database configurations, RLS policies, server actions, or migrations for the culinary-block project.
license: MIT
metadata:
  author: supabase
  version: "1.1.0"
  organization: Supabase
  date: January 2026
---

# Supabase Postgres Best Practices — Culinary Block

Covers the most critical patterns for this project: server action auth, RLS policies, migrations, and query hygiene.

---

## CRITICAL: Server Action Auth Pattern

Every server action that touches the database MUST authenticate the user first.

```ts
// app/actions/bookings.ts
'use server'
import { createClient } from '@/utils/supabase/server'

export async function getMyBookings() {
  const supabase = await createClient()

  // 1. ALWAYS call getUser() first — never skip this
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  // 2. Fetch with explicit columns — never SELECT *
  const { data, error } = await supabase
    .from('bookings')
    .select('id, station_id, start_time, end_time, status')
    .eq('tenant_id', user.id)
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}
```

**Rules:**
- Always `await supabase.auth.getUser()` before any `.from()` call
- Never use `SELECT *` — list the columns you actually need
- For admin actions: also verify `profile.role === 'admin'` after getUser

---

## CRITICAL: Row-Level Security (RLS) Pattern

Every new table needs RLS enabled and explicit policies.

```sql
-- Step 1: Enable RLS on the table (REQUIRED)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 2: Tenant read policy — only their own rows
CREATE POLICY "tenants_read_own_notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = tenant_id);

-- Step 3: Admin read-all policy
CREATE POLICY "admins_read_all_notifications"
  ON notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Step 4: Tenant insert — only for their own rows
CREATE POLICY "tenants_insert_own_notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);
```

**Rules:**
- `ENABLE ROW LEVEL SECURITY` is required on every new table
- `auth.uid()` is the Supabase built-in for the current user's UUID
- Reference the `profiles` table (with `role` column) for admin checks
- Separate policies for SELECT, INSERT, UPDATE, DELETE

---

## HIGH: Migration Conventions

```sql
-- File: supabase/migrations/20260317000000_add_notifications.sql

-- Always use named indexes
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message     text NOT NULL,
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Named index — always name your indexes explicitly
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id
  ON notifications (tenant_id);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications (created_at DESC);
```

**Rules:**
- File name: `YYYYMMDDHHMMSS_description.sql` (timestamped)
- Always name indexes: `idx_<table>_<column(s)>` — never rely on auto-generated names
- Always `CREATE INDEX IF NOT EXISTS`
- Always enable RLS in the same migration as table creation

---

## HIGH: Query Hygiene

```ts
// ❌ Never do this — fetches all columns, expensive and leaks data
const { data } = await supabase.from('timesheets').select('*')

// ✅ Always select explicit columns
const { data } = await supabase
  .from('timesheets')
  .select('id, clock_in, clock_out, duration_minutes, station_id')
  .eq('tenant_id', user.id)
  .gte('clock_in', startOfWeek)
  .lte('clock_in', endOfWeek)
```

**Project table names** (use these exactly):
- `profiles` — tenant/admin accounts (id, role, company_name, is_active, kiosk_pin_hash)
- `bookings` — station reservations (station_id, start_time, end_time, status)
- `timesheets` — clock-in/out records (clock_in, clock_out, duration_minutes)
- `billing_periods` — monthly billing cycle records (tenant_id, period_month, total_hours, total_amount)
- `invoices` — billing records (tenant_id, status, total_amount)
- `invoice_lines` — line items (invoice_id, description, quantity, unit_price, amount)
- `stations` — kitchen stations (kitchen_id, name, station_type, category)
- `kitchens` — physical kitchens (name, hourly_rate, color_code)
- `applications` — pre-approval records (status: pending/approved/rejected)
- `maintenance_tickets` — equipment issues (priority, status)
- `requests` — generic requests (type: maintenance/rule_violation)
- `timesheet_requests` — edit request workflow
- `timesheet_audit_log` — append-only audit trail of all timesheet changes

---

## MEDIUM: RPC Functions (Supabase-specific)

Use RPCs for server-side logic that needs elevated access or complex atomicity:

```sql
-- supabase/migrations/20260317000001_add_hours_rpc.sql
CREATE OR REPLACE FUNCTION get_tenant_hours_this_period(p_tenant_id uuid)
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER  -- runs as the function owner, bypasses RLS for system calcs
SET search_path = public
AS $$
  SELECT COALESCE(SUM(duration_minutes), 0) / 60.0
  FROM timesheets
  WHERE tenant_id = p_tenant_id
    AND clock_in >= date_trunc('month', now())
    AND clock_out IS NOT NULL;
$$;
```

Calling from a Server Action:
```ts
const { data, error } = await supabase.rpc('get_tenant_hours_this_period', {
  p_tenant_id: user.id
})
```

---

## Rule Categories by Priority

| Priority | Category | Impact |
|----------|----------|--------|
| 1 | Server Action Auth | CRITICAL |
| 2 | RLS Policies | CRITICAL |
| 3 | Migration Conventions | HIGH |
| 4 | Query Hygiene (no SELECT *) | HIGH |
| 5 | Named Indexes | MEDIUM-HIGH |
| 6 | RPC Functions | MEDIUM |

## References

- https://supabase.com/docs/guides/auth/row-level-security
- https://supabase.com/docs/guides/database/overview
- https://www.postgresql.org/docs/current/