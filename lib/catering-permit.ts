import * as z from "zod";

// --- Supported languages for the permit wizard ---
export const PERMIT_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
  { code: "vi", label: "Tiếng Việt" },
] as const;

export type PermitLanguageCode = (typeof PERMIT_LANGUAGES)[number]["code"];

// --- Menu item: food name + procedures at host facility ---
export const menuItemSchema = z.object({
  food: z.string(),
  procedures: z.string(),
  ingredients: z.string(),
  category: z.enum(["no-cook", "cook-to-serve", "complex", "unspecified"]),
});

// --- Host facility row ---
export const hostFacilitySchema = z.object({
  name: z.string(),
  street: z.string(),
  city: z.string(),
});

// --- Tool schema for AI: partial updates to permit data ---
export const updatePermitDataSchema = z.object({
  catering_dba: z.string().optional(),
  owner_name: z.string().optional(),
  owner_address: z.string().optional(),
  owner_city: z.string().optional(),
  owner_state: z.string().optional(),
  owner_zip: z.string().optional(),
  owner_phone: z.string().optional(),
  owner_email: z.string().optional(),
  pff_name: z.string().optional(),
  pff_address: z.string().optional(),
  pff_county: z.string().optional(),
  menu_items: z.array(menuItemSchema).optional(),
  delivery_method: z.enum(["pick-up", "delivery", "on-site", "unspecified"]).optional(),
  employee_count: z.number().optional(),
  operating_days: z.array(z.string()).optional(),
  operating_times: z.string().optional(),
  customer_types: z.array(z.string()).optional(),
  order_methods: z.array(z.string()).optional(),
  sanitize_method: z.enum(["manual", "chemical-dw", "high-temp-dw", "unspecified"]).optional(),
  ingredient_sources: z.array(z.string()).optional(),
  transport_cambro: z.boolean().optional(),
  transport_refrigerated_truck: z.boolean().optional(),
  transport_coolers: z.boolean().optional(),
  transport_other: z.string().optional(),
  temp_control: z.boolean().optional(),
  temp_equipment: z.string().optional(),
  tphc: z.boolean().optional(),
  tphc_equipment: z.string().optional(),
  handwash_portable: z.boolean().optional(),
  handwash_host: z.boolean().optional(),
  sanitize_at_host: z.boolean().optional(),
  host_3_compartment: z.boolean().optional(),
  sanitize_at_pff: z.boolean().optional(),
  extra_supplies_brought: z.boolean().optional(),
  sanitizer_chlorine: z.boolean().optional(),
  sanitizer_quat: z.boolean().optional(),
  sanitizer_iodine: z.boolean().optional(),
  refuse_at_pff: z.boolean().optional(),
  refuse_at_host: z.boolean().optional(),
  host_facilities: z.array(hostFacilitySchema).optional(),
  agreement_initialed: z.boolean().optional(),
  signature_name: z.string().optional(),
  signature_title: z.string().optional(),
});

export type MenuItem = z.infer<typeof menuItemSchema>;
export type HostFacility = z.infer<typeof hostFacilitySchema>;
export type UpdatePermitData = z.infer<typeof updatePermitDataSchema>;

export interface CateringPermitData {
  catering_dba: string;
  owner_name: string;
  owner_address: string;
  owner_city: string;
  owner_state: string;
  owner_zip: string;
  owner_phone: string;
  owner_email: string;
  pff_name: string;
  pff_address: string;
  pff_county: string;
  menu_items: MenuItem[];
  delivery_method: "pick-up" | "delivery" | "on-site" | "unspecified" | "";
  employee_count: number;
  operating_days: string[];
  operating_times: string;
  customer_types: string[];
  order_methods: string[];
  sanitize_method: "manual" | "chemical-dw" | "high-temp-dw" | "unspecified" | "";
  ingredient_sources: string[];
  transport_cambro: boolean;
  transport_refrigerated_truck: boolean;
  transport_coolers: boolean;
  transport_other: string;
  temp_control: boolean;
  temp_equipment: string;
  tphc: boolean;
  tphc_equipment: string;
  handwash_portable: boolean;
  handwash_host: boolean;
  sanitize_at_host: boolean;
  host_3_compartment: boolean;
  sanitize_at_pff: boolean;
  extra_supplies_brought: boolean;
  sanitizer_chlorine: boolean;
  sanitizer_quat: boolean;
  sanitizer_iodine: boolean;
  refuse_at_pff: boolean;
  refuse_at_host: boolean;
  host_facilities: HostFacility[];
  agreement_initialed: boolean;
  signature_name: string;
  signature_title: string;
}

