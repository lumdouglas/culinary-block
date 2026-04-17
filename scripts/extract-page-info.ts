// Extracts raw page dimensions and content stream text positions from the PDF.
// Run: npx tsx scripts/extract-page-info.ts
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PDFDocument } from "pdf-lib";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
    const pdfPath = join(__dirname, "../public/assets/catering-packet-2025-08-25.pdf");
    const bytes = readFileSync(pdfPath);
    const doc = await PDFDocument.load(bytes);
    const pages = doc.getPages();

    console.log(`Total pages: ${pages.length}\n`);

    // Just print page dimensions for key pages
    const targetPages = [1, 2, 4, 5, 6, 7, 12, 13];
    for (const idx of targetPages) {
        if (idx >= pages.length) continue;
        const page = pages[idx];
        const { width, height } = page.getSize();
        console.log(`Page ${idx + 1} (index ${idx}): ${width} x ${height} pts`);
    }
}

run();
