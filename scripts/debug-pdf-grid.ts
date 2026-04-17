// Debug script: draws a coordinate grid on each page of the PDF
// so we can visually identify the exact Y positions of each form row.
// Run: npx tsx scripts/debug-pdf-grid.ts && open /tmp/debug-pdf-grid.pdf
import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
    const pdfPath = join(__dirname, "../public/assets/catering-packet-2025-08-25.pdf");
    const bytes = readFileSync(pdfPath);
    const doc = await PDFDocument.load(bytes);
    const pages = doc.getPages();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const red = rgb(1, 0, 0);
    const blue = rgb(0, 0, 1);

    // Draw horizontal guide lines every 25 points on pages 2, 5, 6 (indices 1, 4, 5)
    const targetPages = [1, 2, 4, 5, 6, 7, 12, 13];
    
    for (const pageIdx of targetPages) {
        if (pageIdx >= pages.length) continue;
        const page = pages[pageIdx];
        const { width, height } = page.getSize();
        
        // Draw horizontal lines every 25 points with Y labels
        for (let y = 0; y <= height; y += 25) {
            // Draw a thin red line
            page.drawLine({
                start: { x: 0, y },
                end: { x: width, y },
                thickness: 0.3,
                color: red,
                opacity: 0.4,
            });
            // Label the Y coordinate on the left margin
            page.drawText(`y=${y}`, {
                x: 2,
                y: y + 1,
                size: 6,
                font,
                color: red,
            });
        }
        
        // Draw vertical lines every 50 points with X labels
        for (let x = 0; x <= width; x += 50) {
            page.drawLine({
                start: { x, y: 0 },
                end: { x, y: height },
                thickness: 0.3,
                color: blue,
                opacity: 0.2,
            });
            page.drawText(`x=${x}`, {
                x: x + 1,
                y: 2,
                size: 5,
                font,
                color: blue,
            });
        }
        
        // Add page label
        page.drawText(`PAGE ${pageIdx + 1} (index ${pageIdx})`, {
            x: width - 150,
            y: height - 15,
            size: 8,
            font,
            color: red,
        });
    }

    const saved = await doc.save();
    writeFileSync("/tmp/debug-pdf-grid.pdf", saved);
    console.log("✅ Debug grid PDF written to /tmp/debug-pdf-grid.pdf");
    console.log(`   Pages gridded: ${targetPages.map(p => p+1).join(", ")}`);
}

run();
