// Quick smoke test: npx tsx scripts/test-pdf-fill.ts
// Writes a filled PDF to /tmp/test-filled-permit.pdf
import { writeFileSync } from "fs";
import { generatePermitPdf } from "../lib/catering-permit-pdf";

// Mock the environment so pdf-lib loads (generatePermitPdf is a browser-only function usually)
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
(global as any).window = {
    PDFLib: { PDFDocument, rgb, StandardFonts }
};

// Mock fetch to read the local file instead of a network request
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

(global as any).fetch = async (url: string) => {
    if (url === "/assets/catering-packet-2025-08-25.pdf") {
        const pdfPath = join(__dirname, "../public/assets/catering-packet-2025-08-25.pdf");
        const bytes = readFileSync(pdfPath);
        return {
            ok: true,
            arrayBuffer: async () => bytes.buffer
        };
    }
    throw new Error("Mock fetch: Unknown URL " + url);
};

const mockData: any = {
    catering_dba: "Maria's Kitchen",
    owner_name: "Maria Garcia",
    owner_address: "123 Home St",
    owner_city: "San Jose",
    owner_state: "CA",
    owner_zip: "95111",
    owner_phone: "408-555-1234",
    owner_email: "maria@mariaskitchen.com",
    pff_name: "Culinary Block",
    pff_address: "1901 Las Plumas Ave, San Jose, CA 95133",
    pff_county: "Santa Clara",
    menu_items: [
        {
            food: "Tamales (chicken and pork)",
            category: "complex",
            ingredients: "Masa, chicken, pork, authentic spices, corn husks",
            procedures: "1. Store raw meat at 41F.\n2. Prep masa and fillings.\n3. Cook fillings to 165F.\n4. Cool to 70F in 2hrs, 41F in 4hrs.\n5. Reheat to 165F before transport.\n6. Transport hot > 135F in Cambro."
        },
        {
            food: "Horchata",
            category: "no-cook",
            ingredients: "Rice water, cinnamon, sugar",
            procedures: "1. Store dry ingredients.\n2. Mix with filtered water.\n3. Chill to 41F.\n4. Serve cold over ice."
        }
    ],
    delivery_method: "on-site",
    employee_count: 2,
    operating_days: ["Mon", "Wed", "Fri"],
    operating_times: "8:00 AM - 2:00 PM",
    customer_types: ["corporate", "party", "individual"],
    order_methods: ["internet", "phone"],
    sanitize_method: "manual",
    sanitizer_chlorine: true,
    ingredient_sources: ["Costco", "Restaurant Depot"],
    transport_cambro: true,
    transport_coolers: true,
    agreement_initialed: true,
    signature_name: "Maria Garcia",
    signature_title: "Owner"
};

async function run() {
    try {
        const bytes = await generatePermitPdf(mockData);
        writeFileSync("/tmp/test-filled-permit.pdf", bytes);
        console.log("✅ PDF written to /tmp/test-filled-permit.pdf");
        console.log(`   Size: ${Math.round(bytes.byteLength / 1024)} KB`);
    } catch (e) {
        console.error("Test failed", e);
    }
}

run();
