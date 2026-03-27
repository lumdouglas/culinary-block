// Client-side PDF generation: pdf-lib runs in the browser, no Node.js APIs needed.
// The blank DEH form is fetched from /assets/catering-packet-2025-08-25.pdf.
// Coordinates were derived from pymupdf text extraction of every label position.
import type { CateringPermitData } from "./catering-permit";

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

// Minimal shape of the PDFLib global we use when loaded from CDN.
interface PdfLibModule {
  PDFDocument: {
    load(bytes: Uint8Array): Promise<{
      getPages(): Array<{
        drawText(text: string, options: any): void;
      }>;
      save(): Promise<Uint8Array>;
      embedFont(font: any): Promise<any>;
    }>;
  };
  StandardFonts: {
    Helvetica: any;
  };
  rgb(r: number, g: number, b: number): any;
}

async function loadPdfLibFromCdn(): Promise<PdfLibModule> {
  if (typeof window === "undefined") {
    throw new Error("PDF generation is browser-only");
  }

  const globalAny = window as unknown as { PDFLib?: PdfLibModule };

  if (globalAny.PDFLib) {
    return globalAny.PDFLib;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load pdf-lib from CDN"));
    document.head.appendChild(script);
  });

  if (!globalAny.PDFLib) {
    throw new Error("pdf-lib global did not initialize");
  }

  return globalAny.PDFLib;
}

/**
 * Word-wrap a long string into lines that fit a given character width.
 * Returns an array of lines.
 */
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

/**
 * Parse AI-generated procedure text into 6 labelled steps.
 * The AI typically generates lines starting with step keywords like
 * "Storage:", "Preparation:", "Cooking:", "Cooling:", "Reheating:", "Delivery:"
 */
function parseProcedureSteps(text: string): Record<string, string> {
  const steps: Record<string, string> = {
    storage: "",
    preparation: "",
    cooking: "",
    cooling: "",
    reheating: "",
    delivery: "",
  };

  // Try to split by labelled sections
  const patterns: [string, RegExp][] = [
    ["storage", /(?:step\s*1|storage)[:\s-]+/i],
    ["preparation", /(?:step\s*2|preparation|prep)[:\s-]+/i],
    ["cooking", /(?:step\s*3|cooking|cook)[:\s-]+/i],
    ["cooling", /(?:step\s*4|cooling|cool)[:\s-]+/i],
    ["reheating", /(?:step\s*5|reheating|reheat)[:\s-]+/i],
    ["delivery", /(?:step\s*6|delivery|deliver)[:\s-]+/i],
  ];

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let currentStep = "";
  for (const line of lines) {
    let matched = false;
    for (const [key, regex] of patterns) {
      if (regex.test(line)) {
        currentStep = key;
        // Extract the text after the label
        const afterLabel = line.replace(regex, "").trim();
        if (afterLabel) {
          steps[currentStep] = (steps[currentStep] ? steps[currentStep] + " " : "") + afterLabel;
        }
        matched = true;
        break;
      }
    }
    if (!matched && currentStep) {
      steps[currentStep] = (steps[currentStep] ? steps[currentStep] + " " : "") + line;
    }
  }

  // If no steps were parsed, dump everything into preparation
  if (!currentStep) {
    steps.preparation = text;
  }

  return steps;
}

