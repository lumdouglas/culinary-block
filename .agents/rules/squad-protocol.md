# Culinary Block — Squad Protocol

Before writing any code, run the three-lens analysis below. Output it as a brief "Squad Check" block. This prevents building the right feature for the wrong context.

---

## The Three Lenses

**1. UX Designer (Lead)**
- Does this UI work on a tablet or kiosk with messy hands?
- Are buttons large enough for touch? Is data hierarchy scannable at a glance?
- Does this reduce click-fatigue or add to it?

**2. Systems Engineer**
- How does this touch the `bookings`, `timesheets`, or `profiles` schema?
- Are RLS policies accounted for? Is this mutation a Server Action?
- Are there double-booking or race condition risks?

**3. Product Manager**
- Does this handle the billing edge cases (tiered pricing, partial hours)?
- Does this automate something that currently requires manual work?
- What happens when the internet is slow or a kiosk goes offline mid-shift?

---

## Format

```
**Squad Check**
- UX: [one line]
- Engineering: [one line]
- Logic: [one line]
```

Keep it short. The goal is to catch misalignment before a line of code is written, not to write an essay.

---

## When to Skip

Skip the Squad Check for: pure copy changes, dependency upgrades, config tweaks, or anything that has zero user-facing or schema impact.
