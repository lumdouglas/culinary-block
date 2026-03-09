# PDF Mapping Notes — `catering-packet-2025-08-25.pdf`

Santa Clara County DEH — Caterer Permit Application Packet
Rev: 08-25 (pages 1) / 08-24 (pages 2–15)
Pages: 15 | Format: **flat scan — no AcroForm fields**

---

## Overview

This packet replaces / supplements `catering-permit-blank.pdf` (the old 96-field AcroForm).
The new packet is **not fillable via pdf-lib** — it is a flat PDF with printed form lines.
To fill it programmatically we either: (a) overlay text with pdf-lib `drawText`, or (b) recreate sections as a generated PDF.

The packet bundles **three sub-documents** DEH requires for a new caterer permit:

| # | Document | Pages | Submitted to DEH |
|---|----------|-------|-----------------|
| 1 | Permit Application & Certification Statement | 2–4 | Yes |
| 2 | Rental Kitchen Agreement Form | 5 | Yes |
| 3 | Written Operational Procedures Statement (WOPS) | 6–14 | Yes |
| — | Checklist (cover page) | 1 | Reference only |
| — | WOPS Example (Beef Stew) | 15 | Reference only |

---

## Page-by-Page Field Map

### Page 1 — Checklist (cover)
Informational only. No data fields. Lists required submissions:
- Permit Application & Certification Form
- Rental Kitchen Agreement Form
- Copy of Rental Kitchen Contract/Lease Agreement
- Written Operational Procedures Statement
- Copy of Food Safety Certificate & Food Handler Cards
- Paid FP90 New Operating Permit Application Fee

**→ No model fields needed.**

---

### Pages 2–4 — Permit Application & Certification Statement

#### Owner Information
| PDF Label | Model Field | Notes |
|-----------|-------------|-------|
| Owner Name | `owner_name` | ✅ mapped |
| Address | *(none)* | ❌ owner street address — separate from PFF |
| Unit # | *(none)* | ❌ |
| City | *(none)* | ❌ |
| ST / Zip | *(none)* | ❌ |
| Phone / Ext | `owner_phone` | ✅ mapped (no ext field) |
| Email | `owner_email` | ✅ mapped |
| Had/has permit in SCC? (Yes/No) | *(none)* | ❌ checkbox — relevant for renewals |
| Existing Facility ID# FA0 | *(none)* | ❌ |
| Existing Facility Name | *(none)* | ❌ |

