// Run: node scripts/extract-pdf-fields.mjs
import { PDFDocument } from "pdf-lib";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfPath = join(__dirname, "../public/assets/catering-permit-blank.pdf");
const bytes = readFileSync(pdfPath);
const doc = await PDFDocument.load(bytes);

const form = doc.getForm();
const fields = form.getFields();

for (const field of fields) {
  const name = field.getName();
  const type = field.constructor.name;
  if (type === "PDFRadioGroup") {
    const opts = field.getOptions();
    console.log(`  [${type}] "${name}" options: ${JSON.stringify(opts)}`);
  }
}
