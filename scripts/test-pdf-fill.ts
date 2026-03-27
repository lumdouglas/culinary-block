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
    // Owner / Contact info
    catering_dba: "TEST: Sakura Bento Catering",
    owner_name: "TEST: Jane Tanaka",
    owner_address: "TEST: 456 Elm Street, Apt 2B",
    owner_city: "TEST: San Jose",
    owner_state: "CA",
    owner_zip: "95112",
    owner_phone: "(408) 555-9876",
    owner_email: "jane@sakurabento.com",

    // Permanent Food Facility (pre-filled for Culinary Block)
    pff_name: "Culinary Block",
    pff_address: "1901 Las Plumas Ave, San Jose, CA 95133",
    pff_county: "Santa Clara",

    // Menu items — one of each category to test all PDF sections
    menu_items: [
        {
            food: "TEST: Onigiri Rice Balls",
            category: "complex",
            ingredients: "TEST: Sushi rice, nori seaweed, salmon flakes, tuna, mayonnaise, sesame seeds",
            procedures: "1. Storage: Rice stored dry at room temp; salmon/tuna refrigerated at 41°F.\n2. Preparation: Cook rice to 185°F. Cool rice to 41°F within 4 hrs.\n3. Cooking: N/A — rice already cooked. Fillings pre-cooked to 165°F.\n4. Cooling: Assembled onigiri cooled to 41°F within 2 hours.\n5. Reheating: If reheated, brought to 165°F for 15 seconds.\n6. Delivery: Transported in Cambro at 41°F or below. Temp logged."
        },
        {
            food: "TEST: Chicken Teriyaki Bowl",
            category: "cook-to-serve",
            ingredients: "TEST: Chicken thighs, teriyaki sauce, steamed rice, steamed broccoli",
            procedures: "1. Storage: Raw chicken at 41°F. Sauce and rice dry storage.\n2. Preparation: Chicken marinated 2 hrs max at 41°F.\n3. Cooking: Chicken grilled to internal temp 165°F for 15 sec.\n4. Cooling: Not cooled — served immediately after cooking.\n5. Reheating: N/A — cook-to-serve.\n6. Delivery: Hot held at 135°F+ in Cambro insulated carrier."
        },
        {
            food: "TEST: Green Salad",
            category: "no-cook",
            ingredients: "TEST: Mixed greens, cherry tomatoes, cucumber, ranch dressing",
            procedures: "1. Storage: Greens refrigerated at 41°F.\n2. Preparation: Washed and chopped. Dressing portioned.\n3. Cooking: N/A — no-cook item.\n4. Cooling: N/A — already cold.\n5. Reheating: N/A.\n6. Delivery: Kept cold at 41°F in coolers with ice packs."
        },
        {
            food: "TEST: Miso Soup",
            category: "cook-to-serve",
            ingredients: "TEST: Dashi stock, white miso paste, tofu, wakame seaweed, green onion",
            procedures: "1. Storage: Tofu at 41°F. Dry ingredients at room temp.\n2. Preparation: Dice tofu. Rehydrate wakame.\n3. Cooking: Bring dashi to 180°F, add miso. Do not boil. Serve at 135°F+.\n4. Cooling: N/A — served immediately.\n5. Reheating: N/A.\n6. Delivery: Transported hot at 135°F+ in insulated Cambro."
        },
        {
            food: "TEST: Beef Sukiyaki",
            category: "complex",
            ingredients: "TEST: Sliced beef, onion, tofu, shiitake mushrooms, soy sauce, sugar, mirin",
            procedures: "1. Storage: Beef at 41°F. Vegetables at 41°F. Sauces at room temp.\n2. Preparation: Slice beef thinly. Prepare vegetables.\n3. Cooking: Cook beef and vegetables to 165°F internal.\n4. Cooling: Cool from 135°F to 70°F in 2 hrs, then 70°F to 41°F in 4 hrs.\n5. Reheating: Reheat to 165°F for 15 seconds before serving.\n6. Delivery: Hot held at 135°F+ in insulated Cambro carrier."
        }
    ],

    // Operations
    delivery_method: "on-site",
    employee_count: 3,
    operating_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    operating_times: "TEST: 7am - 11am (Morning)",
    customer_types: ["corporate", "party", "individual"],
    order_methods: ["internet", "phone"],

    // Sanitization
    sanitize_method: "manual",
    sanitizer_chlorine: true,
    sanitizer_quat: false,
    sanitizer_iodine: false,

    // Ingredient Sources
    ingredient_sources: ["Restaurant Depot", "Costco", "Local Grocery"],

    // Transport
    transport_cambro: true,
    transport_refrigerated_truck: true,
    transport_coolers: true,
    transport_other: "TEST: Personal vehicle with temp log",

    // Agreement
    agreement_initialed: true,
    signature_name: "TEST: Jane Tanaka",
    signature_title: "Owner"
};

async function run() {
    try {
        const bytes = await generatePermitPdf(mockData);
        writeFileSync("/tmp/test-filled-permit.pdf", bytes);
        console.log("✅ PDF written to /tmp/test-filled-permit.pdf");
        console.log(`   Size: ${Math.round(bytes.byteLength / 1024)} KB`);
        console.log("   Open it with: open /tmp/test-filled-permit.pdf");
    } catch (e) {
        console.error("Test failed", e);
    }
}

run();
