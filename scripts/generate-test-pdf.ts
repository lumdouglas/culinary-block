/**
 * Generate a test PDF with ALL fields filled in.
 * Run: npx tsx scripts/generate-test-pdf.ts
 * Output: /tmp/test-permit-filled.pdf
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// ── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length + word.length + 1 > maxChars && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function parseProcedureSteps(text: string): Record<string, string> {
  const steps: Record<string, string> = {
    storage: "", preparation: "", cooking: "", cooling: "", reheating: "", delivery: "",
  };

  const labelPattern =
    /(?:^|\n|(?<=\.\s)|(?<=;\s)|(?<=\s))(?:step\s*\d[\s:.—-]*)?(?:storage|preparation|prep|cooking|cook|cooling|cool|reheating|reheat|delivery|deliver)\s*[:.\s—-]+/gi;

  const matches: { key: string; start: number; end: number }[] = [];
  let m;
  while ((m = labelPattern.exec(text)) !== null) {
    const label = m[0].toLowerCase();
    let key = "";
    if (/storage/i.test(label)) key = "storage";
    else if (/prep/i.test(label)) key = "preparation";
    else if (/cook/i.test(label) && !/cool/i.test(label)) key = "cooking";
    else if (/cool/i.test(label)) key = "cooling";
    else if (/reheat/i.test(label)) key = "reheating";
    else if (/deliver/i.test(label)) key = "delivery";
    if (key) matches.push({ key, start: m.index, end: m.index + m[0].length });
  }

  if (matches.length === 0) {
    steps.preparation = text.trim();
    return steps;
  }

  for (let i = 0; i < matches.length; i++) {
    const contentStart = matches[i].end;
    const contentEnd = i + 1 < matches.length ? matches[i + 1].start : text.length;
    const content = text.slice(contentStart, contentEnd).trim();
    if (content) {
      steps[matches[i].key] = (steps[matches[i].key] ? steps[matches[i].key] + " " : "") + content;
    }
  }

  const beforeFirst = text.slice(0, matches[0].start).trim();
  if (beforeFirst) {
    steps.storage = (beforeFirst + " " + steps.storage).trim();
  }

  return steps;
}

// ── test data: hypothetical chef application ─────────────────────────────────

const TEST_DATA = {
  catering_dba: "Maria's Kitchen Catering",
  owner_name: "Maria Elena Rodriguez",
  owner_address: "456 Oak Street, Apt 12",
  owner_city: "San Jose",
  owner_state: "CA",
  owner_zip: "95112",
  owner_phone: "(408) 555-1234",
  owner_email: "maria@mariaskitchen.com",
  pff_name: "Culinary Block",
  pff_address: "1901 Las Plumas Ave, San Jose, CA 95133",
  pff_county: "Santa Clara",
  menu_items: [
    {
      food: "Chicken Fried Rice",
      ingredients: "Rice, chicken breast, eggs, carrots, peas, garlic, ginger, soy sauce, sesame oil",
      category: "complex" as const,
      procedures: "Storage: Raw chicken stored refrigerated at 41°F or below. Cooked rice, prepared vegetables, and scrambled eggs stored refrigerated at 41°F or below. Preparation: Dice chicken, cook and cool rice (if not pre-cooked), dice carrots and peas, mince garlic and ginger, and scramble eggs. Cooking: Cook diced chicken to an internal temperature of 165°F. Stir-fry vegetables, then combine with rice and eggs. Final dish must reach 165°F. Cooling: Cool from 135°F to 70°F within 2 hours, then from 70°F to 41°F within 4 hours using shallow pans in walk-in cooler. Reheating: Reheat to 165°F within 2 hours before service. Use commercial microwave or stovetop. Delivery: Transport in Cambro insulated carriers. Verify temperature is 135°F or above at departure and arrival. Log temperatures.",
    },
    {
      food: "Caesar Salad",
      ingredients: "Romaine lettuce, parmesan cheese, croutons, Caesar dressing, lemon",
      category: "no-cook" as const,
      procedures: "Storage: All ingredients stored refrigerated at 41°F or below. Dressing stored separately. Preparation: Wash and chop romaine lettuce. Portion parmesan and croutons. Cooking: N/A — no-cook item. Cooling: N/A — maintain cold chain at 41°F or below. Reheating: N/A. Delivery: Transport in coolers with ice packs. Verify temperature is 41°F or below at departure and arrival.",
    },
    {
      food: "Beef Tacos",
      ingredients: "Ground beef, corn tortillas, onion, cilantro, lime, salsa, cheese, lettuce, tomato",
      category: "cook-to-serve" as const,
      procedures: "Storage: Ground beef stored refrigerated at 41°F or below. Vegetables stored refrigerated. Preparation: Dice onion, chop cilantro, shred lettuce, dice tomato. Cooking: Brown ground beef to internal temperature of 155°F for 15 seconds. Season and hold at 135°F or above. Cooling: N/A — cook-to-serve item, served immediately. Reheating: N/A — served immediately after cooking. Delivery: Transport seasoned beef in Cambro at 135°F or above. Assemble tacos on-site. Log temperatures at departure and arrival.",
    },
    {
      food: "Horchata",
      ingredients: "Rice, cinnamon, vanilla, sugar, milk, water",
      category: "no-cook" as const,
      procedures: "Storage: Prepared horchata stored refrigerated at 41°F or below. Preparation: Blend soaked rice with cinnamon, vanilla, sugar, milk, and water. Strain and refrigerate. Cooking: N/A — no-cook beverage. Cooling: Prepared cold, maintain at 41°F or below. Reheating: N/A. Delivery: Transport in sealed beverage dispensers inside coolers with ice packs. Verify 41°F or below.",
    },
    {
      food: "Chicken Mole",
      ingredients: "Chicken thighs, dried chilies (ancho, guajillo, pasilla), chocolate, sesame seeds, peanuts, onion, garlic, cumin, rice",
      category: "complex" as const,
      procedures: "Storage: Raw chicken stored at 41°F or below. Dried chilies and spices in dry storage. Preparation: Toast and rehydrate dried chilies. Blend with chocolate, sesame, peanuts, onion, garlic, and cumin to make mole sauce. Cooking: Cook chicken thighs to internal temperature of 165°F. Simmer mole sauce for 30 minutes. Combine chicken with mole sauce, ensure 165°F throughout. Cooling: Cool from 135°F to 70°F within 2 hours, then 70°F to 41°F within 4 hours in shallow pans. Reheating: Reheat to 165°F within 2 hours. Verify with probe thermometer. Delivery: Transport in Cambro insulated carriers at 135°F or above. Log temperatures at departure and upon arrival at host facility.",
    },
  ],
  delivery_method: "delivery" as const,
  employee_count: 3,
  operating_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  operating_times: "8:00 AM - 4:00 PM",
  customer_types: ["Corporate", "Private events", "Individual"],
  order_methods: ["Phone", "Internet"],
  sanitize_method: "manual" as const,
  ingredient_sources: ["Restaurant Depot", "Costco", "Local grocery store", "Farmers Markets"],
  transport_cambro: true,
  transport_refrigerated_truck: false,
  transport_coolers: true,
  transport_other: "",
  temp_control: true,
  temp_equipment: "Chafing dishes with Sterno, electric warmers, ice baths for cold items",
  tphc: false,
  tphc_equipment: "",
  handwash_portable: true,
  handwash_host: true,
  sanitize_at_host: true,
  host_3_compartment: true,
  sanitize_at_pff: true,
  extra_supplies_brought: true,
  sanitizer_chlorine: true,
  sanitizer_quat: false,
  sanitizer_iodine: false,
  refuse_at_pff: true,
  refuse_at_host: true,
  host_facilities: [
    { name: "San Jose Convention Center", street: "150 W San Carlos St", city: "San Jose" },
    { name: "Backyard Events Pavilion", street: "789 Elm Drive", city: "Santa Clara" },
    { name: "St. James Park Community Center", street: "100 N 1st St", city: "San Jose" },
  ],
  agreement_initialed: true,
  signature_name: "Maria Elena Rodriguez",
  signature_title: "Owner",
  has_previous_permit: true,
  previous_facility_id: "FA0-123456",
  previous_facility_name: "Maria's Home Kitchen (expired)",
  storage_cooking_equipment: "On shelf rack by prep station #3",
  storage_dry_ingredients: "Dry storage shelf, labeled bins",
  storage_dairy_meat_veg: "Walk-in cooler, designated shelf with name label",
};

// ── generate ─────────────────────────────────────────────────────────────────

async function main() {
  const pdfPath = join(__dirname, "..", "public", "assets", "catering-packet-2025-08-25.pdf");
  const pdfBytes = readFileSync(pdfPath);

  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const color = rgb(0.1, 0.1, 0.4);

  const drawText = (pageIdx: number, text: string, x: number, y: number, size = 10) => {
    if (!text) return;
    pages[pageIdx].drawText(text, { x, y, size, font, color });
  };
  const drawCheck = (pageIdx: number, x: number, y: number, checked: boolean) => {
    if (!checked) return;
    pages[pageIdx].drawText("X", { x, y, size: 12, font, color });
  };

  const data = TEST_DATA;
  const ownerOrAgent = data.signature_name || data.owner_name;
  const initials = getInitials(ownerOrAgent);

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 2 (index 1) — Permit Application (corrected coordinates)
  // ══════════════════════════════════════════════════════════════════════════
  drawText(1, data.owner_name, 120, 691);
  drawText(1, data.owner_address, 80, 665);
  drawText(1, data.owner_city, 330, 665);
  drawText(1, data.owner_state, 490, 665);
  drawText(1, data.owner_zip, 548, 665);
  drawText(1, data.owner_phone, 70, 650);
  drawText(1, data.owner_email, 270, 650);

  drawText(1, data.catering_dba, 155, 578);
  drawText(1, data.pff_address, 80, 563);
  drawText(1, "San Jose", 330, 563);
  drawText(1, "CA", 490, 563);
  drawText(1, "95133", 548, 563);
  drawText(1, data.owner_phone, 70, 547);
  drawText(1, data.owner_email, 270, 547);

  // Previous permit (has_previous_permit=true, so check Yes)
  drawCheck(1, 388, 634, true); // Yes checkbox
  drawText(1, data.previous_facility_id, 92, 619, 9);
  drawText(1, data.previous_facility_name, 260, 619, 9);

  // Billing Owner checkbox
  drawCheck(1, 24, 473, true);

  // Signature
  drawText(1, ownerOrAgent, 90, 314);
  drawText(1, todayFormatted(), 430, 314);
  drawText(1, ownerOrAgent, 100, 297);
  drawText(1, data.owner_phone, 440, 297);

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 5 (index 4) — Rental Kitchen Agreement (corrected coordinates)
  // ══════════════════════════════════════════════════════════════════════════
  drawText(4, data.owner_name, 115, 661);
  drawText(4, data.catering_dba, 380, 661);
  drawText(4, data.owner_address, 120, 644);
  drawText(4, data.owner_city, 290, 644);
  drawText(4, data.owner_state, 460, 644);
  drawText(4, data.owner_zip, 518, 644);
  drawText(4, data.owner_email, 120, 627);
  drawText(4, data.owner_phone, 330, 627);

  drawText(4, data.pff_name, 185, 595);
  drawText(4, data.pff_address, 365, 595);

  // Operating days
  const dayStr = data.operating_days.join(" ").toLowerCase();
  drawCheck(4, 32, 562, dayStr.includes("mon"));
  drawCheck(4, 117, 562, dayStr.includes("tue"));
  drawCheck(4, 203, 562, dayStr.includes("wed"));
  drawCheck(4, 284, 562, dayStr.includes("thu"));
  drawCheck(4, 365, 562, dayStr.includes("fri"));
  drawCheck(4, 437, 562, dayStr.includes("sat"));
  drawCheck(4, 510, 562, dayStr.includes("sun"));

  drawText(4, data.operating_times, 60, 546, 9);

  // Rental kitchen initials
  for (const y of [530, 519, 506, 494, 482, 470]) {
    drawText(4, initials, 42, y, 9);
  }

  // Signature
  drawText(4, ownerOrAgent, 37, 388, 10);
  drawText(4, todayFormatted(), 470, 388, 10);

  // Approved Rental Facility
  drawCheck(4, 124, 337, true);
  drawText(4, "Culinary Block", 120, 298);
  drawText(4, "1901 Las Plumas Ave", 130, 281);
  drawText(4, "San Jose", 300, 281);
  drawText(4, "CA", 408, 281);
  drawText(4, "95133", 456, 281);
  drawText(4, "culinaryblockcatering@gmail.com", 120, 264);
  drawText(4, "4156994397", 330, 264);

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 6 (index 5) — WOPS Section A: Business Plan
  // ══════════════════════════════════════════════════════════════════════════
  drawText(5, data.catering_dba, 150, 569);
  drawText(5, data.owner_name, 120, 552);
  drawText(5, data.owner_phone, 460, 552);
  drawText(5, data.owner_email, 120, 534);
  drawText(5, data.pff_name, 165, 517);
  drawText(5, data.pff_address, 175, 500);
  drawText(5, data.pff_county, 65, 482);
  drawText(5, "CA", 325, 482);

  // Q1: customers
  drawCheck(5, 55, 395, true);   // Corporate
  drawCheck(5, 183, 395, true);  // Individual
  drawCheck(5, 291, 395, true);  // Private

  // Q2: orders
  drawCheck(5, 55, 342, true);   // Phone
  drawCheck(5, 181, 342, true);  // Internet

  // Q3: days
  drawCheck(5, 57, 290, true);   // Mon
  drawCheck(5, 233, 290, true);  // Tue
  drawCheck(5, 392, 290, true);  // Wed
  drawCheck(5, 57, 265, true);   // Thu
  drawCheck(5, 233, 265, true);  // Fri
  drawCheck(5, 395, 265, true);  // Sat

  // Q4: employees
  drawText(5, "3", 310, 188);

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 7 (index 6) — Section B: Menu Items & Categories
  // ══════════════════════════════════════════════════════════════════════════
  const TABLE_START_Y = 672;
  const TABLE_ROW_H = 16;
  data.menu_items.slice(0, 15).forEach((item, i) => {
    const y = TABLE_START_Y - i * TABLE_ROW_H;
    if (y < 474) return;
    drawText(6, item.food, 55, y, 9);
    const ingr = item.ingredients || "";
    drawText(6, ingr.substring(0, 70) + (ingr.length > 70 ? "..." : ""), 170, y, 8);
  });

  // Category sections
  let noCookY = 440;
  let cookY = 308;
  let complexY = 170;
  data.menu_items.forEach((item) => {
    if (item.category === "no-cook" && noCookY > 344) {
      drawText(6, item.food, 55, noCookY, 9);
      noCookY -= 16;
    } else if (item.category === "cook-to-serve" && cookY > 205) {
      drawText(6, item.food, 55, cookY, 9);
      cookY -= 16;
    } else if (item.category === "complex" && complexY > 70) {
      drawText(6, item.food, 55, complexY, 9);
      complexY -= 16;
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PAGES 8-12 (indices 7-11) — Procedure Worksheets
  // ══════════════════════════════════════════════════════════════════════════
  const STEP_AREAS = [
    { key: "storage", startY: 693, endY: 635 },
    { key: "preparation", startY: 621, endY: 520 },
    { key: "cooking", startY: 510, endY: 425 },
    { key: "cooling", startY: 417, endY: 315 },
    { key: "reheating", startY: 304, endY: 160 },
    { key: "delivery", startY: 150, endY: 65 },
  ];
  const STEP_AREAS_PAGE12 = [
    { key: "storage", startY: 740, endY: 680 },
    { key: "preparation", startY: 668, endY: 565 },
    { key: "cooking", startY: 555, endY: 470 },
    { key: "cooling", startY: 462, endY: 355 },
    { key: "reheating", startY: 347, endY: 220 },
    { key: "delivery", startY: 210, endY: 140 },
  ];
  const STEP_CONTENT_X = 200;
  const STEP_LINE_H = 11;
  const STEP_FONT = 8;
  const STEP_MAX_CHARS = 55;

  const procPages = [7, 8, 9, 10, 11];
  data.menu_items.slice(0, 5).forEach((item, i) => {
    const pageIdx = procPages[i];
    const areas = pageIdx === 11 ? STEP_AREAS_PAGE12 : STEP_AREAS;

    drawText(pageIdx, item.food, 110, 718, 11);

    const steps = parseProcedureSteps(item.procedures);

    for (const area of areas) {
      const stepText = steps[area.key];
      if (!stepText) continue;
      const lines = wrapText(stepText, STEP_MAX_CHARS);
      let y = area.startY;
      for (const line of lines) {
        if (y < area.endY) break;
        drawText(pageIdx, line, STEP_CONTENT_X, y, STEP_FONT);
        y -= STEP_LINE_H;
      }
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 12 (index 11) — Ingredient Sources
  // ══════════════════════════════════════════════════════════════════════════
  const sources = data.ingredient_sources.join(" ").toLowerCase();
  drawCheck(11, 57, 120, sources.includes("restaurant depot"));
  drawCheck(11, 253, 120, sources.includes("costco"));
  drawCheck(11, 435, 120, sources.includes("cash and carry"));
  drawCheck(11, 57, 102, sources.includes("smart and final"));
  drawCheck(11, 255, 102, sources.includes("local") || sources.includes("grocery"));
  drawCheck(11, 57, 85, sources.includes("online"));
  drawCheck(11, 253, 85, sources.includes("farmer") || sources.includes("market"));

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 13 (index 12) — Storage, Sanitize, Transport, Delivery
  // ══════════════════════════════════════════════════════════════════════════
  // Section 10: Storage
  drawText(12, data.storage_cooking_equipment, 246, 607, 9);
  drawText(12, data.storage_dry_ingredients, 246, 589, 9);
  drawText(12, data.storage_dairy_meat_veg, 246, 571, 9);

  // C.1 Sanitize method
  drawCheck(12, 57, 505, data.sanitize_method === "manual");
  drawCheck(12, 383, 505, data.sanitize_method === "chemical-dw");
  drawCheck(12, 57, 488, data.sanitize_method === "high-temp-dw");

  // C.2 Sanitizer chemicals
  drawCheck(12, 56, 412, data.sanitizer_chlorine);
  drawCheck(12, 56, 395, data.sanitizer_quat);
  drawCheck(12, 57, 377, data.sanitizer_iodine);

  // D.1 Transport
  const transportTypes: string[] = [];
  if (data.transport_cambro) transportTypes.push("Cambro insulated boxes");
  if (data.transport_refrigerated_truck) transportTypes.push("Refrigerated truck");
  if (data.transport_coolers) transportTypes.push("Coolers");
  if (data.transport_other) transportTypes.push(data.transport_other);
  drawText(12, transportTypes.join(", "), 54, 300, 9);

  // D.2 Delivery method
  drawCheck(12, 230, 228, data.delivery_method === "pick-up");
  drawCheck(12, 303, 228, data.delivery_method === "delivery");
  drawCheck(12, 380, 228, data.delivery_method === "on-site");

  // Initials
  drawText(12, initials, 42, 182, 10);
  drawText(12, initials, 42, 153, 10);
  drawText(12, initials, 42, 112, 10);

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 14 (index 13) — Remaining Initials & Signature
  // ══════════════════════════════════════════════════════════════════════════
  drawText(13, initials, 42, 764, 10);
  drawText(13, initials, 42, 735, 10);
  drawText(13, initials, 42, 706, 10);
  drawText(13, initials, 42, 689, 10);
  drawText(13, initials, 42, 660, 10);
  drawText(13, initials, 42, 637, 10);

  drawText(13, ownerOrAgent, 36, 500);
  drawText(13, ownerOrAgent, 234, 500);
  drawText(13, todayFormatted(), 432, 500);

  // ── save ───────────────────────────────────────────────────────────────────
  const savedBytes = await doc.save();
  const outPath = "/tmp/test-permit-filled.pdf";
  writeFileSync(outPath, savedBytes);
  console.log(`✅ Test PDF written to: ${outPath}`);
  console.log(`   Open with: open ${outPath}`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
