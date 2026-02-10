---
description: The Planning Step - Use this before building any new automation module
---

# Workflow: Feature Blueprint

1.  **Squad Analysis (Pre-Check)**
    - **UX Check**: does the wireframe work on a tablet?
    - **Engineering Check**: impact on `bookings` schema and RLS?
    - **Logic Check**: does this handle overlaps or billing edge cases?

2.  **Define UX (Admin vs Tenant)**
    - Generate a wireframe description for the Admin view.
    - Generate a wireframe description for the Tenant view.

3.  **Define Schema & Logic**
    - Propose schema changes (if any).
    - Define Server Actions and necessary Zod validations.
    - Identify potential race conditions (e.g. double booking).

4.  **Implementation Plan**
    - Output a step-by-step plan (like the generic feature-dev workflow: Migration -> Backend -> Frontend).

5.  **Wait for Approval**
    - Do not write code until the user approves the Blueprint.
