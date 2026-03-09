import { PDFDocument } from "pdf-lib";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfPath = join(__dirname, "../public/assets/catering-packet-2025-08-25.pdf");
const bytes = readFileSync(pdfPath);
const doc = await PDFDocument.load(bytes);

const form = doc.getForm();
const fields = form.getFields();

console.log("Pages:", doc.getPageCount());
console.log("Fields:", fields.length);

for (const field of fields) {
    const name = field.getName();
    const type = field.constructor.name;
    let extra = "";
    if (type === "PDFRadioGroup" || type === "PDFCheckBox") {
        try {
            if (typeof field.getOptions === 'function') {
                extra = JSON.stringify(field.getOptions());
            }
        } catch (e) { }
    }
    console.log(`[${type}] "${name}" ${extra}`);
}