export async function generatePermitPdf(
  data: CateringPermitData
): Promise<Uint8Array> {
  const PDFLib = await loadPdfLibFromCdn();
  const { PDFDocument, StandardFonts, rgb } = PDFLib;

  const res = await fetch("/assets/catering-packet-2025-08-25.pdf");
  if (!res.ok) throw new Error("Could not load blank permit PDF");
  const pdfBytes = new Uint8Array(await res.arrayBuffer());

  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const color = rgb(0.1, 0.1, 0.4); // Dark blue pen color

  const drawText = (
    pageIdx: number,
    text: string,
    x: number,
    y: number,
    size = 10
  ) => {
    if (!text) return;
    pages[pageIdx].drawText(text, { x, y, size, font, color });
  };
  const drawCheck = (
    pageIdx: number,
    x: number,
    y: number,
    checked: boolean
  ) => {
    if (!checked) return;
    pages[pageIdx].drawText("X", { x, y, size: 12, font, color });
  };

  const ownerOrAgent = data.signature_name || data.owner_name;
  const initials = getInitials(ownerOrAgent);

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 2 (index 1) — Permit Application & Certification Statement
  // ════════════════════════════════════════════════════════════════════════════
  // All y values derived from pymupdf label extraction (bottom-up origin).
  //
  //   "Owner Name:"     label at y=706  → value field right of label
  //   "Address:"        label at y=681  → value field right of label
  //   "City: / ST: / Zip:" on same row y=681
  //   "Phone: / Email:" label at y=665
  //   "Facility Name (dba):" at y=594
  //   Facility "Address:" at y=578
  //   "Owner" billing checkbox at y=489
  //   "Signature:" at y=328, "Print Name:" at y=311

  // Owner Information
  drawText(1, data.owner_name, 120, 706);
  drawText(1, data.owner_address, 80, 681);
  drawText(1, data.owner_city, 340, 681);
  drawText(1, data.owner_state || "CA", 492, 681);
  drawText(1, data.owner_zip, 550, 681);
  drawText(1, data.owner_phone, 70, 665);
  drawText(1, data.owner_email, 275, 665);

  // Facility Information
  drawText(1, data.catering_dba, 155, 594);
  drawText(1, data.pff_address, 80, 578);

  // Parse city and zip from the combined PFF address string
  const pffCity = data.pff_address?.match(/,\s*([^,]+),/)?.[1]?.trim() || "San Jose";
  const pffZip = data.pff_address?.match(/\b(\d{5})\b/)?.[1] || "95133";
  drawText(1, pffCity, 340, 578);
  drawText(1, pffZip, 550, 578);
  drawText(1, data.owner_phone, 70, 563);
  drawText(1, data.owner_email, 275, 563);

  // Previous permit info (above the billing section)
  if (data.has_previous_permit) {
    drawCheck(1, 55, 649, true); // "Yes" checkbox
    drawText(1, data.previous_facility_id, 310, 635, 9);
    drawText(1, data.previous_facility_name, 440, 635, 9);
  } else if (data.has_previous_permit === false) {
    drawCheck(1, 110, 649, true); // "No" checkbox
  }

  // Billing — check "Owner"
  drawCheck(1, 24, 489, true);

  // Signature block (on page 2, NOT page 3)
  drawText(1, ownerOrAgent, 90, 328);
  drawText(1, todayFormatted(), 430, 328);
  drawText(1, ownerOrAgent, 100, 311);
  drawText(1, data.owner_phone, 440, 311);

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 5 (index 4) — Rental Kitchen Agreement
  // ════════════════════════════════════════════════════════════════════════════
  //   "Owner Name:" at y=675, "Name of Business:" at x=272, y=675
  //   "Owner Address:" at y=659, "City:" x=272, "State:" x=437, "Zip:" x=497
  //   "Email Address:" at y=642, "Telephone:" at x=271
  //   "Name of the rental kitchen:" at y=609, "Address:" at x=320
  //   Day labels at y=578: Mon(42), Tues(128), Wed(214), Thurs(295), Fri(376), Sat(448), Sun(520)
  //   Initial labels at y = 542, 530, 518, 506, 494, 482
  //   "Print Name" at y=387

  // Applicant Information
  drawText(4, data.owner_name, 115, 675);
  drawText(4, data.catering_dba, 380, 675);
  drawText(4, data.owner_address, 120, 659);
  drawText(4, data.owner_city, 300, 659);
  drawText(4, data.owner_state || "CA", 470, 659);
  drawText(4, data.owner_zip, 520, 659);
  drawText(4, data.owner_email, 120, 642);
  drawText(4, data.owner_phone, 330, 642);

  // Rental kitchen
  drawText(4, data.pff_name, 185, 609);
  drawText(4, data.pff_address, 365, 609);

  // Operating days checkboxes — small boxes appear left of each day label
  const days = data.operating_days || [];
  const dayStr = days.join(" ").toLowerCase();
  drawCheck(4, 32, 578, dayStr.includes("mon"));
  drawCheck(4, 117, 578, dayStr.includes("tue"));
  drawCheck(4, 203, 578, dayStr.includes("wed"));
  drawCheck(4, 284, 578, dayStr.includes("thu"));
  drawCheck(4, 365, 578, dayStr.includes("fri"));
  drawCheck(4, 437, 578, dayStr.includes("sat"));
  drawCheck(4, 510, 578, dayStr.includes("sun"));

  // Operating times (written below the days row)
  drawText(4, data.operating_times || "", 60, 560, 9);

  // Rental kitchen initials (6 lines at y = 542, 530, 518, 506, 494, 482)
  if (data.agreement_initialed && initials) {
    const rkInitialYs = [542, 530, 518, 506, 494, 482];
    for (const y of rkInitialYs) {
      drawText(4, initials, 42, y, 9);
    }
  }

  // Applicant signature area (above the "Print Name / Signature / Date" label)
  drawText(4, ownerOrAgent, 37, 400, 10);
  drawText(4, todayFormatted(), 457, 400, 10);

  // ── APPROVED RENTAL FACILITY INFORMATION (bottom half of page 5) ──
  // "Type of Facility:" at y=350.7 — checkboxes: Commercial Kitchen(x=136), Restaurant(x=261), Bakery(x=350)
  drawCheck(4, 124, 351, true); // Always "Commercial Kitchen" for Culinary Block

  // "Facility name:" at y=311.9
  drawText(4, data.pff_name || "Culinary Block", 120, 312);

  // "Facility Address:" at y=295.2, "City:" x=271, "State:" x=375, "Zip:" x=435
  drawText(4, "1901 Las Plumas Ave", 130, 295);
  drawText(4, "San Jose", 300, 295);
  drawText(4, "CA", 410, 295);
  drawText(4, "95133", 460, 295);

  // Facility "Email Address:" at y=278.5, "Telephone:" x=271
  drawText(4, "culinaryblockcatering@gmail.com", 120, 279);
  drawText(4, "4156994397", 330, 279);

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 6 (index 5) — WOPS Section A: Business Plan
  // ════════════════════════════════════════════════════════════════════════════
  //   Boxed info section:
  //     "Name of Business:" at y=569
  //     "Owner Name:" at y=552, "Phone:" at x=423
  //     "Owner Email:" at y=534
  //     "Rental Kitchen Name:" at y=517
  //     "Rental Kitchen Address:" at y=500
  //     "City:" at y=482, "State:" at x=288, "Zip:" at x=423
  //
  //   Section A questions:
  //     Q1 customers: "Corporate" x=67 y=394, "Individual" x=195, "Private" x=303, "Other" y=377
  //     Q2 orders: "Phone" x=67 y=342, "Internet" x=193, "Walk-in" x=303
  //     Q3 days: M/T/W y=290, Thurs/F/Sat y=265, Su y=239
  //     Q4 employees: y=188

  // Info box
  drawText(5, data.catering_dba, 150, 569);
  drawText(5, data.owner_name, 120, 552);
  drawText(5, data.owner_phone, 460, 552);
  drawText(5, data.owner_email, 120, 534);
  drawText(5, data.pff_name, 165, 517);
  drawText(5, data.pff_address, 175, 500);
  drawText(5, data.pff_county || "", 65, 482);
  drawText(5, "CA", 325, 482);
  drawText(5, "", 450, 482); // zip if separate

  // Q1: Target customers
  const cust = data.customer_types || [];
  const custStr = cust.join(" ").toLowerCase();
  drawCheck(5, 55, 395, custStr.includes("corporate"));
  drawCheck(5, 183, 395, custStr.includes("individual"));
  drawCheck(
    5,
    291,
    395,
    custStr.includes("event") ||
      custStr.includes("party") ||
      custStr.includes("private")
  );
  const isOtherCust =
    !custStr.includes("corporate") &&
    !custStr.includes("individual") &&
    !custStr.includes("event") &&
    !custStr.includes("party") &&
    !custStr.includes("private") &&
    cust.length > 0;
  drawCheck(5, 55, 377, isOtherCust);
  if (isOtherCust) drawText(5, cust.join(", "), 100, 377);

  // Q2: Order methods
  const ord = data.order_methods || [];
  const ordStr = ord.join(" ").toLowerCase();
  drawCheck(5, 55, 342, ordStr.includes("phone"));
  drawCheck(
    5,
    181,
    342,
    ordStr.includes("internet") ||
      ordStr.includes("web") ||
      ordStr.includes("online")
  );
  drawCheck(5, 291, 342, ordStr.includes("walk"));

  // Q3: Operating days (3 rows of day checkboxes)
  const opDays = data.operating_days || [];
  const opDayStr = opDays.join(" ").toLowerCase();
  // Row 1: M, T, W at y=290
  drawCheck(5, 57, 290, opDayStr.includes("mon"));
  drawCheck(5, 233, 290, opDayStr.includes("tue"));
  drawCheck(5, 392, 290, opDayStr.includes("wed"));
  // Row 2: Thurs, F, Sat at y=265
  drawCheck(5, 57, 265, opDayStr.includes("thu"));
  drawCheck(5, 233, 265, opDayStr.includes("fri"));
  drawCheck(5, 395, 265, opDayStr.includes("sat"));
  // Row 3: Su at y=239
  drawCheck(5, 57, 239, opDayStr.includes("sun"));

  // Q4: Employee count
  drawText(5, (data.employee_count || 1).toString(), 310, 188);

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 7 (index 6) — WOPS Section B: Menu Items & Categories
  // ════════════════════════════════════════════════════════════════════════════
  //   Table: example row at y=688, first blank row at ~y=672, ~16pt spacing
  //   Food Item col at x=55, Ingredients col at x=170
  //   Section 2 "no cook" header y=460, items start y≈440
  //   Section 3 "cook-to-serve" header y=328, items start y≈308
  //   Section 4 "complex" header y=189, items start y≈170

  // B.1 Menu items table
  const TABLE_START_Y = 672;
  const TABLE_ROW_H = 16;
  data.menu_items.slice(0, 15).forEach((item, i) => {
    const y = TABLE_START_Y - i * TABLE_ROW_H;
    if (y < 474) return; // Don't overlap section 2 header
    drawText(6, item.food, 55, y, 9);
    const ingr = item.ingredients || "";
    drawText(
      6,
      ingr.substring(0, 70) + (ingr.length > 70 ? "..." : ""),
      170,
      y,
      8
    );
  });

  // B.2 No-cook items
  let noCookY = 440;
  // B.3 Cook-to-serve items
  let cookY = 308;
  // B.4 Complex items
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

  // ════════════════════════════════════════════════════════════════════════════
  // PAGES 8-12 (indices 7-11) — WOPS Procedure Worksheets (one per menu item)
  // ════════════════════════════════════════════════════════════════════════════
  //   "Menu Item:" label at y=718 → item name at x=110, y=718
  //   Step boxes — labels on left (x=42), content on right (x=200):
  //     Step 1 Storage:    y=693 to y=630
  //     Step 2 Preparation: y=621 to y=520
  //     Step 3 Cooking:    y=510 to y=425
  //     Step 4 Cooling:    y=417 to y=312
  //     Step 5 Reheating:  y=304 to y=160
  //     Step 6 Delivery:   y=150 to y=65

  // Step areas for pages 8-11 (indices 7-10)
  const STEP_AREAS: { key: string; startY: number; endY: number }[] = [
    { key: "storage", startY: 693, endY: 635 },
    { key: "preparation", startY: 621, endY: 520 },
    { key: "cooking", startY: 510, endY: 425 },
    { key: "cooling", startY: 417, endY: 315 },
    { key: "reheating", startY: 304, endY: 160 },
    { key: "delivery", startY: 150, endY: 65 },
  ];
  // Page 12 (index 11) has different y positions — Step 1 starts higher at y=740
  // and the page ends with ingredient source checkboxes at ~y=130
  const STEP_AREAS_PAGE12: { key: string; startY: number; endY: number }[] = [
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
  const STEP_MAX_CHARS = 55; // ~55 chars fit in x=200..575 at 8pt

  const procPages = [7, 8, 9, 10, 11];
  const itemsWithProcs = data.menu_items.filter(
    (i) => i.procedures && i.procedures.length > 10
  );
  itemsWithProcs.slice(0, 5).forEach((item, i) => {
    const pageIdx = procPages[i];
    const areas = pageIdx === 11 ? STEP_AREAS_PAGE12 : STEP_AREAS;

    // Menu item name
    drawText(pageIdx, item.food, 110, 718, 11);

    // Parse procedure text into 6 steps
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

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 12 (index 11) — Section 6: Ingredient Purchase Sources
  // ════════════════════════════════════════════════════════════════════════════
  //   Checkboxes at bottom of page 12:
  //     Row 1 y=120: Restaurant Depot(x=69), Costco(x=265), Cash and Carry(x=447)
  //     Row 2 y=102: Smart and Final(x=69), Local grocery store(x=267)
  //     Row 3 y=85:  Online ingredients(x=69), Farmers Markets(x=265)
  //     Row 4 y=68:  List any other(x=69)
  const sources = (data.ingredient_sources || []).join(" ").toLowerCase();
  drawCheck(11, 57, 120, sources.includes("restaurant depot"));
  drawCheck(11, 253, 120, sources.includes("costco"));
  drawCheck(11, 435, 120, sources.includes("cash and carry") || sources.includes("cash & carry"));
  drawCheck(11, 57, 102, sources.includes("smart and final") || sources.includes("smart & final"));
  drawCheck(11, 255, 102, sources.includes("local") || sources.includes("grocery"));
  drawCheck(11, 57, 85, sources.includes("online") || sources.includes("amazon"));
  drawCheck(11, 253, 85, sources.includes("farmer") || sources.includes("market"));

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 13 (index 12) — Section 10: Kitchen Storage & Section C & D
  // ════════════════════════════════════════════════════════════════════════════
  //   Section 10: Storage locations table
  //     "Cooking equipment" row at y=607, "Location" column at x≈246
  //     "Dry ingredients" row at y=589
  //     "Dairy/meat/veg" row at y=571
  drawText(12, data.storage_cooking_equipment, 246, 607, 9);
  drawText(12, data.storage_dry_ingredients, 246, 589, 9);
  drawText(12, data.storage_dairy_meat_veg, 246, 571, 9);

  //   C.1 Sanitize method:
  //     "Manual sanitize" at y=505, x=69 → checkbox x≈57
  //     "Chemical dishwasher" at y=505, x=395 → checkbox x≈383
  //     "High-temperature dishwasher" at y=488, x=69 → checkbox x≈57
  //   C.2 Sanitizer chemical:
  //     chlorine at y=412 → checkbox x≈56
  //     quat at y=395 → checkbox x≈56
  //     iodine at y=377 → checkbox x≈57
  //   D.1 Transport equipment text area: ~y=300
  //   D.2 Delivery method at y=228:
  //     "Pick up only" x=242 → checkbox x≈230
  //     "Delivery only" x=316 → checkbox x≈303
  //     "Served on site" x=392 → checkbox x≈380
  //   Initials (3 on this page): y = 182, 153, 112

  // C.1 Sanitize method
  const sm = data.sanitize_method;
  drawCheck(12, 57, 505, sm === "manual");
  drawCheck(12, 383, 505, sm === "chemical-dw");
  drawCheck(12, 57, 488, sm === "high-temp-dw");

  // C.2 Sanitizer chemicals
  drawCheck(12, 56, 412, data.sanitizer_chlorine);
  drawCheck(12, 56, 395, data.sanitizer_quat);
  drawCheck(12, 57, 377, data.sanitizer_iodine);

  // D.1 Transport equipment description
  const transportTypes: string[] = [];
  if (data.transport_cambro) transportTypes.push("Cambro insulated boxes");
  if (data.transport_refrigerated_truck)
    transportTypes.push("Refrigerated truck");
  if (data.transport_coolers) transportTypes.push("Coolers");
  if (data.transport_other) transportTypes.push(data.transport_other);
  drawText(12, transportTypes.join(", "), 54, 300, 9);

  // D.2 Delivery method
  const dm = data.delivery_method;
  drawCheck(12, 230, 228, dm === "pick-up");
  drawCheck(12, 303, 228, dm === "delivery");
  drawCheck(12, 380, 228, dm === "on-site");

  // Initials on page 13 (3 statements)
  if (data.agreement_initialed && initials) {
    drawText(12, initials, 42, 182, 10);
    drawText(12, initials, 42, 153, 10);
    drawText(12, initials, 42, 112, 10);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 14 (index 13) — WOPS Section E: Remaining Initials & Signature
  // ════════════════════════════════════════════════════════════════════════════
  //   Statements continue from page 13:
  //     Statement 4: y=764   Statement 5: y=735   Statement 6: y=706
  //     Statement 7: y=689   Statement 8: y=660   Statement 9: y=637
  //   Signature labels at y=488:
  //     "Owner/Authorized Agent Signature" x=36
  //     "Print Name" x=234
  //     "Date" x=432

  if (data.agreement_initialed && initials) {
    drawText(13, initials, 42, 764, 10);
    drawText(13, initials, 42, 735, 10);
    drawText(13, initials, 42, 706, 10);
    drawText(13, initials, 42, 689, 10);
    drawText(13, initials, 42, 660, 10);
    drawText(13, initials, 42, 637, 10);
  }

  // Signature (above the label line at y=488)
  drawText(13, ownerOrAgent, 36, 500);
  drawText(13, ownerOrAgent, 234, 500);
  drawText(13, todayFormatted(), 432, 500);

  const saved = await doc.save();
  return new Uint8Array(saved);
}
