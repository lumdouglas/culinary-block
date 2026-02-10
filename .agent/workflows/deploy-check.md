---
description: Checklist to run before deploying to production
---

# Deployment Check Workflow

1.  **Linting**
    - // turbo
    - Run `npm run lint` to catch static analysis errors.

2.  **Type Checking**
    - Run `tsc --noEmit` to ensure no TypeScript errors exist.

3.  **Build Verification**
    - // turbo
    - Run `npm run build` to confirm the project builds successfully.

4.  **Environment Variables**
    - Check `.env.production` against `.env.local` to ensure all new keys are present.

5.  **Smoke Test**
    - Start the production build locally: `npm run start`.
    - Navigate to critical paths (Login, Dashboard, Booking).
