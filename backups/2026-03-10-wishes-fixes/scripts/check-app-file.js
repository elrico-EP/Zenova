// Extract schedule from "Turnos aplicacion" file
import XLSX from 'xlsx';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const appFile = join(__dirname, '../docs/Turnos aplicacion Enero y Febrero.xlsx');

console.log('Reading schedule from application...');
const workbook = XLSX.readFile(appFile);

console.log('\n=== SHEETS ===');
console.log(workbook.SheetNames);

workbook.SheetNames.forEach((sheetName) => {
  console.log(`\n=== Processing: ${sheetName} ===`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  // Show first 20 rows
  console.log('\nFirst 20 rows:');
  data.slice(0, 20).forEach((row, i) => {
    console.log(`Row ${i}:`, JSON.stringify(row).substring(0, 200));
  });
});
