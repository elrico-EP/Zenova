// Debug script to understand Excel structure
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const correctFile = join(__dirname, '../docs/Turnos reales enero y febrero.xlsx');

console.log('Reading file...');
const workbook = XLSX.readFile(correctFile);

console.log('\n=== SHEET NAMES ===');
console.log(workbook.SheetNames);

workbook.SheetNames.forEach((sheetName, idx) => {
  console.log(`\n=== SHEET ${idx + 1}: ${sheetName} ===`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  console.log(`Rows: ${data.length}`);
  console.log('\nFirst 30 rows:');
  data.slice(0, 30).forEach((row, i) => {
    console.log(`Row ${i}:`, JSON.stringify(row));
  });
});
