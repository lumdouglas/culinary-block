---
description: The Deployment Step - Verify timesheet logic before production
---

# Workflow: Verify Automation

1.  **Type Safety Regression**
    - Run `npm run type-check` (or `tsc --noEmit`) to ensure no TypeScript regressions.

2.  **Logic Audit (Billing Routes)**
    - Review `app/actions` and billing logic.
    - Check for double-charging risks.
    - Check for timezone handling issues.

3.  **Test Case Generation**
    - **Standard Shift**: Normal clock-in/out.
    - **The "Cinderella" Shift**: Clock-in at 11 PM, Clock-out at 2 AM (next day).
    - **The Snowflake**: A cancelled booking or partial refund.

4.  **Security Audit (RLS)**
    - Verify Tenants cannot see other Tenants' invoices.
    - Verify Admins can see everything.

5.  **Smoke Test**
    - Manually verify the "Giant Clock-In Button" works on a mobile viewport.
