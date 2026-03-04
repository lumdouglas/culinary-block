// Quick smoke test: node scripts/test-pdf-fill.mjs
// Writes a filled PDF to /tmp/test-filled-permit.pdf

import { PDFDocument } from "pdf-lib";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfPath = join(__dirname, "../public/assets/catering-permit-blank.pdf");
const pdfBytes = readFileSync(pdfPath);
const doc = await PDFDocument.load(pdfBytes);
const form = doc.getForm();

const tf = (name, value) => { try { form.getTextField(name).setText(value); } catch(e) { console.warn("TF skip:", name, e.message); } };
const cb = (name, v) => { try { v ? form.getCheckBox(name).check() : form.getCheckBox(name).uncheck(); } catch(e) { console.warn("CB skip:", name, e.message); } };
const radio = (name, v) => { try { form.getRadioGroup(name).select(v); } catch(e) { console.warn("Radio skip:", name, e.message); } };

tf("Name of Catering Operation DBA", "Maria's Kitchen");
tf("Owner Name", "Maria Garcia");
tf("Owner Phone Number", "408-555-1234");
tf("Owner Email", "maria@mariaskitchen.com");
tf("Name", "Culinary Block");
tf("Address", "1901 Las Plumas Ave, San Jose, CA 95133");
tf("County", "Santa Clara");

tf("Food Item 1", "Tamales (chicken and pork)");
tf("Food Item 1P", "Dispensing, hot holding at 135°F or above");
tf("Food Item 2", "Horchata");
tf("Food Item 2P", "Dispensing, cold holding at 41°F or below");
tf("Food Item 3", "Chips and salsa");
tf("Food Item 3P", "Dispensing");

cb("Cambro", true);
cb("Temperature control 135F or above OR 41F or below", true);
tf("Equipment", "Cambro containers, chafing dishes with Sterno, ice baths");
cb("Portable Handwash", true);
cb("Host Facility", true);
radio("Does the Host Facility have a 3-compartment ware washing sink", "Yes");
radio("Will extra supplies utensilsequipment be brought into Host Facility", "Yes");
cb("Contact with a solution of 100 parts per million ppm available chlorine for at least 30 sec", true);
cb("At permanent food facility", true);

tf("Host Facility NameRow1", "San Jose Civic Center");
tf("Street AddressRow1", "200 E Santa Clara St");
tf("CityRow1", "San Jose");

const initials = "MG";
for (let n = 1; n <= 20; n++) {
  const names = {
    1: "Initial1 All food prior to the host facility shall be stored and prepared at the permanent food facilitycatering kitchen Home preparation of food is prohibited",
    2: "Initial2 The Catering Operation shall conduct only limited food preparation as defined by CRFC section 113818",
    3: "Initial3 A catering operation may only operate for up to 4 hours in any one 12hour period unless otherwise approved by the enforcement agency",
    4: "Initial4 The Catering Operation shall post a sign with the name of the catering operation name of the operator permanent food facility address and the hours of operation at the Host Facility The most recent inspection report shall be made available to any consumer or enforcement agency upon request",
    5: "Initial5 Catering Operations records shall be maintained and kept for 90 days after the event that includes location date time customer contact information menu and food transportation temperature logs",
    6: "Initial6 Provide copies of food handler cards and food safety certification upon request at the Host Facility",
    7: "Initial7 Potentially hazardous foods PHFs shall be discarded at the end of the catering event unless PHFs was held at required temperature and protected from contamination at all times If Time is used as a Public Health Control TPHC and approved prior by the enforcement agency all food shall be discarded at the end of food service",
    8: "Initial8 Food will be discarded when it has been contaminated or was subject to improper holdingcooking temperatures",
    9: "Initial9 Food and utensils shall be protected from contamination at all times",
    10: "Initial10 Contaminated utensils shall be replaced with an adequate supply of clean utensils",
    11: "Initial11 Consumers shall use a clean plate if returning to the selfservice line",
    12: "Initial12 Utensils and equipment are certified or ANSI equivalent",
    13: "Initial13 The interior of the vehicle used to transport food shall be constructed of smooth visible impervious material and maintained clean and free from debris",
    14: "Initial14 Potable water is available and an adequate supply is provided at the catering operation",
    15: "Initial15 A handwashing sink shall be unobstructed and supplied with warm water soap and paper towels and is located within the food service area",
    16: "Initial16 Restrooms are available within 200 feet of the food service area",
    17: "Initial17 Garbage and refuse are disposed of in an approved manner",
    18: "Initial18 Liquid waste are disposed of in an approved plumbing system",
    19: "Initial19 Food beverages equipment and utensils are not stored in a private home",
    20: "Initial20 Overhead protection shall be provided at the food service area",
  };
  if (names[n]) tf(names[n], initials);
}

tf("Printed Name  Title", "Maria Garcia / Owner");
tf("Date1_af_date", "03/03/2026");

form.flatten();
const out = await doc.save();
writeFileSync("/tmp/test-filled-permit.pdf", out);
console.log("✅ PDF written to /tmp/test-filled-permit.pdf");
console.log(`   Size: ${Math.round(out.byteLength / 1024)} KB`);
