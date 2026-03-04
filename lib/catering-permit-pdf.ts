import { PDFDocument } from "pdf-lib";
import { readFileSync } from "fs";
import { join } from "path";
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

// Exact AcroForm field names from the Santa Clara DEH Catering Application PDF (8.27.2025)
const INITIAL_FIELD_NAMES: Record<number, string> = {
  1: "Initial1 All food prior to the host facility shall be stored and prepared at the permanent food facilitycatering kitchen Home preparation of food is prohibited",
  2: "Initial2 The Catering Operation shall conduct only limited food preparation as defined by CRFC section 113818",
  3: "Initial3 A catering operation may only operate for up to 4 hours in any one 12hour period unless otherwise approved by the enforcement agency",
  4: "Initial4 The Catering Operation shall post a sign with the name of the catering operation name of the operator permanent food facility address and the hours of operation at the Host Facility The most recent inspection report shall be made available to any consumer or enforcement agency upon request",
  5: "Initial5 Catering Operations records shall be maintained and kept for 90 days after the event that includes location date time customer contact information menu and food transportation temperature logs",
  6: "Initial6 Provide copies of food handler cards and food safety certification upon request at the Host Facility",
  7: "Initial7 Potentially hazardous foods PHFs shall be discarded at the end of the catering event unless PHFs was held at required temperature and protected from contamination at all times If Time is used as a Public Health Control TPHC and approved prior by the enforcement agency all food shall be discarded at the end of food service",
  8: "Initial8 Food will be discarded when it has been contaminated or was subject to improper holdingcooking temperatures",
  9: "Initial9 Food and utensils shall be protected from contamination at all times",
  10: "Initial10 Contaminated utensils shall be replaced with an adequate supply of clean utensils",
  11: "Initial11 Consumers shall use a clean plate if returning to the selfservice line",
  12: "Initial12 Utensils and equipment are certified or ANSI equivalent",
  13: "Initial13 The interior of the vehicle used to transport food shall be constructed of smooth visible impervious material and maintained clean and free from debris",
  14: "Initial14 Potable water is available and an adequate supply is provided at the catering operation",
  15: "Initial15 A handwashing sink shall be unobstructed and supplied with warm water soap and paper towels and is located within the food service area",
  16: "Initial16 Restrooms are available within 200 feet of the food service area",
  17: "Initial17 Garbage and refuse are disposed of in an approved manner",
  18: "Initial18 Liquid waste are disposed of in an approved plumbing system",
  19: "Initial19 Food beverages equipment and utensils are not stored in a private home",
  20: "Initial20 Overhead protection shall be provided at the food service area",
};

