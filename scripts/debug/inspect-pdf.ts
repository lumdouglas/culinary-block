import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';

async function run() {
    try {
        const pdfBytes = fs.readFileSync('public/assets/catering-permit-blank.pdf');
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const fields = form.getFields();

        console.log('--- AcroForm Fields ---');
        fields.forEach(field => {
            const type = field.constructor.name;
            const name = field.getName();
            console.log(`${name}: ${type}`);
        });
    } catch (error) {
        console.error('Error reading PDF:', error);
    }
}

run();