export const DEFAULT_PERMIT_DATA: CateringPermitData = {
  catering_dba: "",
  owner_name: "",
  owner_address: "",
  owner_city: "",
  owner_state: "",
  owner_zip: "",
  owner_phone: "",
  owner_email: "",
  pff_name: "Culinary Block",
  pff_address: "1901 Las Plumas Ave, San Jose, CA 95133",
  pff_county: "Santa Clara",
  menu_items: [],
  delivery_method: "",
  employee_count: 0,
  operating_days: [],
  operating_times: "",
  customer_types: [],
  order_methods: [],
  sanitize_method: "",
  ingredient_sources: [],
  transport_cambro: false,
  transport_refrigerated_truck: false,
  transport_coolers: false,
  transport_other: "",
  temp_equipment: "",
  temp_control: false,
  tphc: false,
  tphc_equipment: "",
  handwash_portable: false,
  handwash_host: false,
  sanitize_at_host: false,
  host_3_compartment: false,
  sanitize_at_pff: false,
  extra_supplies_brought: false,
  sanitizer_chlorine: false,
  sanitizer_quat: false,
  sanitizer_iodine: false,
  refuse_at_pff: false,
  refuse_at_host: false,
  host_facilities: [],
  agreement_initialed: false,
  signature_name: "",
  signature_title: "",
};

export function mergePermitData(
  current: CateringPermitData,
  update: UpdatePermitData
): CateringPermitData {
  return {
    ...current,
    ...(update.catering_dba !== undefined && { catering_dba: update.catering_dba }),
    ...(update.owner_name !== undefined && { owner_name: update.owner_name }),
    ...(update.owner_address !== undefined && { owner_address: update.owner_address }),
    ...(update.owner_city !== undefined && { owner_city: update.owner_city }),
    ...(update.owner_state !== undefined && { owner_state: update.owner_state }),
    ...(update.owner_zip !== undefined && { owner_zip: update.owner_zip }),
    ...(update.owner_phone !== undefined && { owner_phone: update.owner_phone }),
    ...(update.owner_email !== undefined && { owner_email: update.owner_email }),
    ...(update.pff_name !== undefined && { pff_name: update.pff_name }),
    ...(update.pff_address !== undefined && { pff_address: update.pff_address }),
    ...(update.pff_county !== undefined && { pff_county: update.pff_county }),
    ...(update.menu_items !== undefined && { menu_items: update.menu_items }),
    ...(update.delivery_method !== undefined && { delivery_method: update.delivery_method }),
    ...(update.employee_count !== undefined && { employee_count: update.employee_count }),
    ...(update.operating_days !== undefined && { operating_days: update.operating_days }),
    ...(update.operating_times !== undefined && { operating_times: update.operating_times }),
    ...(update.customer_types !== undefined && { customer_types: update.customer_types }),
    ...(update.order_methods !== undefined && { order_methods: update.order_methods }),
    ...(update.sanitize_method !== undefined && { sanitize_method: update.sanitize_method }),
    ...(update.ingredient_sources !== undefined && { ingredient_sources: update.ingredient_sources }),
    ...(update.transport_cambro !== undefined && { transport_cambro: update.transport_cambro }),
    ...(update.transport_refrigerated_truck !== undefined && { transport_refrigerated_truck: update.transport_refrigerated_truck }),
    ...(update.transport_coolers !== undefined && { transport_coolers: update.transport_coolers }),
    ...(update.transport_other !== undefined && { transport_other: update.transport_other }),
    ...(update.temp_control !== undefined && { temp_control: update.temp_control }),
    ...(update.temp_equipment !== undefined && { temp_equipment: update.temp_equipment }),
    ...(update.tphc !== undefined && { tphc: update.tphc }),
    ...(update.tphc_equipment !== undefined && { tphc_equipment: update.tphc_equipment }),
    ...(update.handwash_portable !== undefined && { handwash_portable: update.handwash_portable }),
    ...(update.handwash_host !== undefined && { handwash_host: update.handwash_host }),
    ...(update.sanitize_at_host !== undefined && { sanitize_at_host: update.sanitize_at_host }),
    ...(update.host_3_compartment !== undefined && { host_3_compartment: update.host_3_compartment }),
    ...(update.sanitize_at_pff !== undefined && { sanitize_at_pff: update.sanitize_at_pff }),
    ...(update.extra_supplies_brought !== undefined && { extra_supplies_brought: update.extra_supplies_brought }),
    ...(update.sanitizer_chlorine !== undefined && { sanitizer_chlorine: update.sanitizer_chlorine }),
    ...(update.sanitizer_quat !== undefined && { sanitizer_quat: update.sanitizer_quat }),
    ...(update.sanitizer_iodine !== undefined && { sanitizer_iodine: update.sanitizer_iodine }),
    ...(update.refuse_at_pff !== undefined && { refuse_at_pff: update.refuse_at_pff }),
    ...(update.refuse_at_host !== undefined && { refuse_at_host: update.refuse_at_host }),
    ...(update.host_facilities !== undefined && { host_facilities: update.host_facilities }),
    ...(update.agreement_initialed !== undefined && { agreement_initialed: update.agreement_initialed }),
    ...(update.signature_name !== undefined && { signature_name: update.signature_name }),
    ...(update.signature_title !== undefined && { signature_title: update.signature_title }),
  };
}