#### Facility Information
| PDF Label | Model Field | Notes |
|-----------|-------------|-------|
| Facility Name (dba) | `catering_dba` | ✅ mapped |
| Address | `pff_address` | ✅ partial (no Unit#/City/ST/Zip split) |
| Unit # | *(none)* | ❌ |
| City | *(none)* | ❌ |
| ST | hardcoded "CA" | — |
| Zip | *(none)* | ❌ |
| Phone / Ext | *(none)* | ❌ facility phone |
| Email | *(none)* | ❌ facility email |
| Emergency/Alternate Contact | *(none)* | ❌ |
| Emergency Phone | *(none)* | ❌ |

#### Billing Correspondence
Checkboxes: send to Owner vs Other.
**→ Pre-fill "Owner" checkbox.**

#### Certification / Signature Block
| PDF Label | Model Field | Notes |
|-----------|-------------|-------|
| Signature | *(hand-signed)* | Cannot fill programmatically |
| Date | auto (today) | ✅ fill with today |
| Print Name | `signature_name` | ✅ mapped |
| Phone | `owner_phone` | ✅ reuse |

---

### Page 5 — Rental Kitchen Agreement Form

#### Applicant Information
| PDF Label | Model Field | Notes |
|-----------|-------------|-------|
| Owner Name | `owner_name` | ✅ |
| Name of Business | `catering_dba` | ✅ |
| Owner Address | *(none)* | ❌ owner mailing address |
| City / State / Zip | *(none)* | ❌ |
| Email Address | `owner_email` | ✅ |
| Telephone | `owner_phone` | ✅ |
| Mobile | *(none)* | ❌ |

#### Rental Kitchen
| PDF Label | Model Field | Notes |
|-----------|-------------|-------|
| Name of the rental kitchen | `pff_name` | ✅ (default: "Culinary Block") |
| Address | `pff_address` | ✅ (default: "1901 Las Plumas Ave…") |
| Days/times of facility use (M–Su checkboxes + AM/PM) | *(none)* | ❌ operating schedule not collected |

#### Initials Section (6 items)
All pre-filled as a block when `agreement_initialed = true`.
Current model collapses all 6 into one boolean — acceptable for Culinary Block's standard agreement.

| # | Agreement Statement | Model |
|---|--------------------|----|
| 1 | All food/equipment stored at rental kitchen | `agreement_initialed` |
| 2 | All food prepared at rental kitchen, not home | `agreement_initialed` |
| 3 | Obtain Food Safety Manager cert within 60 days | `agreement_initialed` |
| 4 | Employees get food handler cards within 30 days | `agreement_initialed` |
| 5 | Maintain valid EH Permit on site | `agreement_initialed` |
| 6 | Notify inspector before purchasing new equipment | `agreement_initialed` |

#### Approved Rental Facility (Culinary Block signs this section)
| PDF Label | Pre-fill Value | Notes |
|-----------|---------------|-------|
| Type of Facility | Commercial Kitchen ✓ | Culinary Block is always "Commercial Kitchen" |
| Facility name | "Culinary Block" | Hardcoded |
| Facility Address | "1901 Las Plumas Ave, San Jose, CA 95133" | Hardcoded |
| Email | Culinary Block contact email | Needs constant |
| Telephone | Culinary Block phone | Needs constant |
| Facility Owner/Agent signature | *(Culinary Block signs)* | Cannot fill — CB staff signs |
| Days checkboxes (Mon–Sun) | Per CB's actual schedule | ❌ not in model |

---

### Pages 6–14 — Written Operational Procedures Statement (WOPS)

#### Section A — Catering Business Plan (Page 6)

| PDF Label | Model Field | Notes |
|-----------|-------------|-------|
| Name of Business | `catering_dba` | ✅ |
| Owner Name | `owner_name` | ✅ |
| Phone | `owner_phone` | ✅ |
| Owner Email | `owner_email` | ✅ |
| Rental Kitchen Name | `pff_name` | ✅ |
| Rental Kitchen Address | `pff_address` | ✅ |
| City / State / Zip | *(none)* | ❌ parsed from address |
| Target customers (checkboxes) | *(none)* | ❌ Corporate/Individual/Private Parties/Other |
| How orders received (checkboxes) | *(none)* | ❌ Phone/Internet/Walk-in/Other |
| Days of week + times at rental facility | *(none)* | ❌ schedule grid |
| Number of food prep employees | *(none)* | ❌ |

#### Section B — Food Handling Procedures (Pages 7–12)

**B.1 — Menu items with ingredients** (table, up to ~15 rows)

| PDF Label | Model Field | Notes |
|-----------|-------------|-------|
| Food Item | `menu_items[].food` | ✅ |
| Ingredients Used | *(none)* | ❌ separate from procedures — not currently captured |

**B.2 — No-cook / dessert items list** (6 blank lines)
**→** ❌ Not in model. Would need to tag `menu_items` with a `category` or `requires_cooking: boolean`.

**B.3 — Cook-to-serve items list** (8 blank lines)
**→** ❌ Not in model.

**B.4 — Complex items (cook/cool/reheat)** (8 blank lines)
**→** ❌ Not in model.

**B.5 — Step-by-step procedure per menu item** (Pages 8–12, one page per item, 4 blank pages total → ~4 complex items)

Each page has 6 labeled steps:
| Step | Label | Model Field |
|------|-------|-------------|
| 1 | Storage (temps, location) | `menu_items[].procedures` (partial) |
| 2 | Preparation | `menu_items[].procedures` (partial) |
| 3 | Cooking (min temps) | `menu_items[].procedures` (partial) |
| 4 | Cooling (135→70 in 2h, 70→41 in 4h) | `menu_items[].procedures` (partial) |
| 5 | Reheating (41→165 in 2h) | `menu_items[].procedures` (partial) |
| 6 | Delivery (transport method + temp) | `menu_items[].procedures` (partial) |

Current `procedures` is a single free-text string. The AI assistant should guide users to fill in all 6 steps. The filled text gets written into this per-item page.

**B.6 — Ingredient purchase locations** (checkboxes)
Restaurant Depot / Costco / Cash and Carry / Smart and Final / Local grocery / Online / Farmers Markets / Other
**→** ❌ Not in model.

#### Section B continued (Page 13) — Specialized Processes
Checkboxes: Cook-chill / Vacuum packaging / Sous Vide / Acidification / Fermentation / Drying / Smoking / Curing
**→** ❌ Not in model. Low priority for typical catering; HACCP plan required if checked.

Storage layout / kitchen diagram
**→** ❌ Not in model.

#### Section C — Cleaning & Sanitizing (Page 13)

| PDF Label | Model Field | Notes |
|-----------|-------------|-------|
| Manual sanitize checkbox | *(none)* | ❌ method not captured separately |
| Chemical dishwasher checkbox | *(none)* | ❌ |
| High-temperature dishwasher checkbox | *(none)* | ❌ |
| Chlorine 100ppm checkbox | `sanitizer_chlorine` | ✅ |
| Quaternary ammonium 200ppm checkbox | `sanitizer_quat` | ✅ |
| Iodine 25ppm checkbox | `sanitizer_iodine` | ✅ |

#### Section D — Food Delivery Method (Page 13)

| PDF Label | Model Field | Notes |
|-----------|-------------|-------|
| How PHF delivered (free text) | *(derived from transport_*)* | Partial — could auto-generate from transport fields |
| Equipment for cold/hot hold | `temp_equipment` | ✅ reuse |
| Pick-up only / Delivery only / Served on site | *(none)* | ❌ delivery method radio not in model |

#### Initials Block (Pages 13–14) — 9 Statements
| # | Statement | Model |
|---|-----------|-------|
| 1 | All food stored/prepared at caterer's facility or rental kitchen | `agreement_initialed` |
| 2 | Utensils washed/stored at caterer's facility | `agreement_initialed` |
| 3 | Food protected from adulteration at all times | `agreement_initialed` |
| 4 | No food prepared from home | `agreement_initialed` |
| 5 | Potable water + restrooms within 200 ft | `agreement_initialed` |
| 6 | Catering vehicle clean and sanitary | `agreement_initialed` |
| 7 | PHFs maintained at ≤41°F or ≥135°F | `agreement_initialed` |
| 8 | Handwashing requirements | `agreement_initialed` |
| 9 | Employees not handling food when ill | `agreement_initialed` |

#### Signature Block (Page 14)
| PDF Label | Model Field |
|-----------|-------------|
| Owner/Authorized Agent Signature | *(hand-signed)* |
| Print Name | `signature_name` |
| Date | auto (today) |

---

### Page 15 — Example: Beef Stew Procedures
Reference only. No fields. Used by AI to explain step format to applicants.

---

## Gap Analysis — Missing from Current Data Model

Fields present in the packet but **not yet captured** by `CateringPermitData`:

### High Priority (needed for complete submission)
| Field | Where Used | Suggested Model Key |
|-------|-----------|-------------------|
| Ingredients per menu item | WOPS B.1 | `menu_items[].ingredients` |
| Menu item category (no-cook / cook-to-serve / complex) | WOPS B.2–B.4 | `menu_items[].category` enum |
| Delivery method (pickup / delivery / on-site) | WOPS D | `delivery_method` |
| Owner street address (separate from PFF) | Permit App | `owner_address`, `owner_city`, `owner_state`, `owner_zip` |
| Number of food prep employees | WOPS A | `employee_count` |

### Medium Priority
| Field | Where Used | Suggested Model Key |
|-------|-----------|-------------------|
| Operating schedule (days + times) | Rental Kitchen Agreement, WOPS A | `operating_days[]`, `operating_times` |
| Target customers type | WOPS A | `customer_types[]` |
| Order method (phone/web/walk-in) | WOPS A | `order_methods[]` |
| Wash/sanitize method (manual/chemical DW/high-temp DW) | WOPS C | `sanitize_method` |
| Ingredient purchase sources | WOPS B.6 | `ingredient_sources[]` |

### Low Priority
| Field | Notes |
|-------|-------|
| Has existing SCC permit (Yes/No + FA#) | Only for renewals |
| Specialized processes (sous vide etc.) | Niche operators only; HACCP plan required |
| Emergency contact name + phone | Permit Application |
| Facility phone + email | Permit Application (separate from owner) |

---

## PDF Generation Strategy

The new packet is a flat PDF — no AcroForm to fill. Two options:

### Option A: Text Overlay (recommended for MVP)
Use `pdf-lib` `drawText()` to stamp text at known coordinates on each page of the flat packet.
- Pros: Preserves DEH's exact formatting, zero design work
- Cons: Requires precise pixel coordinates for every field (measure once, hardcode)
- Implementation: Load `catering-packet-2025-08-25.pdf`, overlay data, flatten

### Option B: Generate New PDF Pages
Generate styled PDF pages using pdf-lib primitives to match the form layout.
- Pros: Full control, no coordinate hunting
- Cons: Significant design effort to match official form appearance

**Recommendation:** Option A for the Permit Application (Pages 2–4) and Rental Kitchen Agreement (Page 5) since they are simple forms. Option B for WOPS (Pages 6–14) since the procedures per menu item require dynamic height.

---

## Constants for Culinary Block (pre-filled, not collected from user)

```ts
// lib/catering-permit-pdf.ts — hardcoded Culinary Block values
PFF_NAME    = "Culinary Block"
PFF_ADDRESS = "1901 Las Plumas Ave"
PFF_CITY    = "San Jose"
PFF_STATE   = "CA"
PFF_ZIP     = "95133"
PFF_COUNTY  = "Santa Clara"
PFF_FACILITY_TYPE = "Commercial Kitchen"
```

---

## AI Assistant Guidance Notes

The `/apply/catering-permit` wizard should collect or explain these key DEH requirements:

1. **Ingredients**: Ask for ingredients per menu item — required for WOPS B.1
2. **Food category**: Distinguish no-cook, cook-to-serve, and complex items — drives inspection complexity
3. **6-step procedures**: For any PHF item the inspector wants Storage → Prep → Cook → Cool → Reheat → Delivery temps
4. **Employee count**: Simple number, easy to add
5. **Operating schedule**: Days + morning/afternoon/evening blocks
6. **Delivery method**: Pick-up / delivery / on-site service affects transport requirements

The inspector (AI persona) should explain that **three forms** must be submitted together:
- Permit Application (owner + facility info + signature)
- Rental Kitchen Agreement (signed by both applicant and Culinary Block as kitchen owner)
- Written Operational Procedures (menu + procedures + compliance initials)

Culinary Block staff countersign the Rental Kitchen Agreement — applicant cannot submit without CB's signature block on Page 5.
