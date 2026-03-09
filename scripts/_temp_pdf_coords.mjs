import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfPath = join(__dirname, "../public/assets/catering-packet-2025-08-25.pdf");
const outPath = join(__dirname, "../public/assets/catering-packet-test-2.pdf");

const bytes = readFileSync(pdfPath);
const doc = await PDFDocument.load(bytes);
const font = await doc.embedFont(StandardFonts.Helvetica);

const pages = doc.getPages();

const drawGrid = (pageIndex) => {
    const page = pages[pageIndex];
    const { width, height } = page.getSize();
    for (let x = 0; x < width; x += 25) {
        page.drawLine({
            start: { x, y: 0 },
            end: { x, y: height },
            thickness: x % 100 === 0 ? 1 : 0.5,
            color: x % 100 === 0 ? rgb(1, 0, 0) : rgb(0.8, 0.8, 0.8),
        });
        if (x % 50 === 0) {
            page.drawText(x.toString(), { x: x + 2, y: height / 2, size: 8, font, color: rgb(1, 0, 0) });
        }
    }
    for (let y = 0; y < height; y += 25) {
        page.drawLine({
            start: { x: 0, y },
            end: { x: width, y },
            thickness: y % 100 === 0 ? 1 : 0.5,
            color: y % 100 === 0 ? rgb(1, 0, 0) : rgb(0.8, 0.8, 0.8),
        });
        if (y % 50 === 0) {
            page.drawText(y.toString(), { x: width / 2, y: y + 2, size: 8, font, color: rgb(1, 0, 0) });
        }
    }
};

[1, 2, 3, 4, 5, 6, 12, 13].forEach(drawGrid); // Target pages

const saved = await doc.save();
writeFileSync(outPath, saved);
console.log("Saved detailed grid test PDF to", outPath);
