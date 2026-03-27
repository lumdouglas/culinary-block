// Client-side PDF generation: pdf-lib runs in the browser, no Node.js APIs needed.
// The blank DEH form is fetched from /assets/catering-packet-2025-08-25.pdf.
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
    script.onerror = () => reject(new Error("Failed to load pdf-lib from CDN"));
    document.head.appendChild(script);
  });

  if (!globalAny.PDFLib) {
    throw new Error("pdf-lib global did not initialize");
  }

  return globalAny.PDFLib;
}

export async function generatePermitPdf(data: CateringPermitData): Promise<Uint8Array> {
  const PDFLib = await loadPdfLibFromCdn();
  const { PDFDocument, StandardFonts, rgb } = PDFLib;

  const res = await fetch("/assets/catering-packet-2025-08-25.pdf");
  if (!res.ok) throw new Error("Could not load blank permit PDF");
  const pdfBytes = new Uint8Array(await res.arrayBuffer());

  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const color = rgb(0.1, 0.1, 0.4); // Dark blue pen color

  const drawText = (pageIdx: number, text: string, x: number, y: number, size = 10) => {
    if (!text) return;
    pages[pageIdx].drawText(text, { x, y, size, font, color });
  };
  const drawCheck = (pageIdx: number, x: number, y: number, checked: boolean) => {
    if (!checked) return;
    pages[pageIdx].drawText("X", { x, y, size: 12, font, color });
  };

  // ── Page 2: Permit Application Page 1 ───────────────────────────────────────────
  drawText(1, data.owner_name, 120, 680);
  drawText(1, data.owner_address, 100, 642);
  drawText(1, data.owner_city, 100, 608);
  drawText(1, data.owner_state || "CA", 430, 608);
  drawText(1, data.owner_zip, 480, 608);
  drawText(1, data.owner_phone, 120, 574);
  drawText(1, data.owner_email, 320, 574);

  drawText(1, data.catering_dba, 150, 470);
  drawText(1, data.pff_address, 100, 435);
  // PFF address is combined typically, let's just dump it in address
  drawText(1, data.pff_county, 100, 365);
  drawCheck(1, 40, 246, true); // Always check "Owner" for billing

  // ── Page 3: Permit Application Page 2 ───────────────────────────────────────────
  // Signature Block
  const ownerOrAgent = data.signature_name || data.owner_name;
  drawText(2, ownerOrAgent, 60, 115);
  drawText(2, data.owner_phone, 350, 115);
  drawText(2, todayFormatted(), 450, 60);

  // ── Page 5: Rental Kitchen Agreement ────────────────────────────────────────────
  drawText(4, data.owner_name, 110, 655);
  drawText(4, data.catering_dba, 450, 655);
  drawText(4, data.owner_address, 120, 630);
  drawText(4, data.owner_city, 370, 630);
  drawText(4, data.owner_state || "CA", 470, 630);
  drawText(4, data.owner_zip, 520, 630);
  drawText(4, data.owner_email, 110, 605);
  drawText(4, data.owner_phone, 350, 605);

  drawText(4, data.pff_name, 180, 560);
  drawText(4, data.pff_address, 360, 560);

  // Operating days checkboxes (M-Su)
  const days = data.operating_days || [];
  const dayStr = days.join(" ").toLowerCase();
  drawCheck(4, 98, 568, dayStr.includes("mon"));
  drawCheck(4, 137, 568, dayStr.includes("tue"));
  drawCheck(4, 187, 568, dayStr.includes("wed"));
  drawCheck(4, 230, 568, dayStr.includes("thu"));
  drawCheck(4, 280, 568, dayStr.includes("fri"));
  drawCheck(4, 323, 568, dayStr.includes("sat"));
  drawCheck(4, 360, 568, dayStr.includes("sun"));
  drawText(4, data.operating_times || "", 60, 555);

  const initials = getInitials(ownerOrAgent);
  if (data.agreement_initialed && initials) {
    drawText(4, initials, 50, 532, 12);
    drawText(4, initials, 50, 517, 12);
    drawText(4, initials, 50, 502, 12);
    drawText(4, initials, 50, 487, 12);
    drawText(4, initials, 50, 472, 12);
    drawText(4, initials, 50, 458, 12);
  }

  // ── Page 6: WOPS Section A ──────────────────────────────────────────────────────
  drawText(5, data.catering_dba, 240, 642);
  drawText(5, data.owner_name, 150, 622);
  drawText(5, data.owner_phone, 410, 622);
  drawText(5, data.owner_email, 150, 602);
  drawText(5, data.pff_name, 210, 560);
  drawText(5, data.pff_address, 220, 540); // Address row 1

  // Target Customers
  const cust = data.customer_types || [];
  const custStr = cust.join(" ").toLowerCase();
  drawCheck(5, 76, 474, custStr.includes("corporate"));
  drawCheck(5, 76, 460, custStr.includes("event") || custStr.includes("party"));
  drawCheck(5, 230, 474, custStr.includes("individual"));
  const isOtherCust = !custStr.includes("corporate") && !custStr.includes("event") && !custStr.includes("party") && !custStr.includes("individual") && cust.length > 0;
  drawCheck(5, 230, 460, isOtherCust);
  if (isOtherCust) drawText(5, cust.join(", "), 270, 460);

  // Order received by
  const ord = data.order_methods || [];
  const ordStr = ord.join(" ").toLowerCase();
  drawCheck(5, 76, 405, ordStr.includes("phone"));
  drawCheck(5, 203, 405, ordStr.includes("internet") || ordStr.includes("web") || ordStr.includes("online"));

  drawText(5, (data.employee_count || 1).toString(), 310, 290);

  // ── Page 7: WOPS Section B.1 to B.4 (Menu Items) ────────────────────────────────
  let b1Y = 560;
  let noCookY = 222;
  let cookToServeY = 150;
  let complexY = 72;

  data.menu_items.slice(0, 10).forEach((item, i) => {
    // Table
    drawText(6, item.food, 80, b1Y - (i * 25));
    // Ingredients text can be long, so we take a substring
    const ingr = item.ingredients || "";
    drawText(6, ingr.substring(0, 65) + (ingr.length > 65 ? "..." : ""), 300, b1Y - (i * 25), 8);

    // Categorize
    if (item.category === "no-cook" && noCookY > 180) {
      drawText(6, item.food, 80, noCookY);
      noCookY -= 15;
    } else if (item.category === "cook-to-serve" && cookToServeY > 100) {
      drawText(6, item.food, 80, cookToServeY);
      cookToServeY -= 15;
    } else if (item.category === "complex" && complexY > 30) {
      drawText(6, item.food, 80, complexY);
      complexY -= 15;
    }
  });

  // ── Pages 8-12: WOPS Procedures per Item ────────────────────────────────────────
  // The original packet gave us 4 blank procedure pages (Indices 7, 8, 9, 10, 11)
  const procPages = [7, 8, 9, 10, 11];
  const itemsWithProcs = data.menu_items.filter(i => i.procedures && i.procedures.length > 10);
  itemsWithProcs.slice(0, 5).forEach((item, i) => {
    const pageIdx = procPages[i];
    drawText(pageIdx, item.food, 150, 680, 12);
    // Break the "procedures" text block into chunks manually if needed, or just dump it into Prep if unspecified
    // Since we don't know the exact 6 step split from the single string, we will approximate or put it all in Prep.
    // The instructions tell the AI to formulate 6 steps. 
    // For now we will just put the whole text block in the Prep area, word-wrapped if possible.
    // Or we split by newlines and print a few lines starting at the Prep box.
    const lines = item.procedures.split("\n");
    let y = 520; // Start at prep
    lines.slice(0, 15).forEach(line => {
      // Super basic wrapping hack
      const str = line.substring(0, 100);
      drawText(pageIdx, str, 100, y, 9);
      y -= 12;
    });
  });

  // ── Page 13: WOPS Section C & D ─────────────────────────────────────────────────
  // Sanitize Method
  const sm = data.sanitize_method;
  drawCheck(12, 102, 575, sm === "manual");
  drawCheck(12, 102, 546, sm === "chemical-dw");
  drawCheck(12, 102, 532, sm === "high-temp-dw");

  drawCheck(12, 102, 517, data.sanitizer_chlorine);
  drawCheck(12, 102, 502, data.sanitizer_quat);
  drawCheck(12, 102, 487, data.sanitizer_iodine);

  // Delivery Method & Transport
  const dm = data.delivery_method;
  drawCheck(12, 98, 253, dm === "pick-up");
  drawCheck(12, 98, 224, dm === "delivery");
  drawCheck(12, 98, 209, dm === "on-site");

  const transportTypes = [];
  if (data.transport_cambro) transportTypes.push("Cambro insulated boxes");
  if (data.transport_refrigerated_truck) transportTypes.push("Refrigerated Truck");
  if (data.transport_coolers) transportTypes.push("Coolers");
  if (data.transport_other) transportTypes.push(data.transport_other);
  drawText(12, transportTypes.join(", "), 100, 312);

  if (data.agreement_initialed && initials) {
    drawText(12, initials, 300, 155, 12);
    drawText(12, initials, 300, 125, 12);
    drawText(12, initials, 300, 95, 12);
    drawText(12, initials, 300, 70, 12);
    drawText(12, initials, 300, 40, 12);
  }

  // ── Page 14: WOPS Section E (Initials & Sig) ────────────────────────────────────
  if (data.agreement_initialed && initials) {
    drawText(13, initials, 300, 672, 12);
    drawText(13, initials, 300, 650, 12);
    drawText(13, initials, 300, 620, 12);
    drawText(13, initials, 300, 590, 12);
  }

  drawText(13, ownerOrAgent, 50, 490);
  drawText(13, todayFormatted(), 450, 490);

  const saved = await doc.save();
  return new Uint8Array(saved);
}
