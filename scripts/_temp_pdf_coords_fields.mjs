import { PDFDocument, rgb } from "pdf-lib";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfPath = join(__dirname, "../public/assets/catering-packet-2025-08-25.pdf");
const outPath = join(__dirname, "../public/assets/catering-packet-test-fields.pdf");

const bytes = readFileSync(pdfPath);
const doc = await PDFDocument.load(bytes);
const pages = doc.getPages();

const drawText = (pageIndex, text, x, y, size = 10, align = "left", color = rgb(0, 0, 1)) => {
    const page = pages[pageIndex];
    page.drawText(text, { x, y, size, color });
};
const drawCheck = (pageIndex, x, y, size = 12) => {
    const page = pages[pageIndex];
    page.drawText("X", { x, y, size, color: rgb(1, 0, 0) });
};

// ==========================================
// PAGE 7 (Index 6) - WOPS Section B.1
// ==========================================
let startY = 560;
for (let i = 0; i < 10; i++) {
    drawText(6, `Menu Item ${i + 1}`, 80, startY - (i * 25));
    drawText(6, `Ingredients for Item ${i + 1}`, 300, startY - (i * 25), 8);
}

// B.2 to B.4 (Categories)
drawText(6, "No cook item 1", 80, 222);
drawText(6, "Cook to serve item 1", 80, 150);
drawText(6, "Complex item 1", 80, 72);

// ==========================================
// PAGE 8 (Index 7) - Procedure Page 1
// ==========================================
drawText(7, "Pork Belly Steamed Buns", 150, 680, 12); // Menu Item Name
drawText(7, "Storage procedure with temps", 100, 620, 9); // Step 1
drawText(7, "Prep procedure", 100, 520, 9); // Step 2
drawText(7, "Cook procedure min temps", 100, 420, 9); // Step 3
drawText(7, "Cool procedure time logs", 100, 310, 9); // Step 4
drawText(7, "Reheat procedure", 100, 210, 9); // Step 5
drawText(7, "Delivery procedure", 100, 120, 9); // Step 6

// ==========================================
// PAGE 13 (Index 12) - WOPS D & E
// ==========================================
// Sanitizer type
drawCheck(12, 102, 575); // Manual
// Chlorine / Quat / Iodine
drawCheck(12, 102, 517); // Chlorine
// Transport Method
drawText(12, "In Cambro containers", 100, 312);
drawText(12, "Cambro insulated boxes", 260, 260);
drawCheck(12, 98, 224); // Delivery
// Initials 1-5
drawText(12, "XY", 300, 155, 12, "left", rgb(1, 0, 0));
drawText(12, "XY", 300, 125, 12, "left", rgb(1, 0, 0));
drawText(12, "XY", 300, 95, 12, "left", rgb(1, 0, 0));
drawText(12, "XY", 300, 70, 12, "left", rgb(1, 0, 0));
drawText(12, "XY", 300, 40, 12, "left", rgb(1, 0, 0));

// ==========================================
// PAGE 14 (Index 13) - WOPS E continued
// ==========================================
// Initials 6-9
drawText(13, "XY", 300, 672, 12, "left", rgb(1, 0, 0));
drawText(13, "XY", 300, 650, 12, "left", rgb(1, 0, 0));
drawText(13, "XY", 300, 620, 12, "left", rgb(1, 0, 0));
drawText(13, "XY", 300, 590, 12, "left", rgb(1, 0, 0));

// Signature
drawText(13, "Owner/Operator X Name", 50, 490);
drawText(13, "12/31/2026", 450, 490);

const saved = await doc.save();
writeFileSync(outPath, saved);
console.log("Saved test fields to", outPath);