export async function generatePermitPdf(data: CateringPermitData): Promise<Uint8Array> {
  const pdfPath = join(process.cwd(), "public/assets/catering-permit-blank.pdf");
  const pdfBytes = readFileSync(pdfPath);
  const doc = await PDFDocument.load(pdfBytes);
  const form = doc.getForm();

  const tf = (name: string, value: string) => {
    try {
      form.getTextField(name).setText(value || "");
    } catch {
      // Field may not exist or be read-only; skip silently
    }
  };

  const cb = (name: string, checked: boolean) => {
    try {
      const field = form.getCheckBox(name);
      if (checked) field.check();
      else field.uncheck();
    } catch {
      // skip
    }
  };

  const radio = (name: string, value: string) => {
    try {
      form.getRadioGroup(name).select(value);
    } catch {
      // skip
    }
  };

  // ── Page 1: Contact Information ────────────────────────────────────────────
  tf("Name of Catering Operation DBA", data.catering_dba);
  tf("Owner Name", data.owner_name);
  tf("Owner Phone Number", data.owner_phone);
  tf("Owner Email", data.owner_email);
  tf("Name", data.pff_name);
  tf("Address", data.pff_address);
  tf("County", data.pff_county);

  // ── Page 2: Menu Items (up to 15 rows) ────────────────────────────────────
  const maxItems = Math.min(data.menu_items.length, 15);
  for (let i = 0; i < maxItems; i++) {
    tf(`Food Item ${i + 1}`, data.menu_items[i].food);
    tf(`Food Item ${i + 1}P`, data.menu_items[i].procedures);
  }

  // ── Page 3, Q2a: Food Transport ────────────────────────────────────────────
  cb("Cambro", data.transport_cambro);
  cb("Refrigerated Truck", data.transport_refrigerated_truck);
  cb("Coolers", data.transport_coolers);
  const hasOtherTransport = Boolean(data.transport_other?.trim());
  cb("Other temperature log will be required", hasOtherTransport);
  tf("undefined", data.transport_other ?? ""); // text field for "Other" transport description

  // ── Page 3, Q2b: Temperature Maintenance ──────────────────────────────────
  cb("Temperature control 135F or above OR 41F or below", data.temp_control);
  tf("Equipment", data.temp_equipment ?? "");
  cb(
    "Time TPHC Time as a Public Health Control Written procedures are required for TPHC",
    data.tphc
  );
  tf("Equipment time logs timers stickers etc", data.tphc_equipment ?? "");

  // ── Page 3, Q3: Handwashing ────────────────────────────────────────────────
  cb("Portable Handwash", data.handwash_portable);
  cb("Host Facility handwashing sink", data.handwash_host);

  // ── Page 3, Q4a: Sanitizing Location ──────────────────────────────────────
  cb("Host Facility", data.sanitize_at_host);
  cb("Permanent Food Facility", data.sanitize_at_pff);
  radio(
    "Does the Host Facility have a 3-compartment ware washing sink",
    data.host_3_compartment ? "Yes" : "No"
  );
  radio(
    "Will extra supplies utensilsequipment be brought into Host Facility",
    data.extra_supplies_brought ? "Yes" : "No"
  );

  // ── Page 3, Q4b: Sanitizer Type ───────────────────────────────────────────
  cb(
    "Contact with a solution of 100 parts per million ppm available chlorine for at least 30 sec",
    data.sanitizer_chlorine
  );
  cb(
    "Contact with a solution of 200 ppm of available quaternary ammonia for at least 1 min",
    data.sanitizer_quat
  );
  cb(
    "Contact with a solution of 25 ppm available iodine for at least 1 min",
    data.sanitizer_iodine
  );

  // ── Page 3, Q5: Refuse Disposal ───────────────────────────────────────────
  cb("At permanent food facility", data.refuse_at_pff);
  cb("At Host Facility", data.refuse_at_host);

  // ── Page 3, Q6: Host Facility Locations (up to 5 rows) ────────────────────
  const maxFacilities = Math.min(data.host_facilities.length, 5);
  for (let i = 0; i < maxFacilities; i++) {
    tf(`Host Facility NameRow${i + 1}`, data.host_facilities[i].name);
    tf(`Street AddressRow${i + 1}`, data.host_facilities[i].street);
    tf(`CityRow${i + 1}`, data.host_facilities[i].city);
  }

  // ── Page 4: Agreement — 20 Initials ───────────────────────────────────────
  // Uses owner's initials (e.g., "Maria Garcia" → "MG")
  const initials = getInitials(data.signature_name || data.owner_name);
  if (data.agreement_initialed && initials) {
    for (let n = 1; n <= 20; n++) {
      const fieldName = INITIAL_FIELD_NAMES[n];
      if (fieldName) tf(fieldName, initials);
    }
  }

  // ── Page 4: Signature Block ────────────────────────────────────────────────
  // PDFSignature field ("Owner / Authorized Agent Signature") cannot be filled
  // programmatically — the applicant must sign the printed copy by hand.
  const printedNameTitle = data.signature_title
    ? `${data.signature_name} / ${data.signature_title}`
    : data.signature_name;
  tf("Printed Name  Title", printedNameTitle);
  tf("Date1_af_date", todayFormatted());

  // Flatten fields so the PDF looks clean and is ready to print
  form.flatten();

  const saved = await doc.save();
  return new Uint8Array(saved);
}
