---
description: Workflow for seeding local development data
---

# Data Seeding Workflow

1.  **Prepare Seed File**
    - Edit `supabase/seed.sql`.
    - Ensure reference IDs match known test users (or create them in the seed).

2.  **Reset Database**
    - Run `npx supabase db reset`.
    - This drops the database, applies all migrations, and runs `seed.sql`.

3.  **Verify Data**
    - Check the `bookings` and `kitchens` tables for the seeded rows.
