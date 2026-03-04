import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePermitPdf } from "@/lib/catering-permit-pdf";
import {
  DEFAULT_PERMIT_DATA,
  menuItemSchema,
  hostFacilitySchema,
  type CateringPermitData,
} from "@/lib/catering-permit";

const permitBodySchema = z.object({
  catering_dba: z.string(),
  owner_name: z.string(),
  owner_phone: z.string(),
  owner_email: z.string(),
  pff_name: z.string(),
  pff_address: z.string(),
  pff_county: z.string(),
  menu_items: z.array(menuItemSchema),
  transport_cambro: z.boolean(),
  transport_refrigerated_truck: z.boolean(),
  transport_coolers: z.boolean(),
  transport_other: z.string(),
  temp_control: z.boolean(),
  temp_equipment: z.string(),
  tphc: z.boolean(),
  tphc_equipment: z.string(),
  handwash_portable: z.boolean(),
  handwash_host: z.boolean(),
  sanitize_at_host: z.boolean(),
  host_3_compartment: z.boolean(),
  sanitize_at_pff: z.boolean(),
  extra_supplies_brought: z.boolean(),
  sanitizer_chlorine: z.boolean(),
  sanitizer_quat: z.boolean(),
  sanitizer_iodine: z.boolean(),
  refuse_at_pff: z.boolean(),
  refuse_at_host: z.boolean(),
  host_facilities: z.array(hostFacilitySchema),
  agreement_initialed: z.boolean(),
  signature_name: z.string(),
  signature_title: z.string(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = permitBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid permit data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data: CateringPermitData = { ...DEFAULT_PERMIT_DATA, ...parsed.data };
    const pdfBytes = await generatePermitPdf(data);
    const body = new Uint8Array(pdfBytes.byteLength);
    body.set(pdfBytes);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="catering-permit-application.pdf"',
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
